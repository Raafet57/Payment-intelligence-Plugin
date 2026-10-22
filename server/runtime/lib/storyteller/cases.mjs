// Generated from src/lib/storyteller/cases.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { findDescendantsByLocalName, getChildrenByLocalName, getFirstChildByLocalName, } from "../iso20022/index.mjs";
/*
 * Exceptions and investigations (case management) messages:
 *   camt.056 FIToFIPaymentCancellationRequest   -> "cancellation-request"
 *   camt.029 ResolutionOfInvestigation          -> "resolution"
 *   camt.110 InvestigationRequest               -> "investigation-request"
 *   camt.111 InvestigationResponse              -> "investigation-response"
 *
 * Each one quotes the payment it concerns (Orgnl* references, UETR first), so the
 * correlation payload uses the original-* keys and lifecycle analysis threads the
 * case next to the pacs messages it is about. Field projection only: no schema or
 * usage-guideline validation.
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
function moneyOf(el) {
    const value = text(el);
    if (!el || value === null)
        return null;
    const ccy = el.getAttribute("Ccy");
    return { value, currency: ccy && ccy.length > 0 ? ccy : null };
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
function codeOf(el) {
    return text(chain(el, "Cd")) ?? text(chain(el, "Prtry"));
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
};
function rowsOf(summary) {
    const u = summary.underlying;
    const pairs = [
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
        [
            "Original amount",
            u.amount ? [u.amount.value, u.amount.currency].filter(Boolean).join(" ") : null,
        ],
        ["Original settlement date", u.settlementDate],
    ];
    return pairs
        .filter((pair) => pair[1] !== null && pair[1].length > 0)
        .map(([label, value]) => ({ label, value }));
}
/* ----------- camt.056 ----------- */
function cancellationRequests(body) {
    const assgnmt = chain(body, "Assgnmt");
    const header = assignmentHeader(assgnmt);
    const msgCase = caseOf(chain(body, "Case"));
    const txs = getChildrenByLocalName(body, "Undrlyg").flatMap((u) => getChildrenByLocalName(u, "TxInf"));
    const cases = (txs.length > 0 ? txs : [null]).map((tx) => {
        const txCase = caseOf(chain(tx, "Case"));
        const reason = chain(tx, "CxlRsnInf");
        return {
            role: "cancellation-request",
            caseId: txCase.id ?? msgCase.id,
            caseCreator: txCase.creator ?? msgCase.creator,
            assignmentId: header.id,
            from: header.from,
            to: header.to,
            requestorInvestigationId: null,
            eir: null,
            investigationType: null,
            investigationSubType: null,
            requestedAction: null,
            statusCode: null,
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
            role: "resolution",
            caseId: txCase.id ?? msgCase.id,
            caseCreator: txCase.creator ?? msgCase.creator,
            assignmentId: header.id,
            from: header.from,
            to: header.to,
            requestorInvestigationId: null,
            eir: null,
            investigationType: null,
            investigationSubType: null,
            requestedAction: null,
            statusCode: text(chain(tx, "TxCxlSts")) ?? confirmation,
            reasonCode: codeOf(chain(reason, "Rsn")),
            additionalInfo: text(chain(reason, "AddtlInf")),
            underlying: underlyingOf(tx),
        };
    });
    return { header, cases };
}
function assignmentHeader(assgnmt) {
    return {
        id: text(chain(assgnmt, "Id")),
        createdAt: text(chain(assgnmt, "CreDtTm")),
        from: partyLabel(chain(assgnmt, "Assgnr")),
        to: partyLabel(chain(assgnmt, "Assgne")),
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
/* ----------- camt.110 / camt.111 ----------- */
/*
 * camt.110 InvestigationRequest and camt.111 InvestigationResponse carry no
 * legacy Assgnmt or Case block and no creation timestamp in the Document.
 * Swift's Case Orchestrator keys a case on the End-to-End Investigation
 * Reference (EIR), optional in the first request and mandatory afterwards, so
 * the case id is the EIR, else the requestor's investigation id. The creation
 * time comes from the business application header when present.
 */
/** The underlying payment: the first child of the `Undrlyg` choice (IntrBk, Initn, StmtNtry...). */
function investigationUnderlying(request) {
    const choice = chain(request, "Undrlyg");
    return underlyingOf(choice?.children.item(0) ?? null);
}
function investigationRequests(body) {
    const request = chain(body, "InvstgtnReq");
    const header = {
        id: text(chain(request, "MsgId")),
        createdAt: appHdrCreated(body),
        from: partyLabel(chain(request, "Rqstr")),
        to: partyLabel(chain(request, "Rspndr")),
    };
    const data = getChildrenByLocalName(body, "InvstgtnData");
    const cases = (data.length > 0 ? data : [null]).map((item) => ({
        role: "investigation-request",
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
        statusCode: null,
        reasonCode: codeOf(chain(item, "Rsn")),
        additionalInfo: text(chain(item, "AddtlReqData", "ReqNrrtv")),
        underlying: investigationUnderlying(request),
    }));
    return { header, cases };
}
function investigationResponses(body) {
    const response = chain(body, "InvstgtnRspn");
    const original = chain(body, "OrgnlInvstgtnReq");
    const header = {
        id: text(chain(response, "MsgId")),
        createdAt: appHdrCreated(body),
        from: partyLabel(chain(original, "Rspndr")),
        to: partyLabel(chain(original, "Rqstr")),
    };
    const sts = chain(response, "InvstgtnSts");
    const data = response ? getChildrenByLocalName(response, "InvstgtnData") : [];
    const cases = (data.length > 0 ? data : [null]).map((item) => ({
        role: "investigation-response",
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
        additionalInfo: text(chain(item, "RspnData", "RspnNrrtv")),
        underlying: investigationUnderlying(original),
    }));
    return { header, cases };
}
/** `CreDt` of a head.001 AppHdr next to the Document, if the file carries one. */
function appHdrCreated(body) {
    const root = body.ownerDocument?.documentElement ?? null;
    const appHdr = root ? findDescendantsByLocalName(root, "AppHdr")[0] : undefined;
    return text(chain(appHdr ?? null, "CreDt"));
}
