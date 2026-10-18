// Generated from src/lib/insights/format.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
const THREAD_KEY_LABELS = {
    uetr: "UETR",
    originalUetr: "Original UETR",
    endToEndId: "End-to-end ID",
    originalEndToEndId: "Original end-to-end ID",
    txId: "Transaction ID",
    originalTxId: "Original transaction ID",
    instrId: "Instruction ID",
    originalInstrId: "Original instruction ID",
    msgId: "Message ID",
    originalMsgId: "Original message ID",
    fileName: "File name",
};
export function humanizeThreadKey(kind) {
    return THREAD_KEY_LABELS[kind];
}
