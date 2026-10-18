// Generated from src/lib/iban/internal/mask.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure SWIFT structure-mask parser. The IBAN Registry expresses BBAN/IBAN
 * shapes as a sequence of `<count>!<class>` tokens, e.g. `4!n4!n12!c`:
 *   - `n` · digits 0-9
 *   - `a` · uppercase letters A-Z
 *   - `c` · alphanumeric (digits + uppercase letters)
 *   - `e` · space (rare; treated as literal space)
 *
 * The trailing `!` means fixed-length. SWIFT also defines optional
 * variable-length forms (no `!`), but the IBAN registry never uses them
 * inside BBAN structures, so we do not support them here. If we encounter
 * one we throw.
 *
 * The IBAN structure additionally prefixes its mask with the literal 2-letter
 * country code (e.g. `AD2!n4!n4!n12!c`). Any consecutive run of uppercase
 * letters before a length token is parsed as a literal segment that must
 * appear verbatim in the value.
 */
const VALID_CLASSES = new Set(["n", "a", "c", "e"]);
export function parseMask(mask) {
    if (!mask)
        throw new Error("parseMask: empty mask");
    const segments = [];
    let cursor = 0;
    let position = 0;
    while (cursor < mask.length) {
        const head = mask[cursor];
        if (head >= "A" && head <= "Z") {
            let literal = "";
            while (cursor < mask.length && mask[cursor] >= "A" && mask[cursor] <= "Z") {
                literal += mask[cursor];
                cursor++;
            }
            segments.push({ kind: "literal", length: literal.length, literal, start: position });
            position += literal.length;
            continue;
        }
        let digits = "";
        while (cursor < mask.length && mask[cursor] >= "0" && mask[cursor] <= "9") {
            digits += mask[cursor];
            cursor++;
        }
        if (digits === "") {
            throw new Error(`parseMask: expected length digit at ${cursor} in "${mask}"`);
        }
        if (mask[cursor] !== "!") {
            throw new Error(`parseMask: only fixed-length (\`!\`) tokens supported, got "${mask[cursor]}" at ${cursor} in "${mask}"`);
        }
        cursor++;
        const cls = mask[cursor];
        if (!cls || !VALID_CLASSES.has(cls)) {
            throw new Error(`parseMask: invalid char class "${cls}" at ${cursor} in "${mask}"`);
        }
        cursor++;
        const length = Number(digits);
        segments.push({ kind: "class", length, charClass: cls, start: position });
        position += length;
    }
    return segments;
}
/** Total declared length of a mask (sum of segment lengths). */
export function maskLength(mask) {
    return parseMask(mask).reduce((sum, s) => sum + s.length, 0);
}
function classMatches(ch, cls) {
    if (cls === "n")
        return ch >= "0" && ch <= "9";
    if (cls === "a")
        return ch >= "A" && ch <= "Z";
    if (cls === "c")
        return (ch >= "0" && ch <= "9") || (ch >= "A" && ch <= "Z");
    return ch === " ";
}
/** Validate a value against a parsed segment list (length + each char class). */
export function matchSegments(value, segments) {
    const expectedLen = segments.reduce((sum, s) => sum + s.length, 0);
    if (value.length !== expectedLen)
        return false;
    for (const seg of segments) {
        if (seg.kind === "literal") {
            for (let i = 0; i < seg.length; i++) {
                if (value[seg.start + i] !== seg.literal[i])
                    return false;
            }
        }
        else {
            for (let i = 0; i < seg.length; i++) {
                if (!classMatches(value[seg.start + i], seg.charClass))
                    return false;
            }
        }
    }
    return true;
}
/** Convenience: parse the mask and validate the value in one call. */
export function matchMask(value, mask) {
    return matchSegments(value, parseMask(mask));
}
