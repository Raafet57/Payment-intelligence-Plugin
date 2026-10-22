// Generated from src/lib/insights/extract.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { decodeReasonCode } from "./reasonCodes.mjs";
import { EMPTY_KEYS, } from "./types.mjs";
function copyKeys(overrides) {
    return { ...EMPTY_KEYS, ...overrides };
}
function partyLabel(party) {
    return party?.bic ?? party?.name ?? null;
}
function statusWithDecode(code, reasonCode) {
    if (!code && !reasonCode)
        return null;
    const reason = decodeReasonCode(reasonCode);
    return { code, reasonCode, reasonLabel: reason?.label ?? null };
}
function entryCorrelation(entry) {
    return {
        uetr: entry.uetr ?? null,
        endToEndId: entry.endToEndId,
        txId: entry.txId,
        instrId: entry.instrId ?? null,
        msgId: entry.msgId ?? null,
        originalUetr: entry.originalUetr ?? null,
        originalEndToEndId: entry.originalEndToEndId ?? null,
        originalTxId: entry.originalTxId ?? null,
        originalInstrId: entry.originalInstrId ?? null,
        originalMsgId: entry.originalMsgId ?? null,
        status: typeof entry.status === "string"
            ? { code: entry.status, reasonCode: null, reasonLabel: null }
            : (entry.status ?? null),
        amount: entry.amount,
        bookingDate: entry.bookingDate,
        valueDate: entry.valueDate,
        reference: entry.reference,
    };
}
function structuredTransactionEntry(tx) {
    const status = statusWithDecode(tx.status?.code ?? null, tx.status?.reasonCode ?? null);
    return entryCorrelation({
        uetr: tx.correlation?.uetr ?? null,
        endToEndId: tx.correlation?.endToEndId ?? null,
        txId: tx.correlation?.txId ?? null,
        instrId: tx.correlation?.instrId ?? null,
        msgId: tx.correlation?.msgId ?? null,
        originalUetr: tx.correlation?.originalUetr ?? null,
        originalEndToEndId: tx.correlation?.originalEndToEndId ?? null,
        originalTxId: tx.correlation?.originalTxId ?? null,
        originalInstrId: tx.correlation?.originalInstrId ?? null,
        originalMsgId: tx.correlation?.originalMsgId ?? null,
        status,
        amount: tx.amount ?? null,
        bookingDate: tx.bookingDate ?? null,
        valueDate: tx.valueDate ?? null,
        reference: tx.reference ?? null,
    });
}
export function extractRecord(story, fileName, fileIndex) {
    if (story.support === "unsupported") {
        throw new Error("Unsupported ISO 20022 message type for Payment Insights Lite.");
    }
    const base = {
        ok: true,
        id: `${fileIndex}:${fileName}`,
        fileName,
        fileIndex,
        story,
        agents: {
            instructing: null,
            instructed: null,
            debtorAgent: null,
            creditorAgent: null,
            intermediaries: [],
        },
    };
    if (story.support === "full" && (story.kind === "pacs.008" || story.kind === "pacs.009")) {
        const payment = story.data;
        return {
            ...base,
            kind: story.kind,
            keys: copyKeys({
                uetr: payment.references.uetr,
                endToEndId: payment.references.endToEndId,
                txId: payment.references.txId,
                instrId: payment.references.instrId,
                msgId: payment.references.msgId ?? payment.msgId,
            }),
            entryKeys: (payment.transactions ?? [payment]).map((tx) => entryCorrelation({
                uetr: tx.references.uetr,
                endToEndId: tx.references.endToEndId,
                txId: tx.references.txId,
                instrId: tx.references.instrId,
                msgId: tx.references.msgId,
                amount: tx.settlementAmount ?? tx.instructedAmount,
                bookingDate: tx.settlementDate,
                valueDate: tx.requestedExecutionDate,
                reference: tx.references.instrId ?? tx.references.endToEndId ?? tx.references.txId,
            })),
            status: null,
            agents: {
                instructing: partyLabel(payment.route.instructingAgent),
                instructed: partyLabel(payment.route.instructedAgent),
                debtorAgent: partyLabel(payment.route.debtorAgent),
                creditorAgent: partyLabel(payment.route.creditorAgent),
                intermediaries: payment.route.intermediaries
                    .map((party) => partyLabel(party))
                    .filter((value) => value !== null),
            },
            amount: payment.settlementAmount ?? payment.instructedAmount,
            createdAt: payment.createdAt,
            settlementDate: payment.settlementDate,
        };
    }
    if (story.support === "full" && story.kind === "camt.053") {
        const stmt = story.data;
        return {
            ...base,
            kind: story.kind,
            keys: copyKeys({ msgId: stmt.msgId }),
            entryKeys: stmt.entries.map(entryCorrelation),
            status: null,
            amount: stmt.entries[0]?.amount ?? null,
            createdAt: stmt.createdAt,
            settlementDate: stmt.entries[0]?.bookingDate ?? stmt.entries[0]?.valueDate ?? null,
        };
    }
    const summary = story.data;
    const keys = copyKeys({
        uetr: summary.correlation?.uetr ?? null,
        endToEndId: summary.correlation?.endToEndId ?? null,
        txId: summary.correlation?.txId ?? null,
        instrId: summary.correlation?.instrId ?? null,
        msgId: summary.correlation?.msgId ?? summary.msgId,
        originalUetr: summary.correlation?.originalUetr ?? null,
        originalEndToEndId: summary.correlation?.originalEndToEndId ?? null,
        originalTxId: summary.correlation?.originalTxId ?? null,
        originalInstrId: summary.correlation?.originalInstrId ?? null,
        originalMsgId: summary.correlation?.originalMsgId ?? null,
        caseId: summary.case?.caseId ?? null,
    });
    const structuredEntries = summary.transactions && summary.transactions.length > 0
        ? summary.transactions.map(structuredTransactionEntry)
        : summary.entries.map(entryCorrelation);
    return {
        ...base,
        kind: story.kind,
        keys,
        entryKeys: structuredEntries,
        status: statusWithDecode(summary.status?.code ?? null, summary.status?.reasonCode ?? null),
        amount: structuredEntries[0]?.amount ?? null,
        createdAt: summary.createdAt,
        settlementDate: structuredEntries[0]?.bookingDate ?? structuredEntries[0]?.valueDate ?? null,
    };
}
