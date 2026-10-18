// Generated from src/lib/iban/internal/normalize.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure helpers · no imports from the generated dataset, the registry loader,
 * or any IO. Reused by both the runtime `analyzeIban` and the build-time
 * registry generator so the two cannot drift.
 */
/** Uppercase, strip whitespace. Returns "" for nullish input. */
export function normalizeIban(input) {
    if (!input)
        return "";
    let out = "";
    for (const ch of input) {
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r")
            continue;
        out += ch.toUpperCase();
    }
    return out;
}
/** Group a normalized IBAN into 4-char blocks separated by single spaces. */
export function prettyPrint(normalized) {
    if (!normalized)
        return "";
    const parts = [];
    for (let i = 0; i < normalized.length; i += 4) {
        parts.push(normalized.slice(i, i + 4));
    }
    return parts.join(" ");
}
