// Generated from src/lib/insights/warnings.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { CASE_KINDS } from "./types.mjs";
function hasCompanion(docs) {
    return docs.some((doc) => doc.kind === "pacs.002" ||
        doc.kind === "pacs.004" ||
        doc.kind === "camt.052" ||
        doc.kind === "camt.053" ||
        doc.kind === "camt.054");
}
export function warningsForDocuments(documents) {
    const warnings = [];
    const only = documents.length === 1 ? documents[0] : null;
    if (only?.kind === "pacs.002") {
        warnings.push({
            id: "unlinked-status",
            severity: "warn",
            message: "Status report is not linked to an original payment in the local files you provided.",
        });
    }
    if (only?.kind === "pacs.004") {
        warnings.push({
            id: "unlinked-return",
            severity: "warn",
            message: "Return message is not linked to an original payment in the local files you provided.",
        });
    }
    if (documents.every((doc) => CASE_KINDS.has(doc.kind))) {
        warnings.push({
            id: "unlinked-case",
            severity: "warn",
            message: "Case messages are not linked to an original payment in the local files you provided.",
        });
    }
    const hasCaseRequest = documents.some((doc) => doc.kind === "camt.056" || doc.kind === "camt.110");
    const hasCaseAnswer = documents.some((doc) => doc.kind === "camt.029" || doc.kind === "camt.111");
    if (!only && hasCaseRequest && !hasCaseAnswer) {
        warnings.push({
            id: "open-case",
            severity: "info",
            message: "A cancellation or investigation request has no camt.029 or camt.111 answer in the local files you provided.",
        });
    }
    if (documents.some((doc) => (doc.kind === "pacs.008" || doc.kind === "pacs.009") && !doc.keys.uetr)) {
        warnings.push({
            id: "missing-uetr",
            severity: "info",
            message: "Payment message is missing a UETR, so local lifecycle grouping is less reliable.",
        });
    }
    if (documents.some((doc) => doc.kind === "pacs.008" || doc.kind === "pacs.009") &&
        !hasCompanion(documents)) {
        warnings.push({
            id: "no-status-companion",
            severity: "info",
            message: "No status, return, account report, statement, or notification companion was loaded for this payment.",
        });
    }
    const currencies = new Set(documents.map((doc) => doc.amount?.currency).filter(Boolean));
    if (currencies.size > 1) {
        warnings.push({
            id: "currency-mismatch",
            severity: "info",
            message: "Documents in this local thread carry different currencies.",
        });
    }
    const amounts = new Set(documents
        .map((doc) => (doc.amount ? `${doc.amount.value}:${doc.amount.currency ?? ""}` : null))
        .filter((value) => value !== null));
    if (amounts.size > 1) {
        warnings.push({
            id: "amount-mismatch",
            severity: "info",
            message: "Documents in this local thread carry different amount values.",
        });
    }
    return warnings;
}
