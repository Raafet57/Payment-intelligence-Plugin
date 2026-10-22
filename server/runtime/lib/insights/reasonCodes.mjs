// Generated from src/lib/insights/reasonCodes.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
export const REASON_CODE_CAVEAT = "Curated source-safe subset; not an exhaustive ISO External Code Set.";
const CODE_MAP = {
    RJCT: {
        code: "RJCT",
        family: "status",
        label: "Rejected",
        demoNote: "In a pacs.002, the referenced payment was rejected. In a camt.111, the investigation was rejected.",
    },
    ACCP: {
        code: "ACCP",
        family: "status",
        label: "Accepted for processing",
        demoNote: "The status report says the payment was accepted for processing.",
    },
    ACSC: {
        code: "ACSC",
        family: "status",
        label: "Accepted settlement completed",
        demoNote: "The status report says settlement completed in the local message context.",
    },
    ACSP: {
        code: "ACSP",
        family: "status",
        label: "Accepted settlement in process",
        demoNote: "The status report says settlement is in process in the local message context.",
    },
    PDNG: {
        code: "PDNG",
        family: "status",
        label: "Pending",
        demoNote: "In a pacs.002, processing is pending. In a camt.111, the investigation is open and pending.",
    },
    AC03: {
        code: "AC03",
        family: "reason",
        label: "Invalid creditor account number",
        demoNote: "Suggested local check: verify the creditor account/IBAN details in your source file.",
    },
    AC04: {
        code: "AC04",
        family: "reason",
        label: "Closed account number",
        demoNote: "Suggested local check: confirm the account status with your operational source.",
    },
    AC06: {
        code: "AC06",
        family: "reason",
        label: "Blocked account",
        demoNote: "Suggested local check: confirm whether the account is blocked before retrying.",
    },
    AM04: {
        code: "AM04",
        family: "reason",
        label: "Insufficient funds",
        demoNote: "Suggested local check: verify funding before retrying or investigating liquidity.",
    },
    MD07: {
        code: "MD07",
        family: "reason",
        label: "Duplicate payment",
        demoNote: "Suggested local check: compare message identifiers and remittance details for duplicates.",
    },
    CNCL: {
        code: "CNCL",
        family: "status",
        label: "Cancelled as per request",
        demoNote: "camt.029 answer: the requested cancellation was successful. Expect the funds back.",
    },
    RJCR: {
        code: "RJCR",
        family: "status",
        label: "Rejected cancellation request",
        demoNote: "camt.029 answer: the cancellation was rejected. Check the rejection reason code.",
    },
    PDCR: {
        code: "PDCR",
        family: "status",
        label: "Pending cancellation request",
        demoNote: "camt.029 answer: the cancellation is still pending, so the case stays open.",
    },
    CLSD: {
        code: "CLSD",
        family: "status",
        label: "Investigation closed",
        demoNote: "camt.111 status: the investigation is closed. Check the status reason.",
    },
    CACR: {
        code: "CACR",
        family: "reason",
        label: "Closed as cancellation request sent",
        demoNote: "camt.111 status reason: the investigation was closed because a cancellation request was sent for the payment. Look for the camt.056.",
    },
    CAPR: {
        code: "CAPR",
        family: "reason",
        label: "Closed as per request",
        demoNote: "camt.111 status reason: the investigation was closed as the request asked.",
    },
    UTAP: {
        code: "UTAP",
        family: "reason",
        label: "Unable to apply by creditor",
        demoNote: "camt.110 investigation type: a booked entry cannot be applied by the creditor.",
    },
    CCNR: {
        code: "CCNR",
        family: "reason",
        label: "Creditor claims non-receipt",
        demoNote: "camt.110 investigation type: the creditor says the payment was not received.",
    },
    CONR: {
        code: "CONR",
        family: "reason",
        label: "Creditor agent claims cover non-receipt",
        demoNote: "camt.110 investigation type: the creditor agent says cover or settlement was not received.",
    },
    RQFI: {
        code: "RQFI",
        family: "reason",
        label: "Request for information",
        demoNote: "camt.110 investigation type: more information is needed on a payment, entry, message or instruction.",
    },
    REIN: {
        code: "REIN",
        family: "reason",
        label: "Remittance information",
        demoNote: "camt.110 investigation reason: remittance information is incorrect, incomplete or missing.",
    },
    DUPL: {
        code: "DUPL",
        family: "reason",
        label: "Duplicate payment",
        demoNote: "camt.056 cancellation reason. Suggested local check: compare references and amounts with the earlier payment.",
    },
    FRAD: {
        code: "FRAD",
        family: "reason",
        label: "Fraudulent origin",
        demoNote: "camt.056 cancellation reason. Follow your own fraud procedure; these tools do not assess fraud.",
    },
    TECH: {
        code: "TECH",
        family: "reason",
        label: "Technical problem",
        demoNote: "camt.056 cancellation reason: a technical problem caused an erroneous payment.",
    },
    CUST: {
        code: "CUST",
        family: "reason",
        label: "Requested by customer, or customer decision",
        demoNote: "In a camt.056, the debtor asked for the cancellation. In a camt.029 rejection, the creditor declined it.",
    },
    UPAY: {
        code: "UPAY",
        family: "reason",
        label: "Undue payment",
        demoNote: "camt.056 cancellation reason: the payment is not justified.",
    },
    LEGL: {
        code: "LEGL",
        family: "reason",
        label: "Legal decision",
        demoNote: "The cancellation or investigation request cannot be accepted because of regulatory rules.",
    },
    NOAS: {
        code: "NOAS",
        family: "reason",
        label: "No answer from customer",
        demoNote: "No reply from the customer, for example the beneficiary of a cancellation request.",
    },
    NOOR: {
        code: "NOOR",
        family: "reason",
        label: "No original transaction received",
        demoNote: "The answering bank says it never received the payment. Check the route and the next agent.",
    },
    ARDT: {
        code: "ARDT",
        family: "reason",
        label: "Already returned",
        demoNote: "The payment was already returned. Look for the matching pacs.004.",
    },
    INVA: {
        code: "INVA",
        family: "status",
        label: "Invalid (Swift Tracker alert)",
        demoNote: "trck.003: the Tracker did not accept the message it names. Check the alert details and resend a corrected message.",
    },
    RJIN: {
        code: "RJIN",
        family: "status",
        label: "Rejected investigation (Swift Tracker alert)",
        demoNote: "trck.003: Case Orchestrator rejected the investigation request it names.",
    },
    WARN: {
        code: "WARN",
        family: "status",
        label: "Warning (Swift Tracker alert)",
        demoNote: "trck.003: the Tracker flags something about the message it names, without rejecting it.",
    },
    IN14: {
        code: "IN14",
        family: "reason",
        label: "Incorrect creditor account",
        demoNote: "camt.026 justification: the creditor account in the payment is incorrect.",
    },
    MS13: {
        code: "MS13",
        family: "reason",
        label: "Missing creditor account",
        demoNote: "camt.026 justification: the payment has no creditor account.",
    },
};
export function decodeReasonCode(code) {
    if (!code)
        return null;
    return CODE_MAP[code.toUpperCase()] ?? null;
}
export function listReasonCodes() {
    return Object.values(CODE_MAP);
}
