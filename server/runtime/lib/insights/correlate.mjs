// Generated from src/lib/insights/correlate.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { buildTimeline } from "./timeline.mjs";
import { warningsForDocuments } from "./warnings.mjs";
import { EMPTY_KEYS } from "./types.mjs";
const KEY_PRIORITY = ["uetr", "endToEndId", "txId", "instrId", "msgId"];
class UnionFind {
    parent;
    constructor(size) {
        this.parent = Array.from({ length: size }, (_, index) => index);
    }
    find(index) {
        const parent = this.parent[index];
        if (parent === index)
            return index;
        const root = this.find(parent);
        this.parent[index] = root;
        return root;
    }
    union(a, b) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra === rb)
            return;
        if (ra < rb)
            this.parent[rb] = ra;
        else
            this.parent[ra] = rb;
    }
}
function clean(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
function hasTransactionSpecificKey(entry) {
    return Boolean(clean(entry.uetr) ??
        clean(entry.endToEndId) ??
        clean(entry.txId) ??
        clean(entry.instrId) ??
        clean(entry.originalUetr ?? null) ??
        clean(entry.originalEndToEndId ?? null) ??
        clean(entry.originalTxId ?? null) ??
        clean(entry.originalInstrId ?? null));
}
function keysFromEntry(doc, entry, multiUnit) {
    const includeDocumentGroupKeys = !multiUnit || !hasTransactionSpecificKey(entry);
    return {
        ...EMPTY_KEYS,
        uetr: entry.uetr,
        endToEndId: entry.endToEndId,
        txId: entry.txId,
        instrId: entry.instrId,
        msgId: includeDocumentGroupKeys ? (entry.msgId ?? doc.keys.msgId) : null,
        originalUetr: entry.originalUetr ?? null,
        originalEndToEndId: entry.originalEndToEndId ?? null,
        originalTxId: entry.originalTxId ?? null,
        originalInstrId: entry.originalInstrId ?? null,
        originalMsgId: includeDocumentGroupKeys
            ? (entry.originalMsgId ?? doc.keys.originalMsgId)
            : null,
    };
}
function expandDocumentForCorrelation(doc) {
    if (doc.entryKeys.length === 0)
        return [doc];
    const multiUnit = doc.entryKeys.length > 1;
    return doc.entryKeys.map((entry, index) => ({
        ...doc,
        id: multiUnit ? `${doc.id}#${index + 1}` : doc.id,
        keys: keysFromEntry(doc, entry, multiUnit),
        entryKeys: [],
        status: entry.status ?? doc.status,
        amount: entry.amount ?? doc.amount,
        settlementDate: entry.bookingDate ?? entry.valueDate ?? doc.settlementDate,
        unitIndex: index,
        unitCount: doc.entryKeys.length,
    }));
}
function expandDocumentsForCorrelation(documents) {
    return documents.flatMap(expandDocumentForCorrelation);
}
function forwardKeys(doc) {
    const out = [];
    KEY_PRIORITY.forEach((kind, priority) => {
        const direct = clean(doc.keys[kind]);
        if (direct)
            out.push({ kind, value: direct, priority });
    });
    return dedupeMatchKeys(out);
}
function originalKeys(doc) {
    const pairs = [
        ["uetr", "originalUetr"],
        ["endToEndId", "originalEndToEndId"],
        ["txId", "originalTxId"],
        ["instrId", "originalInstrId"],
        ["msgId", "originalMsgId"],
    ];
    return pairs
        .map(([kind, key]) => ({
        kind,
        value: clean(doc.keys[key]),
        priority: KEY_PRIORITY.indexOf(kind),
    }))
        .filter((item) => item.value !== null);
}
function labelKeys(doc) {
    const out = [];
    KEY_PRIORITY.forEach((kind, priority) => {
        const direct = clean(doc.keys[kind]);
        if (direct)
            out.push({ kind, value: direct, priority });
    });
    const originals = [
        ["originalUetr", doc.keys.originalUetr, 0],
        ["originalEndToEndId", doc.keys.originalEndToEndId, 1],
        ["originalTxId", doc.keys.originalTxId, 2],
        ["originalInstrId", doc.keys.originalInstrId, 3],
        ["originalMsgId", doc.keys.originalMsgId, 4],
    ];
    for (const [kind, value, priority] of originals) {
        const cleanValue = clean(value);
        if (cleanValue)
            out.push({ kind, value: cleanValue, priority: priority + 0.5 });
    }
    out.push({ kind: "fileName", value: doc.fileName, priority: 99 });
    return out;
}
function dedupeMatchKeys(keys) {
    const seen = new Set();
    return keys.filter((key) => {
        const token = `${key.kind}:${key.value}`;
        if (seen.has(token))
            return false;
        seen.add(token);
        return true;
    });
}
function bestShared(a, b) {
    const aForward = forwardKeys(a);
    const bForward = forwardKeys(b);
    const aOriginal = originalKeys(a);
    const bOriginal = originalKeys(b);
    const candidates = [];
    for (const left of aForward) {
        for (const right of bForward) {
            if (left.kind === right.kind && left.value === right.value)
                candidates.push(left);
        }
        for (const right of bOriginal) {
            if (left.kind === right.kind && left.value === right.value)
                candidates.push(left);
        }
    }
    for (const left of aOriginal) {
        for (const right of bForward) {
            if (left.kind === right.kind && left.value === right.value)
                candidates.push(left);
        }
    }
    return (candidates.sort((x, y) => x.priority - y.priority || x.value.localeCompare(y.value))[0] ?? null);
}
function bestLabel(documents, sharedByRoot, root) {
    const shared = sharedByRoot.get(root);
    if (shared)
        return shared;
    const sorted = documents
        .flatMap(labelKeys)
        .sort((a, b) => a.priority - b.priority || a.value.localeCompare(b.value));
    const first = sorted[0];
    if (first)
        return first;
    const fallbackDoc = documents[0];
    return { kind: "fileName", value: fallbackDoc?.fileName ?? "(unknown)", priority: 99 };
}
function threadId(key) {
    return `${key.kind}:${key.value}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
export function correlateDocuments(sourceDocuments) {
    const documents = expandDocumentsForCorrelation(sourceDocuments);
    const uf = new UnionFind(documents.length);
    const sharedByRoot = new Map();
    for (let i = 0; i < documents.length; i += 1) {
        for (let j = i + 1; j < documents.length; j += 1) {
            const shared = bestShared(documents[i], documents[j]);
            if (!shared)
                continue;
            uf.union(i, j);
            const root = uf.find(i);
            const existing = sharedByRoot.get(root);
            if (!existing || shared.priority < existing.priority)
                sharedByRoot.set(root, shared);
        }
    }
    const groups = new Map();
    documents.forEach((doc, index) => {
        const root = uf.find(index);
        groups.set(root, [...(groups.get(root) ?? []), doc]);
    });
    return Array.from(groups.entries())
        .map(([root, docs]) => {
        const ordered = [...docs].sort((a, b) => a.fileIndex - b.fileIndex);
        const strongestKey = bestLabel(ordered, sharedByRoot, root);
        const warnings = warningsForDocuments(ordered);
        return {
            id: threadId(strongestKey),
            strongestKey: { kind: strongestKey.kind, value: strongestKey.value },
            documents: ordered,
            events: buildTimeline(ordered),
            warnings,
            linked: ordered.length > 1,
        };
    })
        .sort((a, b) => {
        if (a.linked !== b.linked)
            return a.linked ? -1 : 1;
        return a.documents[0].fileIndex - b.documents[0].fileIndex;
    });
}
