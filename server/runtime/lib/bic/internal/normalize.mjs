// Generated from src/lib/bic/internal/normalize.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure helpers for normalizing and pretty-printing BIC input. No imports
 * from the generated snapshot, the registry loader, or any IO.
 */
/** Uppercase, strip whitespace. Returns "" for nullish input. */
export function normalizeBic(input) {
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
/**
 * Expand a BIC8 to its primary-office BIC11 form by appending `XXX`. Inputs
 * already at 11 characters (or any other length) pass through unchanged.
 */
export function expandToBic11(normalized) {
    if (normalized.length === 8)
        return `${normalized}XXX`;
    return normalized;
}
/** Pretty-print a normalized BIC8 or BIC11 with single-space groupings. */
export function prettyBic(normalized) {
    if (!normalized)
        return "";
    const institution = normalized.slice(0, 4);
    const country = normalized.slice(4, 6);
    const location = normalized.slice(6, 8);
    const branch = normalized.slice(8);
    const parts = [];
    if (institution)
        parts.push(institution);
    if (country)
        parts.push(country);
    if (location)
        parts.push(location);
    if (branch)
        parts.push(branch);
    return parts.join(" ");
}
