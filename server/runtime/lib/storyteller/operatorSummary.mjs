// Generated from src/lib/storyteller/operatorSummary.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { formatMoney } from "./narrative.mjs";
import { generateInsights } from "./insights.mjs";
/** Build a compact, scannable operator-glance summary. Pure; no DOM. */
export function buildOperatorSummary(story) {
    if (story.support === "unsupported") {
        return {
            kindLabel: story.detectedKind,
            support: "unsupported",
            lines: [{ label: "Note", value: "No compact summary for this message kind." }],
        };
    }
    if (story.support === "structured") {
        return {
            kindLabel: story.kind,
            support: "structured",
            lines: structuredLines(story),
        };
    }
    if (story.kind === "camt.053") {
        return { kindLabel: story.kind, support: "full", lines: statementLines(story.data) };
    }
    return { kindLabel: story.kind, support: "full", lines: paymentLines(story) };
}
function paymentLines(story) {
    const p = story.data;
    const lines = [];
    const debtorName = displayName(p.debtor) ?? displayName(p.route.debtorAgent);
    const creditorName = displayName(p.creditor) ?? displayName(p.route.creditorAgent);
    if (debtorName || creditorName) {
        const interNames = p.route.intermediaries
            .map(displayName)
            .filter((v) => v !== null);
        const via = interNames.length > 0 ? ` (via ${interNames.join(", ")})` : "";
        pushLine(lines, "Direction", `${debtorName ?? "?"} → ${creditorName ?? "?"}${via}`);
    }
    const amount = p.settlementAmount ?? p.instructedAmount;
    if (amount)
        pushLine(lines, "Amount", formatMoney(amount), "money");
    const warnInsights = generateInsights(story).filter((i) => i.severity === "warn");
    if (warnInsights.length > 0) {
        const detail = warnInsights.length === 1 ? warnInsights[0].id : `${warnInsights.length} warnings`;
        pushLine(lines, "Status", `Review · ${detail}`, "status");
    }
    const refs = [];
    if (p.references.uetr)
        refs.push(p.references.uetr);
    if (p.references.endToEndId && p.references.endToEndId !== p.references.uetr) {
        refs.push(p.references.endToEndId);
    }
    if (refs.length === 0 && p.references.txId)
        refs.push(p.references.txId);
    if (refs.length === 0 && p.references.msgId)
        refs.push(p.references.msgId);
    if (refs.length > 0)
        pushLine(lines, "Reference", refs.join(" · "), "ref");
    pushLine(lines, "When", p.settlementDate ?? p.createdAt);
    return lines;
}
function statementLines(stmt) {
    const lines = [];
    const ownerName = displayName(stmt.account.owner) ?? displayName(stmt.account.servicer);
    const headlineParts = [];
    if (ownerName)
        headlineParts.push(`Statement for ${ownerName}`);
    if (stmt.account.iban)
        headlineParts.push(stmt.account.iban);
    if (headlineParts.length > 0) {
        pushLine(lines, "Account", headlineParts.join(" · "));
    }
    const closing = stmt.balances.find((b) => b.type === "CLBD") ?? stmt.balances[stmt.balances.length - 1];
    if (closing?.amount) {
        const dateSuffix = closing.date ? ` (${closing.date})` : "";
        pushLine(lines, "Closing balance", `${formatMoney(closing.amount)}${dateSuffix}`, "money");
    }
    pushLine(lines, "Entries", `${stmt.entries.length} (${stmt.totals.credits} credits, ${stmt.totals.debits} debits)`);
    pushLine(lines, "When", closing?.date ?? stmt.createdAt);
    return lines;
}
function structuredLines(story) {
    const data = story.data;
    const lines = [];
    if (data.kind === "camt.052" || data.kind === "camt.054") {
        const ibanRow = data.rows.find((r) => r.label === "Account IBAN")?.value;
        const ownerRow = data.rows.find((r) => r.label === "Account owner")?.value;
        pushLine(lines, "Account", ibanRow ?? ownerRow);
        const credits = data.entries.filter((e) => e.creditDebit === "CRDT").length;
        const debits = data.entries.filter((e) => e.creditDebit === "DBIT").length;
        pushLine(lines, "Entries", `${data.entries.length} (${credits} credits, ${debits} debits)`);
        pushLine(lines, "When", data.createdAt);
        return lines;
    }
    if (data.case) {
        const c = data.case;
        pushLine(lines, "Case", c.caseId);
        pushLine(lines, "Type", c.investigationType);
        if (c.statusCode) {
            const outcome = [c.statusCode, c.reasonCode].filter(Boolean).join(" · ");
            pushLine(lines, "Status", outcome, "status");
        }
        else {
            pushLine(lines, "Reason", c.reasonCode, "status");
        }
        pushLine(lines, "Reference", c.underlying.uetr ?? c.underlying.endToEndId ?? c.underlying.msgId, "ref");
        pushLine(lines, "When", data.createdAt);
        return lines;
    }
    // pacs.002 / pacs.004
    const status = data.rows.find((r) => r.label === "Status")?.value ?? null;
    const reasonCode = data.rows.find((r) => r.label === "Reason code")?.value ?? null;
    if (status || reasonCode) {
        const parts = [];
        if (status)
            parts.push(status);
        if (reasonCode)
            parts.push(reasonCode);
        pushLine(lines, "Status", parts.join(" · "), "status");
    }
    const ref = data.rows.find((r) => r.label === "Original end-to-end ID")?.value ??
        data.rows.find((r) => r.label === "Original message ID")?.value ??
        data.msgId;
    pushLine(lines, "Reference", ref, "ref");
    pushLine(lines, "When", data.createdAt);
    return lines;
}
function displayName(party) {
    if (!party)
        return null;
    return party.name ?? party.bic ?? party.iban ?? null;
}
function pushLine(lines, label, value, emphasis) {
    if (value === null || value === undefined)
        return;
    if (value.length === 0)
        return;
    if (emphasis)
        lines.push({ label, value, emphasis });
    else
        lines.push({ label, value });
}
