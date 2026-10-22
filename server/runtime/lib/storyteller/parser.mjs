// Generated from src/lib/storyteller/parser.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { detectMessageKind, findDescendantsByLocalName, getChildrenByLocalName, getFirstChildByLocalName, getLocalName, parseXml, } from "../iso20022/index.mjs";
import { extractCase } from "./cases.mjs";
import { StorytellerInputError, } from "./types.mjs";
/**
 * Parse an ISO 20022 message into a normalized Story shape. Full support produces a
 * narrative-ready object; structured support extracts a stable subset for display only;
 * unsupported messages return a tagged record so the UI can render a graceful fallback.
 */
export function parseStory(input) {
    const parsed = parseMessageXml(input);
    if (!parsed.ok) {
        throw new StorytellerInputError(parsed.error);
    }
    const root = parsed.doc.documentElement;
    const documentEl = findDocumentElement(root);
    if (!documentEl) {
        throw new StorytellerInputError({
            message: "ISO 20022 Document element not found.",
        });
    }
    const kind = detectMessageKind(parsed.doc);
    // Unsupported kinds short-circuit so callers still get a graceful tagged record.
    if (kind !== "pacs.008" &&
        kind !== "pacs.009" &&
        kind !== "camt.053" &&
        kind !== "pacs.002" &&
        kind !== "pacs.004" &&
        kind !== "camt.052" &&
        kind !== "camt.054" &&
        kind !== "camt.029" &&
        kind !== "camt.056" &&
        kind !== "camt.110" &&
        kind !== "camt.111" &&
        kind !== "camt.026" &&
        kind !== "camt.027" &&
        kind !== "camt.028" &&
        kind !== "camt.087" &&
        kind !== "trck.003") {
        return { kind: "unknown", support: "unsupported", detectedKind: kind };
    }
    const body = firstElementChild(documentEl);
    if (!body) {
        throw new StorytellerInputError({
            message: "ISO 20022 Document has no body element.",
        });
    }
    switch (kind) {
        case "pacs.008":
        case "pacs.009":
            return { kind, support: "full", data: extractPayment(body, kind) };
        case "camt.053":
            return { kind, support: "full", data: extractStatement(body) };
        case "pacs.002":
        case "pacs.004":
        case "camt.052":
        case "camt.054":
            return {
                kind,
                support: "structured",
                data: extractStructured(body, kind),
            };
        case "camt.029":
        case "camt.056":
        case "camt.110":
        case "camt.111":
        case "camt.026":
        case "camt.027":
        case "camt.028":
        case "camt.087":
        case "trck.003":
            return { kind, support: "structured", data: extractCase(body, kind) };
    }
}
/**
 * Network exports often hold the business application header and the Document as two
 * top-level elements, which is not one well-formed XML document. When plain parsing
 * fails on such a file, parse it again inside a neutral wrapper.
 */
function parseMessageXml(input) {
    const parsed = parseXml(input);
    if (parsed.ok)
        return parsed;
    const body = input.trim().replace(/^<\?xml[^>]*\?>/, "");
    if (!/^\s*<([\w-]+:)?AppHdr[\s>]/.test(body) || !/<([\w-]+:)?Document[\s>]/.test(body)) {
        return parsed;
    }
    const wrapped = parseXml(`<Envelope>${body}</Envelope>`);
    return wrapped.ok ? wrapped : parsed;
}
function findDocumentElement(root) {
    if (getLocalName(root) === "Document")
        return root;
    const candidates = findDescendantsByLocalName(root, "Document");
    return candidates[0] ?? null;
}
function firstElementChild(parent) {
    const children = parent.children;
    return children.length > 0 ? children.item(0) : null;
}
function text(el) {
    if (!el)
        return null;
    const value = (el.textContent ?? "").trim();
    return value.length > 0 ? value : null;
}
function attr(el, name) {
    if (!el)
        return null;
    const value = el.getAttribute(name);
    return value && value.length > 0 ? value : null;
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
    if (!el)
        return null;
    const value = text(el);
    if (value === null)
        return null;
    return { value, currency: attr(el, "Ccy") };
}
function partyOf(el) {
    if (!el)
        return null;
    const name = text(getFirstChildByLocalName(el, "Nm")) ??
        text(chain(el, "Pty", "Nm")) ??
        text(chain(el, "FinInstnId", "Nm")) ??
        null;
    const bic = text(chain(el, "FinInstnId", "BICFI")) ?? text(chain(el, "FinInstnId", "BIC")) ?? null;
    const iban = text(chain(el, "Id", "IBAN")) ?? text(chain(el, "Acct", "Id", "IBAN")) ?? null;
    const addrEl = getFirstChildByLocalName(el, "PstlAdr") ?? chain(el, "Pty", "PstlAdr");
    const addressParts = [];
    let country = null;
    if (addrEl) {
        const children = addrEl.children;
        for (let i = 0; i < children.length; i++) {
            const child = children.item(i);
            if (!child)
                continue;
            const localName = getLocalName(child);
            const value = text(child);
            if (!value)
                continue;
            if (localName === "Ctry")
                country = value;
            else
                addressParts.push(value);
        }
    }
    if (!name && !bic && !iban && addressParts.length === 0 && !country)
        return null;
    return {
        name,
        bic,
        iban,
        country,
        address: addressParts.length > 0 ? addressParts.join(", ") : null,
    };
}
function referencesOf(parent) {
    const pmtId = parent ? getFirstChildByLocalName(parent, "PmtId") : null;
    return {
        msgId: null,
        instrId: text(pmtId ? getFirstChildByLocalName(pmtId, "InstrId") : null),
        endToEndId: text(pmtId ? getFirstChildByLocalName(pmtId, "EndToEndId") : null),
        txId: text(pmtId ? getFirstChildByLocalName(pmtId, "TxId") : null),
        uetr: text(pmtId ? getFirstChildByLocalName(pmtId, "UETR") : null),
    };
}
function intermediariesOf(tx) {
    const out = [];
    for (let i = 1; i <= 3; i++) {
        const node = getFirstChildByLocalName(tx, `IntrmyAgt${i}`) ??
            getFirstChildByLocalName(tx, `IntermediaryAgt${i}`);
        const party = partyOf(node);
        if (party)
            out.push(party);
    }
    return out;
}
function chargesOf(tx) {
    const out = [];
    for (const node of getChildrenByLocalName(tx, "ChrgsInf")) {
        const amt = moneyOf(getFirstChildByLocalName(node, "Amt"));
        if (!amt)
            continue;
        out.push({ amount: amt, agent: partyOf(getFirstChildByLocalName(node, "Agt")) });
    }
    return out;
}
function extractPayment(body, kind) {
    const grpHdr = getFirstChildByLocalName(body, "GrpHdr");
    const txs = getChildrenByLocalName(body, "CdtTrfTxInf");
    const tx = txs[0];
    if (!tx) {
        throw new StorytellerInputError({
            message: `${kind} message is missing CdtTrfTxInf.`,
        });
    }
    const msgId = text(grpHdr ? getFirstChildByLocalName(grpHdr, "MsgId") : null);
    const transactions = txs.map((item) => extractPaymentTransaction(item, grpHdr, msgId));
    const first = transactions[0];
    return {
        kind,
        msgId,
        createdAt: text(grpHdr ? getFirstChildByLocalName(grpHdr, "CreDtTm") : null),
        numberOfTxs: text(grpHdr ? getFirstChildByLocalName(grpHdr, "NbOfTxs") : null),
        settlementMethod: text(chain(grpHdr, "SttlmInf", "SttlmMtd")),
        references: first.references,
        settlementAmount: first.settlementAmount,
        instructedAmount: first.instructedAmount,
        settlementDate: first.settlementDate,
        requestedExecutionDate: first.requestedExecutionDate,
        chargeBearer: first.chargeBearer,
        debtor: first.debtor,
        ultimateDebtor: first.ultimateDebtor,
        creditor: first.creditor,
        ultimateCreditor: first.ultimateCreditor,
        route: first.route,
        remittance: first.remittance,
        charges: first.charges,
        purposeCode: first.purposeCode,
        transactions,
    };
}
function extractPaymentTransaction(tx, grpHdr, msgId) {
    const refs = referencesOf(tx);
    const route = {
        debtorAgent: partyOf(getFirstChildByLocalName(tx, "DbtrAgt")),
        creditorAgent: partyOf(getFirstChildByLocalName(tx, "CdtrAgt")),
        intermediaries: intermediariesOf(tx),
        instructingAgent: partyOf(getFirstChildByLocalName(tx, "InstgAgt")),
        instructedAgent: partyOf(getFirstChildByLocalName(tx, "InstdAgt")),
    };
    const debtor = mergeIban(partyOf(getFirstChildByLocalName(tx, "Dbtr")), text(chain(tx, "DbtrAcct", "Id", "IBAN")));
    const creditor = mergeIban(partyOf(getFirstChildByLocalName(tx, "Cdtr")), text(chain(tx, "CdtrAcct", "Id", "IBAN")));
    return {
        references: { ...refs, msgId },
        settlementAmount: moneyOf(getFirstChildByLocalName(tx, "IntrBkSttlmAmt")) ??
            moneyOf(chain(grpHdr, "TtlIntrBkSttlmAmt")),
        instructedAmount: moneyOf(getFirstChildByLocalName(tx, "InstdAmt")),
        settlementDate: text(getFirstChildByLocalName(tx, "IntrBkSttlmDt")) ??
            text(chain(grpHdr, "SttlmInf", "SttlmDt")),
        requestedExecutionDate: text(chain(tx, "PmtTpInf", "ReqdExctnDt")),
        chargeBearer: text(getFirstChildByLocalName(tx, "ChrgBr")),
        debtor,
        ultimateDebtor: partyOf(getFirstChildByLocalName(tx, "UltmtDbtr")),
        creditor,
        ultimateCreditor: partyOf(getFirstChildByLocalName(tx, "UltmtCdtr")),
        route,
        remittance: remittanceOf(getFirstChildByLocalName(tx, "RmtInf")),
        charges: chargesOf(tx),
        purposeCode: text(chain(tx, "Purp", "Cd")) ?? text(chain(tx, "Purp", "Prtry")),
    };
}
function mergeIban(party, iban) {
    if (!iban)
        return party;
    if (!party) {
        return { name: null, bic: null, iban, country: null, address: null };
    }
    return party.iban ? party : { ...party, iban };
}
function remittanceOf(rem) {
    if (!rem)
        return { unstructured: [], structured: [] };
    const unstructured = getChildrenByLocalName(rem, "Ustrd")
        .map((el) => text(el))
        .filter((v) => v !== null);
    const structured = [];
    for (const strd of getChildrenByLocalName(rem, "Strd")) {
        const ref = text(chain(strd, "CdtrRefInf", "Ref"));
        if (ref) {
            structured.push(ref);
            continue;
        }
        const addtl = text(getFirstChildByLocalName(strd, "AddtlRmtInf"));
        if (addtl)
            structured.push(addtl);
    }
    return { unstructured, structured };
}
function extractStatement(body) {
    const grpHdr = getFirstChildByLocalName(body, "GrpHdr");
    const stmt = getFirstChildByLocalName(body, "Stmt");
    if (!stmt) {
        throw new StorytellerInputError({
            message: "camt.053 message is missing Stmt element.",
        });
    }
    const acct = getFirstChildByLocalName(stmt, "Acct");
    const account = {
        iban: text(chain(acct, "Id", "IBAN")),
        currency: text(acct ? getFirstChildByLocalName(acct, "Ccy") : null),
        owner: partyOf(acct ? getFirstChildByLocalName(acct, "Ownr") : null),
        servicer: partyOf(acct ? getFirstChildByLocalName(acct, "Svcr") : null),
    };
    const balances = [];
    for (const bal of getChildrenByLocalName(stmt, "Bal")) {
        balances.push({
            type: text(chain(bal, "Tp", "CdOrPrtry", "Cd")) ?? text(chain(bal, "Tp", "CdOrPrtry", "Prtry")),
            amount: moneyOf(getFirstChildByLocalName(bal, "Amt")),
            creditDebit: text(getFirstChildByLocalName(bal, "CdtDbtInd")),
            date: text(chain(bal, "Dt", "Dt")) ?? text(chain(bal, "Dt", "DtTm")),
        });
    }
    const entries = [];
    for (const ntry of getChildrenByLocalName(stmt, "Ntry")) {
        entries.push(extractEntry(ntry));
    }
    let credits = 0;
    let debits = 0;
    for (const e of entries) {
        if (e.creditDebit === "CRDT")
            credits++;
        else if (e.creditDebit === "DBIT")
            debits++;
    }
    return {
        kind: "camt.053",
        msgId: text(grpHdr ? getFirstChildByLocalName(grpHdr, "MsgId") : null),
        createdAt: text(grpHdr ? getFirstChildByLocalName(grpHdr, "CreDtTm") : null) ??
            text(getFirstChildByLocalName(stmt, "CreDtTm")),
        statementId: text(getFirstChildByLocalName(stmt, "Id")),
        account,
        balances,
        entries,
        totals: { credits, debits, netCount: credits - debits },
    };
}
function extractEntry(ntry) {
    const txDtls = chain(ntry, "NtryDtls", "TxDtls");
    const refs = txDtls ? getFirstChildByLocalName(txDtls, "Refs") : null;
    const counterparty = partyOf(chain(txDtls, "RltdPties", "Cdtr")) ??
        partyOf(chain(txDtls, "RltdPties", "Dbtr")) ??
        null;
    const remittance = text(chain(txDtls, "RmtInf", "Ustrd")) ?? text(getFirstChildByLocalName(ntry, "AddtlNtryInf"));
    return {
        amount: moneyOf(getFirstChildByLocalName(ntry, "Amt")),
        creditDebit: text(getFirstChildByLocalName(ntry, "CdtDbtInd")),
        status: text(chain(ntry, "Sts", "Cd")) ??
            text(chain(ntry, "Sts", "Prtry")) ??
            text(getFirstChildByLocalName(ntry, "Sts")),
        bookingDate: text(chain(ntry, "BookgDt", "Dt")) ?? text(chain(ntry, "BookgDt", "DtTm")),
        valueDate: text(chain(ntry, "ValDt", "Dt")) ?? text(chain(ntry, "ValDt", "DtTm")),
        reference: text(getFirstChildByLocalName(ntry, "AcctSvcrRef")) ??
            text(getFirstChildByLocalName(ntry, "NtryRef")) ??
            text(refs ? getFirstChildByLocalName(refs, "AcctSvcrRef") : null),
        remittance,
        counterpartyName: counterparty?.name ?? null,
        endToEndId: text(refs ? getFirstChildByLocalName(refs, "EndToEndId") : null),
        txId: text(refs ? getFirstChildByLocalName(refs, "TxId") : null),
        instrId: text(refs ? getFirstChildByLocalName(refs, "InstrId") : null),
        uetr: text(refs ? getFirstChildByLocalName(refs, "UETR") : null),
    };
}
/* ----------- structured (graceful fallback) ----------- */
function extractStructured(body, kind) {
    const grpHdr = getFirstChildByLocalName(body, "GrpHdr");
    const msgId = text(grpHdr ? getFirstChildByLocalName(grpHdr, "MsgId") : null);
    const createdAt = text(grpHdr ? getFirstChildByLocalName(grpHdr, "CreDtTm") : null);
    switch (kind) {
        case "pacs.002": {
            const transactions = extractStatusTransactions(body, msgId);
            return {
                kind,
                msgId,
                createdAt,
                rows: extractStatusRows(body),
                entries: [],
                correlation: transactions[0]?.correlation ?? compactCorrelation({ msgId: msgId ?? undefined }),
                status: transactions[0]?.status,
                transactions,
            };
        }
        case "pacs.004": {
            const transactions = extractReturnTransactions(body, msgId);
            return {
                kind,
                msgId,
                createdAt,
                rows: extractReturnRows(body),
                entries: [],
                correlation: transactions[0]?.correlation ?? compactCorrelation({ msgId: msgId ?? undefined }),
                status: transactions[0]?.status,
                transactions,
            };
        }
        case "camt.052":
            return {
                kind,
                msgId,
                createdAt,
                rows: extractAcctReportRows(body, "Rpt"),
                entries: extractReportEntries(body, "Rpt"),
            };
        case "camt.054":
            return {
                kind,
                msgId,
                createdAt,
                rows: extractAcctReportRows(body, "Ntfctn"),
                entries: extractReportEntries(body, "Ntfctn"),
            };
    }
}
function pushRow(rows, label, value) {
    if (value !== null && value !== undefined && value.length > 0) {
        rows.push({ label, value });
    }
}
function compactCorrelation(values) {
    const out = {};
    for (const [key, value] of Object.entries(values)) {
        if (value && value.length > 0) {
            out[key] = value;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function compactStatus(values) {
    const out = {};
    for (const [key, value] of Object.entries(values)) {
        if (value && value.length > 0) {
            out[key] = value;
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function statusTransactionOf(tx, msgId) {
    const correlation = compactCorrelation({
        msgId: msgId ?? undefined,
        originalMsgId: text(chain(tx, "OrgnlGrpInf", "OrgnlMsgId")) ?? undefined,
        originalInstrId: text(getFirstChildByLocalName(tx, "OrgnlInstrId")) ?? undefined,
        originalEndToEndId: text(getFirstChildByLocalName(tx, "OrgnlEndToEndId")) ?? undefined,
        originalTxId: text(getFirstChildByLocalName(tx, "OrgnlTxId")) ?? undefined,
        originalUetr: text(getFirstChildByLocalName(tx, "OrgnlUETR")) ?? undefined,
    });
    const status = compactStatus({
        code: text(getFirstChildByLocalName(tx, "TxSts")) ?? undefined,
        reasonCode: text(chain(tx, "StsRsnInf", "Rsn", "Cd")) ??
            text(chain(tx, "StsRsnInf", "Rsn", "Prtry")) ??
            undefined,
        reasonDescription: text(chain(tx, "StsRsnInf", "AddtlInf")) ?? undefined,
    });
    return { correlation, status };
}
function extractStatusTransactions(body, msgId) {
    const txs = getChildrenByLocalName(body, "TxInfAndSts");
    if (txs.length === 0) {
        if (!msgId)
            return [];
        return [{ correlation: compactCorrelation({ msgId }) }];
    }
    return txs.map((tx) => statusTransactionOf(tx, msgId));
}
function returnTransactionOf(tx, msgId) {
    const correlation = compactCorrelation({
        msgId: msgId ?? undefined,
        instrId: text(getFirstChildByLocalName(tx, "RtrId")) ?? undefined,
        originalMsgId: text(chain(tx, "OrgnlGrpInf", "OrgnlMsgId")) ?? undefined,
        originalInstrId: text(getFirstChildByLocalName(tx, "OrgnlInstrId")) ?? undefined,
        originalEndToEndId: text(getFirstChildByLocalName(tx, "OrgnlEndToEndId")) ?? undefined,
        originalTxId: text(getFirstChildByLocalName(tx, "OrgnlTxId")) ?? undefined,
        originalUetr: text(getFirstChildByLocalName(tx, "OrgnlUETR")) ?? undefined,
    });
    const status = compactStatus({
        code: "RETURN",
        reasonCode: text(chain(tx, "RtrRsnInf", "Rsn", "Cd")) ?? undefined,
        reasonDescription: text(chain(tx, "RtrRsnInf", "AddtlInf")) ?? undefined,
    });
    return {
        correlation,
        status,
        amount: moneyOf(getFirstChildByLocalName(tx, "RtrdIntrBkSttlmAmt")),
        bookingDate: text(getFirstChildByLocalName(tx, "IntrBkSttlmDt")),
        reference: text(getFirstChildByLocalName(tx, "RtrId")),
    };
}
function extractReturnTransactions(body, msgId) {
    const txs = getChildrenByLocalName(body, "TxInf");
    if (txs.length === 0) {
        if (!msgId)
            return [];
        return [{ correlation: compactCorrelation({ msgId }) }];
    }
    return txs.map((tx) => returnTransactionOf(tx, msgId));
}
function extractStatusRows(body) {
    const tx = getFirstChildByLocalName(body, "TxInfAndSts");
    const rows = [];
    if (!tx)
        return rows;
    pushRow(rows, "Original message ID", text(chain(tx, "OrgnlGrpInf", "OrgnlMsgId")));
    pushRow(rows, "Original message type", text(chain(tx, "OrgnlGrpInf", "OrgnlMsgNmId")));
    pushRow(rows, "Original instruction ID", text(getFirstChildByLocalName(tx, "OrgnlInstrId")));
    pushRow(rows, "Original end-to-end ID", text(getFirstChildByLocalName(tx, "OrgnlEndToEndId")));
    pushRow(rows, "Original UETR", text(getFirstChildByLocalName(tx, "OrgnlUETR")));
    pushRow(rows, "Status", text(getFirstChildByLocalName(tx, "TxSts")));
    const reasonCode = text(chain(tx, "StsRsnInf", "Rsn", "Cd"));
    const reasonProprietary = text(chain(tx, "StsRsnInf", "Rsn", "Prtry"));
    pushRow(rows, "Reason code", reasonCode ?? reasonProprietary);
    pushRow(rows, "Additional info", text(chain(tx, "StsRsnInf", "AddtlInf")));
    pushRow(rows, "Instructing agent", text(chain(tx, "InstgAgt", "FinInstnId", "BICFI")));
    pushRow(rows, "Instructed agent", text(chain(tx, "InstdAgt", "FinInstnId", "BICFI")));
    return rows;
}
function extractReturnRows(body) {
    const tx = getFirstChildByLocalName(body, "TxInf");
    const rows = [];
    if (!tx)
        return rows;
    pushRow(rows, "Return ID", text(getFirstChildByLocalName(tx, "RtrId")));
    pushRow(rows, "Original message ID", text(chain(tx, "OrgnlGrpInf", "OrgnlMsgId")));
    pushRow(rows, "Original message type", text(chain(tx, "OrgnlGrpInf", "OrgnlMsgNmId")));
    pushRow(rows, "Original instruction ID", text(getFirstChildByLocalName(tx, "OrgnlInstrId")));
    pushRow(rows, "Original end-to-end ID", text(getFirstChildByLocalName(tx, "OrgnlEndToEndId")));
    pushRow(rows, "Original UETR", text(getFirstChildByLocalName(tx, "OrgnlUETR")));
    const returnedAmt = moneyOf(getFirstChildByLocalName(tx, "RtrdIntrBkSttlmAmt"));
    pushRow(rows, "Returned amount", formatMoney(returnedAmt));
    pushRow(rows, "Settlement date", text(getFirstChildByLocalName(tx, "IntrBkSttlmDt")));
    pushRow(rows, "Charge bearer", text(getFirstChildByLocalName(tx, "ChrgBr")));
    pushRow(rows, "Reason code", text(chain(tx, "RtrRsnInf", "Rsn", "Cd")));
    pushRow(rows, "Additional info", text(chain(tx, "RtrRsnInf", "AddtlInf")));
    pushRow(rows, "Instructing agent", text(chain(tx, "InstgAgt", "FinInstnId", "BICFI")));
    pushRow(rows, "Instructed agent", text(chain(tx, "InstdAgt", "FinInstnId", "BICFI")));
    return rows;
}
function extractAcctReportRows(body, wrapperName) {
    const wrapper = getFirstChildByLocalName(body, wrapperName);
    const rows = [];
    if (!wrapper)
        return rows;
    pushRow(rows, "Report ID", text(getFirstChildByLocalName(wrapper, "Id")));
    pushRow(rows, "Created", text(getFirstChildByLocalName(wrapper, "CreDtTm")));
    const acct = getFirstChildByLocalName(wrapper, "Acct");
    pushRow(rows, "Account IBAN", text(chain(acct, "Id", "IBAN")));
    pushRow(rows, "Account currency", text(acct ? getFirstChildByLocalName(acct, "Ccy") : null));
    pushRow(rows, "Account owner", text(chain(acct, "Ownr", "Nm")) ?? text(chain(acct, "Ownr", "FinInstnId", "BICFI")));
    for (const bal of getChildrenByLocalName(wrapper, "Bal")) {
        const type = text(chain(bal, "Tp", "CdOrPrtry", "Cd")) ?? text(chain(bal, "Tp", "CdOrPrtry", "Prtry"));
        const amount = moneyOf(getFirstChildByLocalName(bal, "Amt"));
        const cdt = text(getFirstChildByLocalName(bal, "CdtDbtInd"));
        if (amount && type) {
            const cdtSuffix = cdt ? ` ${cdt}` : "";
            pushRow(rows, `Balance ${type}`, `${formatMoney(amount)}${cdtSuffix}`);
        }
    }
    return rows;
}
function extractReportEntries(body, wrapperName) {
    const wrapper = getFirstChildByLocalName(body, wrapperName);
    if (!wrapper)
        return [];
    const entries = [];
    for (const ntry of getChildrenByLocalName(wrapper, "Ntry")) {
        entries.push(extractEntry(ntry));
    }
    return entries;
}
function formatMoney(amount) {
    if (!amount)
        return null;
    return amount.currency ? `${amount.value} ${amount.currency}` : amount.value;
}
export function detectKindFromText(input) {
    const parsed = parseMessageXml(input);
    if (!parsed.ok) {
        throw new StorytellerInputError(parsed.error);
    }
    return detectMessageKind(parsed.doc);
}
