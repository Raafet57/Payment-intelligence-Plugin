// Generated from src/lib/storyteller/insights.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Heuristic, schema-aware observations that supplement the narrative. Each insight
 * is a light interpretation of the parsed data · never a prescription. UI surfaces
 * them as flagged notes, not validation errors.
 */
export function generateInsights(story) {
    if (story.support === "unsupported")
        return [];
    if (story.support === "structured")
        return structuredInsights(story.data);
    return story.kind === "camt.053" ? statementInsights(story.data) : paymentInsights(story.data);
}
function paymentInsights(payment) {
    const out = [];
    if (payment.remittance.unstructured.length === 0 &&
        payment.remittance.structured.length === 0 &&
        !payment.purposeCode) {
        out.push({
            id: "missing-remittance",
            severity: "warn",
            message: "No remittance information or purpose code is present.",
        });
    }
    if (!payment.references.uetr) {
        out.push({
            id: "missing-uetr",
            severity: "warn",
            message: "UETR is missing · end-to-end tracking will not be possible.",
        });
    }
    const intermediaryCount = payment.route.intermediaries.length;
    if (intermediaryCount >= 2) {
        out.push({
            id: "long-route",
            severity: "info",
            message: `Routing involves ${intermediaryCount} intermediary banks · review for cost or delay impact.`,
        });
    }
    const settlementCcy = payment.settlementAmount?.currency ?? null;
    const instructedCcy = payment.instructedAmount?.currency ?? null;
    if (settlementCcy && instructedCcy && settlementCcy !== instructedCcy) {
        out.push({
            id: "currency-mismatch",
            severity: "info",
            message: `Settlement currency (${settlementCcy}) differs from instructed currency (${instructedCcy}); FX likely involved.`,
        });
    }
    if (payment.chargeBearer === "DEBT") {
        out.push({
            id: "charges-on-debtor",
            severity: "info",
            message: "Charges are borne entirely by the debtor (DEBT).",
        });
    }
    else if (payment.chargeBearer === "CRED") {
        out.push({
            id: "charges-on-creditor",
            severity: "warn",
            message: "Charges are borne entirely by the creditor (CRED) · beneficiary will receive less.",
        });
    }
    if (payment.charges.length > 0) {
        out.push({
            id: "explicit-charges",
            severity: "info",
            message: `Message declares ${payment.charges.length} explicit charge entr${payment.charges.length === 1 ? "y" : "ies"}.`,
        });
    }
    if (payment.kind === "pacs.008" && !payment.debtor?.name) {
        out.push({
            id: "missing-debtor-name",
            severity: "warn",
            message: "Debtor name is empty · KYC review may be required.",
        });
    }
    return out;
}
function statementInsights(stmt) {
    const out = [];
    if (stmt.entries.length === 0) {
        out.push({
            id: "empty-statement",
            severity: "info",
            message: "Statement contains no booked entries.",
        });
    }
    if (stmt.balances.length === 0) {
        out.push({
            id: "missing-balance",
            severity: "warn",
            message: "Statement has no balance records · closing position cannot be confirmed.",
        });
    }
    if (stmt.totals.credits > 0 && stmt.totals.debits === 0) {
        out.push({
            id: "credits-only",
            severity: "info",
            message: `All ${stmt.totals.credits} entries are credits.`,
        });
    }
    else if (stmt.totals.debits > 0 && stmt.totals.credits === 0) {
        out.push({
            id: "debits-only",
            severity: "info",
            message: `All ${stmt.totals.debits} entries are debits.`,
        });
    }
    const missingRefs = stmt.entries.filter((e) => !e.reference && !e.endToEndId).length;
    if (missingRefs > 0) {
        out.push({
            id: "entries-without-reference",
            severity: "warn",
            message: `${missingRefs} entr${missingRefs === 1 ? "y is" : "ies are"} missing both servicer reference and end-to-end ID.`,
        });
    }
    return out;
}
function structuredInsights(summary) {
    const out = [];
    const status = summary.rows.find((r) => r.label === "Status")?.value;
    const reason = summary.rows.find((r) => r.label === "Reason code")?.value;
    if (summary.kind === "pacs.002" && status === "RJCT") {
        out.push({
            id: "status-reject",
            severity: "warn",
            message: reason
                ? `Original payment was rejected (reason ${reason}).`
                : "Original payment was rejected.",
        });
    }
    if (summary.kind === "pacs.004" && reason) {
        out.push({
            id: "return-reason",
            severity: "warn",
            message: `Return carries reason code ${reason}.`,
        });
    }
    if (summary.case)
        out.push(...caseInsights(summary.case));
    if ((summary.kind === "camt.052" || summary.kind === "camt.054") &&
        summary.entries.length === 0) {
        out.push({
            id: "no-report-entries",
            severity: "info",
            message: "Report contains no entries.",
        });
    }
    return out;
}
const LEGACY_ROLES = new Set([
    "unable-to-apply",
    "claim-non-receipt",
    "additional-information",
    "modification-request",
]);
const STATUS_NOTE = {
    ASGN: "the request was assigned to the responder",
    DTRP: "the request was delivered to the responder",
    ARMD: "an automated reminder went to the responder",
    ERMD: "the requestor's reminder went to the responder",
    OBJT: "the requestor's objection went to the responder",
};
function caseInsights(c) {
    const out = [];
    const u = c.underlying;
    const quotesPayment = Boolean(u.uetr ?? u.endToEndId ?? u.txId ?? u.instrId ?? u.msgId);
    if (c.role === "investigation-response" || c.role === "investigation-status") {
        // Swift's camt.111 usage guidelines drop the underlying payment from the echoed request.
        if (!quotesPayment) {
            out.push({
                id: "case-response-by-eir",
                severity: "info",
                message: "This message quotes the case, not the payment. Load its camt.110 to link it to the payment by EIR.",
            });
        }
    }
    else if (!quotesPayment) {
        out.push({
            id: "case-no-underlying",
            severity: "warn",
            message: "Case message quotes no reference for the underlying payment.",
        });
    }
    else if (!u.uetr) {
        out.push({
            id: "case-missing-uetr",
            severity: "warn",
            message: "Case message does not quote the original UETR, so linking it to the payment is less reliable.",
        });
    }
    if (!c.caseId && c.role !== "tracker-alert" && c.role !== "investigation-status") {
        out.push({
            id: "case-missing-id",
            severity: "info",
            message: "No case reference (EIR, requestor investigation id or Case/Id) found; pair the request and answer by message and payment references.",
        });
    }
    if (c.role === "resolution" && c.statusCode === "RJCR") {
        out.push({
            id: "cancellation-rejected",
            severity: "warn",
            message: c.reasonCode
                ? `Cancellation request was rejected (reason ${c.reasonCode}).`
                : "Cancellation request was rejected.",
        });
    }
    if (c.role === "resolution" && c.statusCode === "CNCL") {
        out.push({
            id: "cancellation-accepted",
            severity: "info",
            message: "Cancellation was accepted; the funds should come back in a separate return message.",
        });
    }
    if (c.role === "resolution" && c.statusCode === "PDCR") {
        out.push({
            id: "cancellation-pending",
            severity: "info",
            message: "Cancellation is pending; expect a further camt.029 answer.",
        });
    }
    if (c.role === "investigation-status") {
        const meaning = c.statusCode ? STATUS_NOTE[c.statusCode] : undefined;
        out.push({
            id: "case-status-notification",
            severity: "info",
            message: `Swift case status${c.statusCode ? ` ${c.statusCode}` : ""}${meaning ? `: ${meaning}` : ""}. A notification from these files, not the case's current state.`,
        });
    }
    if (c.role === "tracker-alert") {
        const name = c.underlying.msgNmId;
        const concerned = name ? ` a ${/^\d/.test(name) ? `MT ${name}` : name} message` : " a message";
        out.push(c.statusCode === "WARN"
            ? {
                id: "tracker-warning",
                severity: "info",
                message: `Swift Tracker sent a warning about${concerned}.`,
            }
            : {
                id: "tracker-invalidated",
                severity: "warn",
                message: `Swift Tracker did not accept${concerned}${c.statusCode ? ` (${c.statusCode})` : ""}. It was not delivered as sent; look for a corrected resend.`,
            });
    }
    if (LEGACY_ROLES.has(c.role)) {
        out.push({
            id: "legacy-case-message",
            severity: "info",
            message: "Older ISO E&I message, exchanged bank to bank. In Swift Case Management, investigations use camt.110 and camt.111.",
        });
    }
    const booking = c.details.find((d) => d.label === "Booking confirmation");
    if (booking) {
        const amount = booking.rows.find((r) => r.label === "Amount")?.value;
        const valueDate = booking.rows.find((r) => r.label === "Value date")?.value;
        out.push({
            id: "booking-confirmed",
            severity: "info",
            message: `Responder confirms a booking${amount ? ` of ${amount}` : ""}${valueDate ? `, value date ${valueDate}` : ""}. Compare it with the payment and the creditor's account statement.`,
        });
    }
    if (c.embeddedMt) {
        const missing = c.embeddedMt.notCarried;
        out.push({
            id: "embedded-mt-copy",
            severity: "info",
            message: `Delivered with an MT ${c.embeddedMt.messageType ?? ""} copy for banks that read MT.${missing.length > 0 ? ` The copy leaves out: ${missing.join(", ")}.` : ""}`,
        });
    }
    return out;
}
