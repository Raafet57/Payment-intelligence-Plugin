// Generated from src/lib/iso20022/detect.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { findDescendantsByLocalName, getLocalName } from "./dom.mjs";
const KNOWN_KINDS = new Set([
    "pacs.002",
    "pacs.004",
    "pacs.008",
    "pacs.009",
    "camt.052",
    "camt.053",
    "camt.054",
    "camt.029",
    "camt.056",
    "camt.110",
    "camt.111",
]);
const NAMESPACE_REGEX = /:(pacs|camt)\.(\d{3})\.\d+\.\d+$/;
/**
 * Identify the ISO 20022 message kind by inspecting the namespace of the `Document`
 * element and falling back to the AppHdr `MsgDefIdr` value. Returns `"unknown"` when no
 * recognised pattern matches.
 */
export function detectMessageKind(doc) {
    const docElements = findDescendantsByLocalName(doc.documentElement, "Document");
    for (const docEl of docElements) {
        const ns = docEl.namespaceURI;
        if (ns) {
            const matched = matchKindFromNamespace(ns);
            if (matched)
                return matched;
        }
        // Fallback: child element of Document is named like FIToFICstmrCdtTrf etc., but the
        // namespace is the canonical signal and avoids guessing from less-distinctive names.
    }
    const idrs = findDescendantsByLocalName(doc.documentElement, "MsgDefIdr");
    for (const idr of idrs) {
        const text = (idr.textContent ?? "").trim();
        const fromIdr = matchKindFromIdr(text);
        if (fromIdr)
            return fromIdr;
    }
    // Last resort: inspect root element local name (some samples wrap in Envelope only).
    const root = doc.documentElement;
    if (getLocalName(root) === "Document" && root.namespaceURI) {
        const matched = matchKindFromNamespace(root.namespaceURI);
        if (matched)
            return matched;
    }
    return "unknown";
}
function matchKindFromNamespace(ns) {
    const match = NAMESPACE_REGEX.exec(ns);
    if (!match)
        return null;
    const candidate = `${match[1]}.${match[2]}`;
    return KNOWN_KINDS.has(candidate) ? candidate : null;
}
function matchKindFromIdr(value) {
    const match = /^(pacs|camt)\.(\d{3})/.exec(value);
    if (!match)
        return null;
    const candidate = `${match[1]}.${match[2]}`;
    return KNOWN_KINDS.has(candidate) ? candidate : null;
}
