// Generated from src/lib/storyteller/cases.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { findDescendantsByLocalName, getChildrenByLocalName, getFirstChildByLocalName, getLocalName, } from "../iso20022/index.mjs";
/*
 * Exceptions and investigations (case management) messages:
 *   camt.056 FIToFIPaymentCancellationRequest   -> "cancellation-request"
 *   camt.029 ResolutionOfInvestigation          -> "resolution"
 *   camt.110 InvestigationRequest               -> "investigation-request"
 *   camt.111 InvestigationResponse              -> "investigation-response"
 *   camt.026 UnableToApply                      -> "unable-to-apply"
 *   camt.027 ClaimNonReceipt                    -> "claim-non-receipt"
 *   camt.028 AdditionalPaymentInformation       -> "additional-information"
 *   camt.087 RequestToModifyPayment             -> "modification-request"
 *   trck.003 TrackerAlertNotification (Swift)   -> "tracker-alert"
 *   trck.005 TrackerInvestigationStatusNotification (Swift) -> "investigation-status"
 *
 * Each one quotes the payment it concerns (Orgnl* references, UETR first), so the
 * correlation payload uses the original-* keys and lifecycle analysis threads the
 * case next to the pacs messages it is about. Field projection only: no schema or
 * usage-guideline validation, and nothing here drafts or answers a case.
 */
function text(el) {
    if (!el)
        return null;
    const value = (el.textContent ?? "").trim();
    return value.length > 0 ? value : null;
}
function chain(start, ...names) {
    let current = start;
    for (const name of names) {
        if (!current)
            return null;
        current = getFirstChildByLocalName(current, name);
    }
    return current;
}
function children(el) {
    if (!el)
        return [];
    const out = [];
    for (let i = 0; i < el.children.length; i++) {
        const child = el.children.item(i);
        if (child)
            out.push(child);
    }
    return out;
}
function moneyOf(el) {
    const value = text(el);
    if (!el || value === null)
        return null;
    const ccy = el.getAttribute("Ccy");
    return { value, currency: ccy && ccy.length > 0 ? ccy : null };
}
function formatMoney(amount) {
    return amount ? [amount.value, amount.currency].filter(Boolean).join(" ") : null;
}
/** BIC, else name, of a Party / Agent choice (`Pty` or `Agt`) or a bare FI id. */
function partyLabel(el) {
    if (!el)
        return null;
    const agent = getFirstChildByLocalName(el, "Agt") ?? el;
    const party = getFirstChildByLocalName(el, "Pty");
    return (text(chain(agent, "FinInstnId", "BICFI")) ??
        text(chain(agent, "FinInstnId", "Nm")) ??
        text(chain(party, "Id", "OrgId", "AnyBIC")) ??
        text(chain(party, "Nm")) ??
        text(getFirstChildByLocalName(el, "Nm")));
}
/** IBAN, else other account id, of a cash account. */
function accountLabel(el) {
    return text(chain(el, "Id", "IBAN")) ?? text(chain(el, "Id", "Othr", "Id"));
}
function codeOf(el) {
    return text(chain(el, "Cd")) ?? text(chain(el, "Prtry"));
}
function dateOf(el) {
    return text(chain(el, "Dt")) ?? text(chain(el, "DtTm")) ?? text(el);
}
function caseOf(el) {
    return {
        id: text(chain(el, "Id")),
        creator: partyLabel(chain(el, "Cretr")),
    };
}
function underlyingOf(tx) {
    const grp = chain(tx, "OrgnlGrpInf");
    return {
        msgId: text(chain(grp, "OrgnlMsgId")),
        msgNmId: text(chain(grp, "OrgnlMsgNmId")),
        instrId: text(chain(tx, "OrgnlInstrId")),
        endToEndId: text(chain(tx, "OrgnlEndToEndId")),
        txId: text(chain(tx, "OrgnlTxId")),
        uetr: text(chain(tx, "OrgnlUETR")),
        amount: moneyOf(chain(tx, "OrgnlIntrBkSttlmAmt")) ??
            moneyOf(chain(tx, "OrgnlInstdAmt")) ??
            moneyOf(chain(tx, "OrgnlTxRef", "IntrBkSttlmAmt")),
        settlementDate: text(chain(tx, "OrgnlIntrBkSttlmDt")) ?? text(chain(tx, "OrgnlTxRef", "IntrBkSttlmDt")),
    };
}
/** The underlying payment: the first child of an `Undrlyg` choice (IntrBk, Initn, StmtNtry...). */
function underlyingChoice(parent) {
    return underlyingOf(chain(parent, "Undrlyg")?.children.item(0) ?? null);
}
function rows(pairs) {
    return pairs
        .filter((pair) => typeof pair[1] === "string" && pair[1].length > 0)
        .map(([label, value]) => ({ label, value }));
}
function compact(values) {
    const entries = Object.entries(values).filter(([, value]) => typeof value === "string" && value.length > 0);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
function transactionOf(summary, msgId) {
    const u = summary.underlying;
    const correlation = compact({
        msgId: msgId ?? undefined,
        originalUetr: u.uetr ?? undefined,
        originalEndToEndId: u.endToEndId ?? undefined,
        originalTxId: u.txId ?? undefined,
        originalInstrId: u.instrId ?? undefined,
        originalMsgId: u.msgId ?? undefined,
    });
    const status = compact({
        code: summary.statusCode ?? undefined,
        reasonCode: summary.reasonCode ?? undefined,
        reasonDescription: summary.additionalInfo ?? undefined,
    });
    return {
        correlation,
        status,
        amount: u.amount,
        valueDate: u.settlementDate,
        reference: summary.caseId,
    };
}
const ROLE_LABEL = {
    "cancellation-request": "Cancellation request",
    resolution: "Resolution of investigation",
    "investigation-request": "Investigation request",
    "investigation-response": "Investigation response",
    "unable-to-apply": "Unable to apply",
    "claim-non-receipt": "Claim non-receipt",
    "additional-information": "Additional payment information",
    "modification-request": "Request to modify payment",
    "tracker-alert": "Tracker alert",
    "investigation-status": "Case status notification",
};
function rowsOf(summary) {
    const u = summary.underlying;
    const mt = summary.embeddedMt;
    return [
        ...rows([
            ["Case role", ROLE_LABEL[summary.role]],
            ["Case ID", summary.caseId],
            ["Case creator", summary.caseCreator],
            ["Assignment ID", summary.assignmentId],
            ["From", summary.from],
            ["To", summary.to],
            ["Requestor investigation ID", summary.requestorInvestigationId],
            ["Investigation type", summary.investigationType],
            ["Investigation sub-type", summary.investigationSubType],
            ["Requested action", summary.requestedAction],
            ["Status", summary.statusCode],
            ["Reason code", summary.reasonCode],
            ["Additional info", summary.additionalInfo],
            ["Original message ID", u.msgId],
            ["Original message type", u.msgNmId],
            ["Original instruction ID", u.instrId],
            ["Original end-to-end ID", u.endToEndId],
            ["Original transaction ID", u.txId],
            ["Original UETR", u.uetr],
            ["Original amount", formatMoney(u.amount)],
            ["Original settlement date", u.settlementDate],
        ]),
        ...summary.details.flatMap((detail) => detail.rows.map((row) => ({
            label: `${detail.label}${detail.sequence ? ` ${detail.sequence}` : ""}: ${row.label}`,
            value: row.value,
        }))),
        ...(mt
            ? rows([
                ["Embedded MT copy", `MT ${mt.messageType ?? "?"}`],
                ["Translation result", mt.translationResult],
                ["Dropped in translation", mt.reportedDropped.join(", ")],
                ["Not in the MT copy", mt.notCarried.join(", ")],
            ])
            : []),
    ];
}
function baseCase(role) {
    return {
        role,
        caseId: null,
        requestorInvestigationId: null,
        caseCreator: null,
        assignmentId: null,
        from: null,
        to: null,
        eir: null,
        investigationType: null,
        investigationSubType: null,
        requestedAction: null,
        statusCode: null,
        reasonCode: null,
        additionalInfo: null,
        underlying: underlyingOf(null),
        details: [],
        embeddedMt: null,
    };
}
function assignmentHeader(assgnmt) {
    return {
        id: text(chain(assgnmt, "Id")),
        createdAt: text(chain(assgnmt, "CreDtTm")),
        from: partyLabel(chain(assgnmt, "Assgnr")),
        to: partyLabel(chain(assgnmt, "Assgne")),
    };
}
/** The head.001 AppHdr next to the Document, if the file carries one. */
function appHdrOf(body) {
    const root = body.ownerDocument?.documentElement ?? null;
    return (root ? findDescendantsByLocalName(root, "AppHdr")[0] : undefined) ?? null;
}
/* ----------- camt.056 ----------- */
function cancellationRequests(body) {
    const header = assignmentHeader(chain(body, "Assgnmt"));
    const msgCase = caseOf(chain(body, "Case"));
    const txs = getChildrenByLocalName(body, "Undrlyg").flatMap((u) => getChildrenByLocalName(u, "TxInf"));
    const cases = (txs.length > 0 ? txs : [null]).map((tx) => {
        const txCase = caseOf(chain(tx, "Case"));
        const reason = chain(tx, "CxlRsnInf");
        return {
            ...baseCase("cancellation-request"),
            caseId: txCase.id ?? msgCase.id,
            caseCreator: txCase.creator ?? msgCase.creator,
            assignmentId: header.id,
            from: header.from,
            to: header.to,
            reasonCode: codeOf(chain(reason, "Rsn")),
            additionalInfo: text(chain(reason, "AddtlInf")),
            underlying: underlyingOf(tx),
        };
    });
    return { header, cases };
}
/* ----------- camt.029 ----------- */
function resolutions(body) {
    const header = assignmentHeader(chain(body, "Assgnmt"));
    const msgCase = caseOf(chain(body, "RslvdCase"));
    const confirmation = codeOf(chain(body, "Sts", "Conf")) ?? text(chain(body, "Sts", "Conf"));
    const txs = getChildrenByLocalName(body, "CxlDtls").flatMap((d) => getChildrenByLocalName(d, "TxInfAndSts"));
    const cases = (txs.length > 0 ? txs : [null]).map((tx) => {
        const txCase = caseOf(chain(tx, "RslvdCase"));
        const reason = chain(tx, "CxlStsRsnInf");
        return {
            ...baseCase("resolution"),
            caseId: txCase.id ?? msgCase.id,
            caseCreator: txCase.creator ?? msgCase.creator,
            assignmentId: header.id,
            from: header.from,
            to: header.to,
            statusCode: text(chain(tx, "TxCxlSts")) ?? confirmation,
            reasonCode: codeOf(chain(reason, "Rsn")),
            additionalInfo: text(chain(reason, "AddtlInf")),
            underlying: underlyingOf(tx),
        };
    });
    return { header, cases };
}
/* ----------- camt.110 / camt.111 ----------- */
/*
 * camt.110 InvestigationRequest and camt.111 InvestigationResponse carry no
 * legacy Assgnmt or Case block and no creation timestamp in the Document.
 * Swift's Case Orchestrator keys a case on the End-to-End Investigation
 * Reference (EIR), optional in the first request and mandatory afterwards, so
 * the case id is the EIR, else the requestor's investigation id. The creation
 * time comes from the business application header when present.
 */
function investigationRequests(body) {
    const request = chain(body, "InvstgtnReq");
    const header = {
        id: text(chain(request, "MsgId")),
        createdAt: text(chain(appHdrOf(body), "CreDt")),
        from: partyLabel(chain(request, "Rqstr")),
        to: partyLabel(chain(request, "Rspndr")),
    };
    const data = getChildrenByLocalName(body, "InvstgtnData");
    const reasons = data.map((item) => codeOf(chain(item, "Rsn"))).filter(Boolean);
    const narratives = data.map((item) => text(chain(item, "AddtlReqData", "ReqNrrtv")));
    const summary = {
        ...baseCase("investigation-request"),
        caseId: text(chain(request, "EIR")) ?? text(chain(request, "RqstrInvstgtnId")),
        requestorInvestigationId: text(chain(request, "RqstrInvstgtnId")),
        caseCreator: header.from,
        assignmentId: header.id,
        from: header.from,
        to: header.to,
        eir: text(chain(request, "EIR")),
        investigationType: codeOf(chain(request, "InvstgtnTp")),
        investigationSubType: codeOf(chain(request, "InvstgtnSubTp")),
        requestedAction: codeOf(chain(request, "ReqActn", "Actn")),
        reasonCode: reasons.join(", ") || null,
        additionalInfo: narratives.filter(Boolean).join(" / ") || null,
        underlying: underlyingChoice(request),
    };
    summary.embeddedMt = embeddedMtOf(body, summary);
    return { header, cases: [summary] };
}
function investigationResponses(body) {
    const response = chain(body, "InvstgtnRspn");
    const original = chain(body, "OrgnlInvstgtnReq");
    const header = {
        id: text(chain(response, "MsgId")),
        createdAt: text(chain(appHdrOf(body), "CreDt")),
        from: partyLabel(chain(original, "Rspndr")),
        to: partyLabel(chain(original, "Rqstr")),
    };
    const sts = chain(response, "InvstgtnSts");
    const data = response ? getChildrenByLocalName(response, "InvstgtnData") : [];
    const details = data.flatMap(responseDetails);
    const summary = {
        ...baseCase("investigation-response"),
        caseId: text(chain(original, "EIR")) ?? text(chain(original, "RqstrInvstgtnId")),
        requestorInvestigationId: text(chain(original, "RqstrInvstgtnId")),
        caseCreator: partyLabel(chain(original, "Rqstr")),
        assignmentId: header.id,
        from: header.from,
        to: header.to,
        eir: text(chain(original, "EIR")),
        investigationType: codeOf(chain(original, "InvstgtnTp")),
        investigationSubType: codeOf(chain(original, "InvstgtnSubTp")),
        requestedAction: codeOf(chain(original, "ReqActn", "Actn")),
        statusCode: text(chain(sts, "Sts")),
        reasonCode: codeOf(chain(sts, "StsRsn")),
        additionalInfo: data.map((item) => text(chain(item, "RspnData", "RspnNrrtv"))).find(Boolean) ?? null,
        underlying: underlyingChoice(original),
        details,
    };
    return { header, cases: [summary] };
}
/** One detail block per camt.111 `RspnData` choice (TxData can repeat). */
function responseDetails(item) {
    const sequence = text(chain(item, "OrgnlInvstgtnSeq"));
    const reason = codeOf(chain(item, "OrgnlInvstgtnRsn"));
    const detail = (label, pairs) => ({
        label,
        sequence,
        rows: rows([["Answers reason", reason], ...pairs]),
    });
    return children(chain(item, "RspnData")).map((data) => {
        switch (getLocalName(data)) {
            case "Conf": {
                const amount = formatMoney(moneyOf(chain(data, "Amt")));
                const cdtDbt = text(chain(data, "CdtDbtInd"));
                return detail("Booking confirmation", [
                    ["Amount", amount && cdtDbt ? `${amount} ${cdtDbt}` : amount],
                    ["Value date", dateOf(chain(data, "ValDt"))],
                    ["Booking date", dateOf(chain(data, "BookgDt"))],
                    ["Account", accountLabel(chain(data, "Acct"))],
                    ["Exchange rate", text(chain(data, "XchgRate"))],
                    ["Charges", formatMoney(moneyOf(chain(data, "Chrgs", "TtlChrgsAndTaxAmt")))],
                    ["UETR", text(chain(data, "Refs", "UETR"))],
                    ["End-to-end ID", text(chain(data, "Refs", "EndToEndId"))],
                    ["Instruction ID", text(chain(data, "Refs", "InstrId"))],
                    ["Servicer reference", text(chain(data, "Refs", "AcctSvcrRef"))],
                    ["Reason", text(chain(data, "Rsn"))],
                ]);
            }
            case "TxSts":
                return detail("Payment status", [
                    ["Status", codeOf(chain(data, "Sts"))],
                    ["Status reason", codeOf(chain(data, "StsRsnInf", "Rsn"))],
                    ["Additional info", text(chain(data, "StsRsnInf", "AddtlInf"))],
                ]);
            case "TxData": {
                const record = chain(data, "Rcrd")?.children.item(0) ?? null;
                return detail("Amendment", [
                    ["Field", text(chain(data, "Pth")) ?? (record ? getLocalName(record) : null)],
                    ["New value", recordValue(record)],
                ]);
            }
            case "Compstn":
                return detail("Compensation", [
                    ["Granted", text(chain(data, "Grantd"))],
                    ["Initial amount", formatMoney(moneyOf(chain(data, "InitlAmt")))],
                    ["Paid charges", formatMoney(moneyOf(chain(data, "PdChrgs")))],
                    ["Amount due", formatMoney(moneyOf(chain(data, "AmtDue")))],
                    ["Expected value date", text(chain(data, "XpctdValDt"))],
                    ["Interest rate", text(chain(data, "IntrstRate"))],
                    ["Reason", text(chain(data, "Rsn"))],
                ]);
            case "Valtn":
                return detail("Value date adjustment", [
                    ["Initial amount", formatMoney(moneyOf(chain(data, "InitlAmt")))],
                    ["Due charges", formatMoney(moneyOf(chain(data, "DueChrgs")))],
                    ["Amount due", formatMoney(moneyOf(chain(data, "AmtDue")))],
                    ["Compensating agent", partyLabel(chain(data, "CompstnAgt"))],
                    ["Current value date", text(chain(data, "Prd", "CurValDt"))],
                    ["Requested value date", text(chain(data, "Prd", "ReqdValDt"))],
                    ["Interest rate", text(chain(data, "IntrstRate"))],
                    ["Reason", text(chain(data, "Rsn"))],
                ]);
            case "DbtAuthstn":
                return detail("Debit authorisation", [
                    ["Authorised", text(chain(data, "DbtAuthstn"))],
                    ["Amount to debit", formatMoney(moneyOf(chain(data, "AmtToDbt")))],
                    ["Value date to debit", text(chain(data, "ValDtToDbt"))],
                    ["Reason", text(chain(data, "Rsn"))],
                ]);
            case "RspnNrrtv":
                return detail("Narrative", [["Text", text(data)]]);
            default:
                return detail(getLocalName(data), [["Value", collapse(data)]]);
        }
    });
}
/** Readable value of a camt.111 `TxData/Rcrd` choice. */
function recordValue(record) {
    if (!record)
        return null;
    switch (getLocalName(record)) {
        case "Amt":
            return formatMoney(moneyOf(record));
        case "Agt":
            return partyLabel(record);
        case "CshAcct":
            return accountLabel(record);
        case "Pty":
            return text(chain(record, "Nm")) ?? collapse(record);
        case "Rmt": {
            const ustrd = getChildrenByLocalName(record, "Ustrd").map(text).filter(Boolean);
            return ustrd.length > 0 ? ustrd.join(" ") : collapse(record);
        }
        default:
            return text(record);
    }
}
function collapse(el) {
    const value = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!value)
        return null;
    return value.length > 140 ? `${value.slice(0, 137)}...` : value;
}
/* ----------- camt.026 / camt.027 / camt.028 / camt.087 ----------- */
/*
 * The older ISO E&I messages, exchanged bilaterally before Case Management. They
 * share the Assgnmt / Case / Undrlyg blocks with camt.056; what differs is the
 * justification (camt.026), the instruction (camt.027, camt.087) and the payment
 * fields given (camt.028) or asked to change (camt.087).
 */
const FIELD_LABELS = {
    InstrId: "Instruction ID",
    EndToEndId: "End-to-end ID",
    TxId: "Transaction ID",
    ReqdExctnDt: "Requested execution date",
    IntrBkSttlmDt: "Settlement date",
    IntrBkSttlmAmt: "Settlement amount",
    Amt: "Amount",
    ChrgBr: "Charge bearer",
    UltmtDbtr: "Ultimate debtor",
    Dbtr: "Debtor",
    DbtrAcct: "Debtor account",
    DbtrAgt: "Debtor agent",
    DbtrAgtAcct: "Debtor agent account",
    IntrmyAgt1: "Intermediary agent 1",
    IntrmyAgt2: "Intermediary agent 2",
    IntrmyAgt3: "Intermediary agent 3",
    CdtrAgt: "Creditor agent",
    CdtrAgtAcct: "Creditor agent account",
    Cdtr: "Creditor",
    CdtrAcct: "Creditor account",
    UltmtCdtr: "Ultimate creditor",
    Purp: "Purpose",
    InstrForDbtrAgt: "Instruction for debtor agent",
    InstrForNxtAgt: "Instruction for next agent",
    InstrForCdtrAgt: "Instruction for creditor agent",
    RmtInf: "Remittance information",
    SttlmInf: "Settlement information",
    PmtTpInf: "Payment type",
};
/** One row per payment field in a camt.087 `Mod` or camt.028 `Inf` block. */
function fieldRows(block) {
    return rows(children(block).map((field) => {
        const name = getLocalName(field);
        const value = field.children.length === 0
            ? (formatMoney(moneyOf(field)) ?? text(field))
            : (accountLabel(field) ??
                text(chain(field, "FinInstnId", "BICFI")) ??
                text(chain(field, "Nm")) ??
                text(chain(field, "Ustrd")) ??
                collapse(field));
        return [FIELD_LABELS[name] ?? name, value];
    }));
}
function legacyCase(body, role) {
    const header = assignmentHeader(chain(body, "Assgnmt"));
    const msgCase = caseOf(chain(body, "Case"));
    const instruction = chain(body, "InstrForAssgne");
    const summary = {
        ...baseCase(role),
        caseId: msgCase.id,
        caseCreator: msgCase.creator,
        assignmentId: header.id,
        from: header.from,
        to: header.to,
        reasonCode: codeOf(instruction),
        additionalInfo: text(chain(instruction, "InstrInf")),
        underlying: underlyingChoice(body),
    };
    return { header, cases: [summary] };
}
function unableToApply(body) {
    const extracted = legacyCase(body, "unable-to-apply");
    const summary = extracted.cases[0];
    const justification = chain(body, "Justfn");
    const data = chain(justification, "MssngOrIncrrctInf");
    const missing = data ? getChildrenByLocalName(data, "MssngInf") : [];
    const incorrect = data ? getChildrenByLocalName(data, "IncrrctInf") : [];
    const items = [
        ...missing.map((m) => ({
            code: codeOf(chain(m, "Tp")),
            info: text(chain(m, "AddtlMssngInf")),
            kind: "Missing",
        })),
        ...incorrect.map((m) => ({
            code: codeOf(chain(m, "Tp")),
            info: text(chain(m, "AddtlIncrrctInf")),
            kind: "Incorrect",
        })),
    ];
    summary.reasonCode =
        items
            .map((i) => i.code)
            .filter(Boolean)
            .join(", ") || null;
    summary.additionalInfo =
        items
            .map((i) => i.info)
            .filter(Boolean)
            .join(" / ") || null;
    summary.details = [
        {
            label: "Justification",
            sequence: null,
            rows: rows([
                ...items.map((i) => [
                    `${i.kind}${i.code ? ` (${i.code})` : ""}`,
                    i.info ?? i.code,
                ]),
                ["Any information", text(chain(justification, "AnyInf"))],
                ["Possible duplicate", text(chain(justification, "PssblDplctInstr"))],
                ["AML request", text(chain(data, "AMLReq"))],
            ]),
        },
    ].filter((d) => d.rows.length > 0);
    return extracted;
}
function claimNonReceipt(body) {
    const extracted = legacyCase(body, "claim-non-receipt");
    const cover = chain(body, "CoverDtls");
    extracted.cases[0].details = cover
        ? [
            {
                label: "Cover",
                sequence: null,
                rows: rows([["Missing cover", text(chain(cover, "MssngCoverInd"))]]),
            },
        ]
        : [];
    return extracted;
}
function additionalInformation(body) {
    const extracted = legacyCase(body, "additional-information");
    const info = fieldRows(chain(body, "Inf"));
    extracted.cases[0].details =
        info.length > 0 ? [{ label: "Information provided", sequence: null, rows: info }] : [];
    return extracted;
}
function modificationRequest(body) {
    const extracted = legacyCase(body, "modification-request");
    const changes = fieldRows(chain(body, "Mod"));
    extracted.cases[0].details =
        changes.length > 0 ? [{ label: "Requested changes", sequence: null, rows: changes }] : [];
    return extracted;
}
/* ----------- trck.003 ----------- */
/*
 * Swift Tracker alert (TrackerAlertNotification). Case Orchestrator and Stop and
 * Recall send it when they invalidate a message (INVA, RJCR, RJIN) or warn about
 * one (WARN). It names the invalidated message type and the payment's UETR, so the
 * alert sits on the payment's timeline. Nothing here tracks case state.
 */
function trackerAlerts(body) {
    const appHdr = appHdrOf(body);
    const header = {
        id: text(chain(body, "GrpHdr", "MsgId")),
        createdAt: text(chain(appHdr, "CreDt")),
        from: text(chain(appHdr, "Fr", "FIId", "FinInstnId", "BICFI")),
        to: text(chain(appHdr, "To", "FIId", "FinInstnId", "BICFI")),
    };
    const cases = getChildrenByLocalName(body, "TrckrStsAndTx").flatMap((entry) => {
        const alert = chain(entry, "AlrtSts");
        const status = codeOf(chain(alert, "AlrtSts")) ?? codeOf(alert);
        const reasons = getChildrenByLocalName(alert ?? entry, "StsRsn")
            .map(codeOf)
            .filter(Boolean);
        const info = getChildrenByLocalName(alert ?? entry, "AddtlInf")
            .map(text)
            .filter(Boolean);
        return getChildrenByLocalName(entry, "Tx").map((tx) => {
            const tracked = chain(tx, "TrckdMsgId");
            const summary = {
                ...baseCase("tracker-alert"),
                assignmentId: header.id,
                from: header.from,
                to: header.to,
                statusCode: status,
                reasonCode: reasons.join(", ") || null,
                additionalInfo: info.join(" / ") || null,
                underlying: {
                    ...underlyingOf(null),
                    msgNmId: text(chain(tracked, "MsgNmId")),
                    instrId: text(chain(tx, "PmtId", "InstrId")),
                    endToEndId: text(chain(tx, "PmtId", "EndToEndId")),
                    uetr: text(chain(tx, "PmtId", "UETR")),
                },
            };
            summary.details = [
                {
                    label: "Alert",
                    sequence: null,
                    rows: rows([
                        ["Message concerned", text(chain(tracked, "MsgNmId"))],
                        ["Message created", text(chain(tracked, "CreDtTm"))],
                        ["Sender of that message", partyLabel(chain(tx, "TrckrInfrmgPty", "Id"))],
                        ["Service level", codeOf(chain(tx, "SvcLvl"))],
                    ]),
                },
            ];
            return summary;
        });
    });
    if (!header.createdAt) {
        header.createdAt = text(chain(body, "TrckrStsAndTx", "Tx", "TrckdMsgId", "CreDtTm"));
    }
    return { header, cases };
}
/* ----------- trck.005 ----------- */
/*
 * Swift Tracker investigation status notification (TrackerInvestigationStatusNotification,
 * versions .01 to .03 read alike). Case Orchestrator sends it to the case participants as a
 * request moves: assigned (ASGN), delivered (DTRP), automated or escalated reminder (ARMD,
 * ERMD), objection (OBJT). Element names follow the Swift schemas as published in the
 * open-source Prowide ISO 20022 library. One summary per `InvstgtnTrckg` entry; it joins
 * the camt.110 by EIR and the payment by UETR. No case state is kept.
 */
function investigationStatuses(body) {
    const appHdr = appHdrOf(body);
    const grpHdr = chain(body, "GrpHdr");
    const header = {
        id: text(chain(grpHdr, "MsgId")),
        createdAt: text(chain(appHdr, "CreDt")) ?? text(chain(grpHdr, "CreDtTm")),
        from: text(chain(appHdr, "Fr", "FIId", "FinInstnId", "BICFI")) ??
            partyLabel(chain(grpHdr, "TrckrInfrmgPty", "Id")),
        to: text(chain(appHdr, "To", "FIId", "FinInstnId", "BICFI")) ??
            partyLabel(chain(grpHdr, "TrckrInfrmdPty", "Id")),
    };
    const cases = getChildrenByLocalName(body, "InvstgtnTrckg").map((tracking) => {
        const status = chain(tracking, "StsAndAssgnmt");
        const ids = chain(status, "InvstgtnId");
        const tracked = chain(status, "TrckdMsgId");
        const summary = {
            ...baseCase("investigation-status"),
            caseId: text(chain(ids, "EIR")) ?? text(chain(ids, "RqstrInvstgtnId")) ?? text(chain(ids, "Id")),
            requestorInvestigationId: text(chain(ids, "RqstrInvstgtnId")),
            eir: text(chain(ids, "EIR")),
            assignmentId: header.id,
            from: header.from,
            to: header.to,
            investigationType: codeOf(chain(tracking, "InvstgtnTp")),
            investigationSubType: codeOf(chain(tracking, "InvstgtnSubTp")),
            statusCode: codeOf(chain(status, "Sts")),
            reasonCode: getChildrenByLocalName(status ?? tracking, "StsRsn")
                .map(codeOf)
                .filter(Boolean)
                .join(", ") || null,
            additionalInfo: getChildrenByLocalName(status ?? tracking, "AddtlInf")
                .map(text)
                .filter(Boolean)
                .join(" / ") || null,
            underlying: underlyingChoice(tracking),
        };
        summary.details = [
            {
                label: "Status",
                sequence: null,
                rows: rows([
                    ["Status date", dateOf(chain(status, "Dt"))],
                    ["Message concerned", text(chain(tracked, "MsgNmId"))],
                    ["Message ID concerned", text(chain(tracked, "MsgId"))],
                    ["Requestor", partyLabel(chain(status, "InvstgtnRqstr"))],
                    ["Responder", partyLabel(chain(status, "InvstgtnRspndr"))],
                    ["Responder investigation ID", text(chain(ids, "RspndrInvstgtnId"))],
                    ["Notification type", codeOf(chain(grpHdr, "NtfctnTp"))],
                    ["Notification sub-type", codeOf(chain(grpHdr, "NtfctnSubTp"))],
                ]),
            },
        ].filter((d) => d.rows.length > 0);
        return summary;
    });
    return { header, cases };
}
/* ----------- embedded MT copy (in-flow translation) ----------- */
function commentsOf(node, out = []) {
    if (!node)
        return out;
    const list = node.childNodes;
    for (let i = 0; i < list.length; i++) {
        const child = list.item(i);
        if (!child)
            continue;
        if (child.nodeType === 8)
            out.push(child.nodeValue ?? "");
        else if (child.nodeType === 1)
            commentsOf(child, out);
    }
    return out;
}
/** 12-character logical terminal to BIC11: drop the terminal code letter. */
function ltToBic(lt) {
    return lt && lt.length === 12 ? `${lt.slice(0, 8)}${lt.slice(9)}` : null;
}
/**
 * When Case Orchestrator delivers a camt.110 to a bank, it can add an MT 199
 * rendering of it in XML comments, with a translation report. Read that copy and
 * list what it leaves out.
 */
function embeddedMtOf(body, summary) {
    const comments = commentsOf(body.ownerDocument);
    const mt = comments.find((c) => c.includes("{1:") && c.includes("{4:"));
    if (!mt)
        return null;
    const block1 = /\{1:F\d{2}([A-Z0-9]{12})/.exec(mt);
    const block2 = /\{2:([IO])(\d{3})(\w*)/.exec(mt);
    const sender = block2?.[1] === "O" ? block2[3]?.slice(10, 22) : undefined;
    const body4 = /\{4:([\s\S]*?)(?:\r?\n|\^~)?-\}/.exec(mt)?.[1] ?? "";
    const fields = [];
    for (const line of body4.split(/\^~|\r?\n/)) {
        const match = /^:(\w+):(.*)$/.exec(line);
        if (match)
            fields.push({ tag: match[1], value: match[2] });
        else if (line && fields.length > 0)
            fields[fields.length - 1].value += line;
    }
    const report = comments.join("\n");
    const reportedDropped = [...report.matchAll(/Input path: ([A-Za-z0-9/]+)/g)].map((m) => m[1].split("/").pop());
    const flat = (mt + fields.map((f) => f.value).join("")).replace(/\s+/g, "").toUpperCase();
    const u = summary.underlying;
    const notCarried = rows([
        ["Requestor investigation ID", summary.requestorInvestigationId],
        ["EIR", summary.eir],
        ["Investigation type", summary.investigationType],
        ["Original UETR", u.uetr],
        ["Original instruction ID", u.instrId],
        ["Original end-to-end ID", u.endToEndId],
        ["Original message ID", u.msgId],
        ["Original amount", u.amount?.value],
        ["Original settlement date", u.settlementDate],
    ])
        .filter((row) => !flat.includes(row.value.replace(/\s+/g, "").toUpperCase()))
        .map((row) => row.label);
    return {
        messageType: block2?.[2] ?? null,
        sender: ltToBic(sender),
        receiver: ltToBic(block1?.[1]),
        uetr: /\{121:([^}]+)\}/.exec(mt)?.[1] ?? null,
        fields,
        translationResult: /TranslationResult=(\w+)/.exec(report)?.[1] ?? null,
        reportedDropped,
        notCarried,
    };
}
/* ----------- entry point ----------- */
export function extractCase(body, kind) {
    const { header, cases } = (() => {
        switch (kind) {
            case "camt.056":
                return cancellationRequests(body);
            case "camt.029":
                return resolutions(body);
            case "camt.110":
                return investigationRequests(body);
            case "camt.111":
                return investigationResponses(body);
            case "camt.026":
                return unableToApply(body);
            case "camt.027":
                return claimNonReceipt(body);
            case "camt.028":
                return additionalInformation(body);
            case "camt.087":
                return modificationRequest(body);
            case "trck.003":
                return trackerAlerts(body);
            case "trck.005":
                return investigationStatuses(body);
        }
    })();
    const first = cases[0];
    const transactions = cases.map((c) => transactionOf(c, header.id));
    return {
        kind,
        msgId: header.id,
        createdAt: header.createdAt,
        rows: first ? rowsOf(first) : [],
        entries: [],
        correlation: transactions[0]?.correlation,
        status: transactions[0]?.status,
        transactions,
        case: first,
    };
}
