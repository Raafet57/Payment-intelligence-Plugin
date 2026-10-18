// Generated from src/lib/storyteller/summarize.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { buildNarratives, formatMoney } from "./narrative.mjs";
import { buildOperatorSummary } from "./operatorSummary.mjs";
/** Extract key/value rows used by the summary panel · never includes raw XML payload. */
export function summaryRows(story) {
    if (story.support === "unsupported") {
        return [{ label: "Detected kind", value: story.detectedKind }];
    }
    if (story.support === "structured") {
        return [
            { label: "Message type", value: story.kind },
            ...nullable("Message ID", story.data.msgId),
            ...nullable("Created", story.data.createdAt),
            ...story.data.rows,
        ];
    }
    if (story.kind === "camt.053")
        return statementRows(story.data);
    return paymentRows(story.data);
}
function nullable(label, value) {
    return value ? [{ label, value }] : [];
}
function paymentRows(payment) {
    const rows = [
        { label: "Message type", value: payment.kind },
        ...nullable("Message ID", payment.msgId),
        ...nullable("Created", payment.createdAt),
        ...nullable("Payer", payment.debtor?.name ?? payment.route.debtorAgent?.name ?? payment.route.debtorAgent?.bic),
        ...nullable("Beneficiary", payment.creditor?.name ??
            payment.route.creditorAgent?.name ??
            payment.route.creditorAgent?.bic),
        ...nullable("Settlement amount", payment.settlementAmount ? formatMoney(payment.settlementAmount) : null),
        ...nullable("Instructed amount", payment.instructedAmount ? formatMoney(payment.instructedAmount) : null),
        ...nullable("Settlement date", payment.settlementDate),
        ...nullable("Charge bearer", payment.chargeBearer),
        ...nullable("Instruction ID", payment.references.instrId),
        ...nullable("End-to-end ID", payment.references.endToEndId),
        ...nullable("Transaction ID", payment.references.txId),
        ...nullable("UETR", payment.references.uetr),
    ];
    if (payment.route.intermediaries.length > 0) {
        rows.push({
            label: "Intermediaries",
            value: payment.route.intermediaries.map((p) => p.name ?? p.bic ?? "·").join(", "),
        });
    }
    return rows;
}
function statementRows(stmt) {
    const rows = [
        { label: "Message type", value: stmt.kind },
        ...nullable("Message ID", stmt.msgId),
        ...nullable("Created", stmt.createdAt),
        ...nullable("Statement ID", stmt.statementId),
        ...nullable("Account IBAN", stmt.account.iban),
        ...nullable("Account currency", stmt.account.currency),
        ...nullable("Owner", stmt.account.owner?.name ?? stmt.account.owner?.bic),
        ...nullable("Servicer", stmt.account.servicer?.bic ?? stmt.account.servicer?.name),
    ];
    for (const bal of stmt.balances) {
        if (!bal.amount)
            continue;
        const direction = bal.creditDebit ? ` ${bal.creditDebit}` : "";
        const date = bal.date ? ` (${bal.date})` : "";
        rows.push({
            label: bal.type ? `Balance ${bal.type}` : "Balance",
            value: `${formatMoney(bal.amount)}${direction}${date}`,
        });
    }
    rows.push({
        label: "Entries",
        value: `${stmt.entries.length} (${stmt.totals.credits} credits, ${stmt.totals.debits} debits)`,
    });
    return rows;
}
/** Stable JSON projection of the parsed story. Never embeds the raw XML payload. */
export function summarizeJson(story, indent = 2) {
    return JSON.stringify(jsonShape(story), null, indent);
}
function jsonShape(story) {
    if (story.support === "unsupported") {
        return {
            message_type: "unknown",
            detected_kind: story.detectedKind,
            support: "unsupported",
            note: "This message kind is not summarized in detail by Storyteller.",
        };
    }
    if (story.support === "structured") {
        const summary = story;
        return {
            message_type: summary.kind,
            support: "structured",
            msg_id: summary.data.msgId,
            created: summary.data.createdAt,
            fields: summary.data.rows,
            entries: summary.data.entries,
        };
    }
    return story.kind === "camt.053" ? story.data : story.data;
}
/** Build a human-readable Markdown digest. */
export function summarizeMarkdown(story) {
    const operatorSummary = buildOperatorSummary(story);
    if (story.support === "unsupported") {
        return [
            `# Storyteller report`,
            ``,
            `**Detected kind:** ${story.detectedKind}`,
            ``,
            ...renderOperatorSummaryMarkdown(operatorSummary),
            `This ISO 20022 message kind is not currently summarized by Storyteller.`,
            ``,
        ].join("\n");
    }
    const lines = [];
    lines.push(`# Storyteller report · ${story.kind}`);
    lines.push("");
    lines.push(...renderOperatorSummaryMarkdown(operatorSummary));
    if (story.support === "full") {
        const { narrative, concise } = buildNarratives(story);
        lines.push("## Narrative");
        lines.push("");
        lines.push(narrative);
        lines.push("");
        lines.push("## Concise");
        lines.push("");
        lines.push(concise);
        lines.push("");
    }
    else {
        lines.push("## Structured fields");
        lines.push("");
        for (const row of story.data.rows) {
            lines.push(`- **${row.label}:** ${row.value}`);
        }
        lines.push("");
    }
    lines.push("## Key fields");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("| --- | --- |");
    for (const row of summaryRows(story)) {
        lines.push(`| ${row.label} | ${escapeCell(row.value)} |`);
    }
    lines.push("");
    return lines.join("\n");
}
function escapeCell(value) {
    return value.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}
function renderOperatorSummaryMarkdown(summary) {
    const out = ["## At a glance", ""];
    for (const line of summary.lines) {
        out.push(`- **${line.label}:** ${line.value}`);
    }
    out.push("");
    return out;
}
