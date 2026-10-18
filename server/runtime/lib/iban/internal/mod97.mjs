// Generated from src/lib/iban/internal/mod97.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure ISO 13616 MOD-97 implementation. No coupling to the registry dataset.
 *
 * `validateMod97` accepts a normalized IBAN (uppercase, no whitespace), moves
 * the first four characters to the end, expands letters via A=10..Z=35, and
 * computes the integer mod 97. A valid IBAN yields a remainder of 1.
 *
 * `letterToDigits` and `mod97` are exposed for tests and the generator.
 */
const A_CODE = 65;
const Z_CODE = 90;
const ZERO_CODE = 48;
const NINE_CODE = 57;
function letterToDigits(ch) {
    const code = ch.charCodeAt(0);
    if (code >= A_CODE && code <= Z_CODE) {
        return String(code - A_CODE + 10);
    }
    if (code >= ZERO_CODE && code <= NINE_CODE) {
        return ch;
    }
    return null;
}
export function ibanToNumeric(rearranged) {
    let out = "";
    for (let i = 0; i < rearranged.length; i++) {
        const piece = letterToDigits(rearranged[i]);
        if (piece === null)
            return null;
        out += piece;
    }
    return out;
}
/** Compute mod 97 of an arbitrarily long numeric string without BigInt. */
export function mod97(numeric) {
    let remainder = 0;
    for (let i = 0; i < numeric.length; i++) {
        const code = numeric.charCodeAt(i);
        if (code < ZERO_CODE || code > NINE_CODE) {
            throw new Error("mod97: numeric string contains a non-digit");
        }
        remainder = (remainder * 10 + (code - ZERO_CODE)) % 97;
    }
    return remainder;
}
/**
 * Validate the ISO 13616 check digits of a normalized IBAN. Caller must have
 * already uppercased and stripped whitespace; this function does NOT validate
 * length, structure mask, or country.
 *
 * Returns true iff every character is `[A-Z0-9]` AND the rearranged numeric
 * representation has remainder 1 mod 97.
 */
export function validateMod97(normalized) {
    if (normalized.length < 5)
        return false;
    const rearranged = normalized.slice(4) + normalized.slice(0, 4);
    const numeric = ibanToNumeric(rearranged);
    if (numeric === null)
        return false;
    return mod97(numeric) === 1;
}
