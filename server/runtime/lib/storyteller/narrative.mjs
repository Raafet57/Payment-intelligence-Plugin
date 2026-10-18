// Generated from src/lib/storyteller/narrative.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
export function buildNarratives(story) {
    if (story.support !== "full") {
        return { narrative: "", concise: "" };
    }
    return {
        narrative: buildNarrative(story),
        concise: buildConcise(story),
    };
}
export function buildNarrative(story) {
    if (story.kind === "camt.053")
        return statementNarrative(story.data);
    return paymentNarrative(story.data);
}
export function buildConcise(story) {
    if (story.kind === "camt.053")
        return statementConcise(story.data);
    return paymentConcise(story.data);
}
function paymentNarrative(payment) {
    const debtor = displayName(payment.debtor) ?? displayName(payment.route.debtorAgent) ?? "an unspecified party";
    const creditor = displayName(payment.creditor) ??
        displayName(payment.route.creditorAgent) ??
        "an unspecified party";
    const amount = formatMoney(payment.settlementAmount ?? payment.instructedAmount);
    const created = payment.createdAt ?? "an unknown date";
    const charge = payment.chargeBearer ?? "unspecified";
    const intermediaries = payment.route.intermediaries
        .map((p) => displayName(p))
        .filter((v) => v !== null);
    const purpose = formatPurpose(payment);
    const parts = [];
    parts.push(`${debtor} is sending ${amount} to ${creditor}.`);
    parts.push(`The request was created on ${created}, with charge bearer set to ${charge}.`);
    parts.push(intermediaries.length > 0
        ? `Routing involves ${intermediaries.join(", ")}.`
        : "No intermediary banks are specified.");
    parts.push(`Purpose: ${purpose}.`);
    if (payment.references.uetr) {
        parts.push(`The transaction UETR is ${payment.references.uetr}.`);
    }
    if (payment.settlementDate) {
        parts.push(`Settlement date: ${payment.settlementDate}.`);
    }
    return parts.join(" ");
}
function paymentConcise(payment) {
    const lines = [
        `Type: ${payment.kind}`,
        `Payer: ${displayName(payment.debtor) ?? displayName(payment.route.debtorAgent) ?? "n/a"}`,
        `Beneficiary: ${displayName(payment.creditor) ?? displayName(payment.route.creditorAgent) ?? "n/a"}`,
        `Amount: ${formatMoney(payment.settlementAmount ?? payment.instructedAmount)}`,
        `Charge bearer: ${payment.chargeBearer ?? "n/a"}`,
        `Created: ${payment.createdAt ?? "n/a"}`,
        `UETR: ${payment.references.uetr ?? "n/a"}`,
        `Purpose: ${formatPurpose(payment)}`,
        `Intermediaries: ${payment.route.intermediaries
            .map((p) => displayName(p))
            .filter((v) => v !== null)
            .join(", ") || "none"}`,
    ];
    return lines.map((l) => `- ${l}`).join("\n");
}
function statementNarrative(stmt) {
    const owner = displayName(stmt.account.owner) ??
        displayName(stmt.account.servicer) ??
        "an unspecified holder";
    const iban = stmt.account.iban ?? "unspecified account";
    const closing = stmt.balances.find((b) => b.type === "CLBD") ?? stmt.balances[stmt.balances.length - 1] ?? null;
    const closingMoney = closing?.amount ? formatMoney(closing.amount) : "n/a";
    const closingDate = closing?.date ?? stmt.createdAt ?? "n/a";
    const sample = stmt.entries.slice(0, 3).map(formatEntrySnippet);
    const sampleSentence = sample.length > 0 ? sample.join("; ") : "no booked entries described";
    return `Statement for ${owner} (${iban}) reports a closing balance of ${closingMoney} on ${closingDate}. The file lists ${stmt.entries.length} entries; examples include ${sampleSentence}.`;
}
function statementConcise(stmt) {
    const closing = stmt.balances.find((b) => b.type === "CLBD") ?? stmt.balances[stmt.balances.length - 1];
    const lines = [
        `Type: ${stmt.kind}`,
        `Account: ${stmt.account.iban ?? "n/a"}`,
        `Owner: ${displayName(stmt.account.owner) ?? "n/a"}`,
        `Closing balance: ${closing ? formatMoney(closing.amount) : "n/a"}`,
        `Entries: ${stmt.entries.length} (${stmt.totals.credits} credits, ${stmt.totals.debits} debits)`,
    ];
    return lines.map((l) => `- ${l}`).join("\n");
}
function formatEntrySnippet(entry) {
    const amount = entry.amount ? formatMoney(entry.amount) : "n/a";
    const direction = entry.creditDebit ?? "entry";
    const date = entry.bookingDate ?? entry.valueDate ?? "n/a";
    const reference = entry.reference ?? entry.endToEndId ?? "n/a";
    return `${direction} entry of ${amount} on ${date} (ref ${reference})`;
}
function displayName(party) {
    if (!party)
        return null;
    return party.name ?? party.bic ?? party.iban ?? null;
}
export function formatMoney(money) {
    if (!money)
        return "an unspecified amount";
    const numeric = Number(money.value);
    const formatted = Number.isFinite(numeric)
        ? new Intl.NumberFormat("en-US", {
            minimumFractionDigits: hasDecimal(money.value) ? 2 : 0,
            maximumFractionDigits: 2,
        }).format(numeric)
        : money.value;
    return money.currency ? `${formatted} ${money.currency}` : formatted;
}
function hasDecimal(value) {
    return value.includes(".");
}
function formatPurpose(payment) {
    if (payment.remittance.unstructured.length > 0)
        return payment.remittance.unstructured.join("; ");
    if (payment.remittance.structured.length > 0)
        return payment.remittance.structured.join("; ");
    if (payment.purposeCode)
        return payment.purposeCode;
    return "no remittance information";
}
