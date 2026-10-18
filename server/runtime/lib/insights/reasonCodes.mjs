// Generated from src/lib/insights/reasonCodes.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
export const REASON_CODE_CAVEAT = "Curated source-safe subset; not an exhaustive ISO External Code Set.";
const CODE_MAP = {
    RJCT: {
        code: "RJCT",
        family: "status",
        label: "Rejected",
        demoNote: "The status report says the referenced payment was rejected.",
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
        demoNote: "The status report says processing is pending.",
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
};
export function decodeReasonCode(code) {
    if (!code)
        return null;
    return CODE_MAP[code.toUpperCase()] ?? null;
}
export function listReasonCodes() {
    return Object.values(CODE_MAP);
}
