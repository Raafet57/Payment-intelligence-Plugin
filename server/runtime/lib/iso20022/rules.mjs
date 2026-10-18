// Generated from src/lib/iso20022/rules.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/** Party wrappers under which leaves like Nm, PstlAdr, Id, CtctDtls describe a real person/entity. */
export const PARTY_LOCAL_NAMES = new Set([
    "Dbtr",
    "Cdtr",
    "UltmtDbtr",
    "UltmtCdtr",
    "InitgPty",
    "Orgtr",
    "Ownr",
    "OrgnlOrgtr",
    "Assgnr",
    "Assgne",
    "TradgPty",
    "Acqrr",
    "Issr",
    // Structured remittance parties (RmtInf/Strd/Invcr|Invcee).
    "Invcr",
    "Invcee",
]);
/** Wrappers that represent an account (Othr/Id below them is an account number, not an org id). */
export const ACCOUNT_WRAPPERS = new Set([
    "DbtrAcct",
    "CdtrAcct",
    "Acct",
    "IntrmyAgt1Acct",
    "IntrmyAgt2Acct",
    "IntrmyAgt3Acct",
    "InstgRmbrsmntAgtAcct",
    "InstdRmbrsmntAgtAcct",
    "ThrdRmbrsmntAgtAcct",
    "ChrgsAcct",
    "TaxAcct",
    "CshAcct",
    "RltdAcct",
]);
/** Date/dateTime wrappers we are allowed to shift. Generic <Dt> is *only* shifted under
 * one of these wrappers (path-aware), never via a global text scan. */
export const DATE_WRAPPERS = new Set([
    "BookgDt",
    "ValDt",
    "IntrBkSttlmDt",
    "IntrBkSttlmDtTm",
    "ReqdExctnDt",
    "ReqdColltnDt",
    "AccptncDtTm",
    "CreDtTm",
    "CreDt",
    "OrgnlCreDtTm",
    "ToDt",
    "FrDt",
    "FrToDt",
    "Dt", // Allowed as a *wrapper* like <Dt><Dt>...</Dt></Dt> (handled in scrub)
    "IsseDt",
    "XpryDt",
    "MtrtyDt",
    "PmtDt",
    "ChrgsBookgDt",
    "IntrstDt",
    "OrgnlIntrBkSttlmDt",
    "PrcgDtTm",
]);
/** Outer wrappers under which a generic <Dt>/<DtTm> leaf can be shifted. */
export const APPROVED_DATE_PARENT_WRAPPERS = new Set([
    "BookgDt",
    "ValDt",
    "Dt",
    "FrToDt",
    "ToDt",
    "FrDt",
    "OrgnlCreDtTm",
    "PrcgDtTm",
]);
/** Reference local names that always carry an opaque payment identifier and should be masked. */
export const REFERENCE_LOCAL_NAMES = new Set([
    "EndToEndId",
    "InstrId",
    "TxId",
    "OrgnlEndToEndId",
    "OrgnlInstrId",
    "OrgnlTxId",
    "OrgnlUETR",
    "AcctSvcrRef",
    "ChqNb",
    "PmtInfId",
    "ClrSysRef",
    "Prtry",
]);
/** MsgId-style identifiers · masked with a deterministic pseudonym preserving structure. */
export const MSGID_LOCAL_NAMES = new Set([
    "MsgId",
    "BizMsgIdr",
    "OrgnlMsgId",
    "OrgnlBizMsgIdr",
]);
/** Contact info leaves · masked when present. */
export const CONTACT_LOCAL_NAMES = new Set([
    "EmailAdr",
    "PhneNb",
    "MobNb",
    "FaxNb",
    "EmailPurp",
]);
/** Postal address leaves we replace with synthetic values. Country code is preserved. */
export const ADDRESS_LEAF_NAMES = new Set([
    "StrtNm",
    "BldgNb",
    "BldgNm",
    "PstCd",
    "TwnNm",
    "TwnLctnNm",
    "DstrctNm",
    "CtrySubDvsn",
    "AdrLine",
    "Dept",
    "SubDept",
    "Flr",
    "Room",
    "PstBx",
]);
/** Free-text leaves that can carry names or invoice details anywhere in a message. */
export const FREE_TEXT_LOCAL_NAMES = new Set([
    "Ustrd",
    "AddtlRmtInf",
    "AddtlNtryInf",
    "AddtlTxInf",
]);
/**
 * Remittance text: unstructured remittance, structured-remittance document numbers and
 * creditor references, and free-text entry/transaction details. Masked unless the caller
 * asks to preserve remittance.
 */
export function isRemittanceText(ancestors, localName) {
    if (FREE_TEXT_LOCAL_NAMES.has(localName))
        return true;
    if (!ancestors.includes("Strd"))
        return false;
    const parent = ancestors[ancestors.length - 1];
    return ((localName === "Nb" && parent === "RfrdDocInf") ||
        (localName === "Ref" && parent === "CdtrRefInf"));
}
/** Country code element name within a postal address (preserved by default). */
export const ADDRESS_COUNTRY_LEAF = "Ctry";
/** Test if `chain` appears as a contiguous suffix of `ancestors + [self]`. */
export function endsWith(path, chain) {
    if (chain.length > path.length)
        return false;
    const offset = path.length - chain.length;
    for (let i = 0; i < chain.length; i++) {
        if (path[offset + i] !== chain[i])
            return false;
    }
    return true;
}
/** Test if `chain` appears as a contiguous subsequence anywhere in `path`. */
export function containsChain(path, chain) {
    if (chain.length === 0)
        return true;
    outer: for (let i = 0; i <= path.length - chain.length; i++) {
        for (let j = 0; j < chain.length; j++) {
            if (path[i + j] !== chain[j])
                continue outer;
        }
        return true;
    }
    return false;
}
/** True when the path includes any of the listed local names as an ancestor. */
export function hasAncestor(ancestors, names) {
    for (const name of ancestors) {
        if (names.has(name))
            return true;
    }
    return false;
}
/** True when the immediate parent local name is in `names`. */
export function parentIs(ancestors, names) {
    const parent = ancestors[ancestors.length - 1];
    return parent !== undefined && names.has(parent);
}
/** True when *any* ancestor is FinInstnId · used to skip name/address logic for FI nodes. */
export function isUnderFinInstnId(ancestors) {
    return ancestors.includes("FinInstnId");
}
/** Identify the closest party ancestor (innermost), if any. */
export function closestPartyAncestor(ancestors) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
        const name = ancestors[i];
        if (PARTY_LOCAL_NAMES.has(name))
            return name;
    }
    return null;
}
export function classifyOthrId(ancestors, localName) {
    if (localName !== "Id")
        return null;
    // Path .../<wrapper>/Id/Othr/Id  →  ancestors end with [<wrapper>, "Id", "Othr"].
    const parent = ancestors[ancestors.length - 1];
    const grand = ancestors[ancestors.length - 2];
    const greatGrand = ancestors[ancestors.length - 3];
    if (parent !== "Othr")
        return null;
    // Account: <AcctWrapper>/Id/Othr/Id
    if (grand === "Id" && greatGrand !== undefined && ACCOUNT_WRAPPERS.has(greatGrand)) {
        return "account";
    }
    // OrgId: <Party>/Id/OrgId/Othr/Id
    if (grand === "OrgId") {
        return "orgId";
    }
    // PrvtId: <Party>/Id/PrvtId/Othr/Id
    if (grand === "PrvtId") {
        return "prvtId";
    }
    // FI Othr/Id under FinInstnId: <FinInstnId>/Othr/Id
    if (grand === "FinInstnId") {
        return "fiOtherId";
    }
    return null;
}
/** Look up a heuristic mask type for a leaf element by local name + ancestors. */
export function classifyLeaf(ancestors, localName) {
    // IBAN · always mask.
    if (localName === "IBAN")
        return { type: "iban" };
    // BICFI / BICOrBEI / LEI / ClrSysMmbId/MmbId · preserve by default; flag handles fiOtherId only.
    if (localName === "Nm") {
        // Preserve names for FI nodes (bank names) by default.
        if (isUnderFinInstnId(ancestors))
            return null;
        if (closestPartyAncestor(ancestors) !== null)
            return { type: "name" };
        // Names that aren't under a party (e.g. RltdPties/<Party>/Nm without a party wrap) are skipped.
        return null;
    }
    if (ADDRESS_LEAF_NAMES.has(localName) && ancestors.includes("PstlAdr")) {
        // Address leaves are always replaced with synthetic values when under PstlAdr.
        return { type: "address", hint: localName };
    }
    if (CONTACT_LOCAL_NAMES.has(localName) && ancestors.includes("CtctDtls")) {
        return { type: "contact", hint: localName };
    }
    if (localName === "UETR")
        return { type: "uetr" };
    if (MSGID_LOCAL_NAMES.has(localName)) {
        return { type: "msgId", hint: localName };
    }
    if (REFERENCE_LOCAL_NAMES.has(localName)) {
        // Skip <Prtry> children that are *codes*, not identifiers (e.g. CdOrPrtry/Prtry · short codes).
        if (localName === "Prtry" && ancestors[ancestors.length - 1] === "CdOrPrtry")
            return null;
        return { type: "reference", hint: localName };
    }
    return null;
}
