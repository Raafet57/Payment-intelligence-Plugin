// Generated from src/lib/iso20022/pseudonym.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { buildIbanPseudonym, buildNonIbanPseudonym } from "./iban.mjs";
/** Mask a free-form string for display only · never expose the full original. */
export function maskOriginal(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0)
        return "";
    if (trimmed.length <= 4)
        return "*".repeat(trimmed.length);
    if (trimmed.length <= 8) {
        return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
    }
    const head = trimmed.slice(0, 2);
    const tail = trimmed.slice(-2);
    const middle = "*".repeat(Math.min(8, trimmed.length - 4));
    return `${head}${middle}${tail} (${trimmed.length} chars)`;
}
/** Counter-driven name pseudonym: "Person A", "Person B", ... wrapping into "Person AA" etc. */
export function namePseudonym(counter) {
    return `Person ${alphaLabel(counter)}`;
}
export function addressLeafPseudonym(localName, counter) {
    switch (localName) {
        case "StrtNm":
            return `${counter} Sample Street`;
        case "BldgNb":
            return String(((counter - 1) % 999) + 1);
        case "BldgNm":
            return `Sample Building ${counter}`;
        case "PstCd":
            return `9${String(counter % 10000).padStart(4, "0")}`;
        case "TwnNm":
            return `Sample City ${counter}`;
        case "TwnLctnNm":
            return `Sample District ${counter}`;
        case "DstrctNm":
            return `Sample District ${counter}`;
        case "CtrySubDvsn":
            return `Sample Region ${counter}`;
        case "AdrLine":
            return `Address line ${counter}`;
        case "Dept":
            return `Department ${counter}`;
        case "SubDept":
            return `Sub-department ${counter}`;
        case "Flr":
            return `Floor ${counter}`;
        case "Room":
            return `Room ${counter}`;
        case "PstBx":
            return `PO Box ${counter}`;
        default:
            return `Sample ${localName} ${counter}`;
    }
}
export function ibanPseudonym(counter, originalCountry) {
    return buildIbanPseudonym(originalCountry, counter);
}
export function fallbackAccountPseudonym(counter) {
    return buildNonIbanPseudonym(counter);
}
export function accountPseudonym(counter) {
    return `9${String(counter * 7919)
        .padStart(11, "0")
        .slice(-11)}`;
}
export function orgIdPseudonym(counter) {
    return `ORG-${String(counter).padStart(8, "0")}`;
}
export function prvtIdPseudonym(counter) {
    return `PVT-${String(counter).padStart(8, "0")}`;
}
export function fiOtherIdPseudonym(counter) {
    return `FI-${String(counter).padStart(8, "0")}`;
}
export function referencePseudonym(localName, counter) {
    const tag = localName.toUpperCase().slice(0, 6);
    return `${tag}-${String(counter).padStart(6, "0")}`;
}
export function msgIdPseudonym(localName, counter) {
    return `${localName.toUpperCase()}-${String(counter).padStart(6, "0")}`;
}
export function remittancePseudonym(counter) {
    return `Remittance text ${counter}`;
}
export function contactPseudonym(localName, counter) {
    switch (localName) {
        case "EmailAdr":
            return `person${counter}@example.invalid`;
        case "PhneNb":
        case "MobNb":
        case "FaxNb":
            return `+10000000${String(counter).padStart(3, "0")}`;
        default:
            return `Contact-${counter}`;
    }
}
/**
 * UUID v4-shaped pseudonym derived from the counter. We seed an LCG from the counter so
 * outputs are deterministic and well distributed without any cryptographic guarantees.
 */
export function uetrPseudonym(counter) {
    const bytes = new Uint8Array(16);
    let state = (counter >>> 0) * 1664525 + 1013904223;
    for (let i = 0; i < 16; i++) {
        state = (state * 1664525 + 1013904223) >>> 0;
        bytes[i] = state & 0xff;
    }
    // Force version 4 and the variant bits per RFC 4122.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
/** Convert 1 → "A", 26 → "Z", 27 → "AA", 53 → "BA", etc. */
function alphaLabel(counter) {
    let n = Math.max(1, Math.floor(counter));
    let label = "";
    while (n > 0) {
        n -= 1;
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26);
    }
    return label;
}
/** Helper map of mask types to their counter-driven generator (for stable, reusable wiring). */
export const PSEUDONYM_GENERATORS = Object.freeze({
    name: (n) => namePseudonym(n),
    address: (n, hint) => addressLeafPseudonym(hint ?? "AdrLine", n),
    iban: (n, hint) => ibanPseudonym(n, hint ?? null),
    account: (n) => accountPseudonym(n),
    orgId: (n) => orgIdPseudonym(n),
    prvtId: (n) => prvtIdPseudonym(n),
    fiOtherId: (n) => fiOtherIdPseudonym(n),
    reference: (n, hint) => referencePseudonym(hint ?? "REF", n),
    uetr: (n) => uetrPseudonym(n),
    msgId: (n, hint) => msgIdPseudonym(hint ?? "MSG", n),
    remittance: (n) => remittancePseudonym(n),
    contact: (n, hint) => contactPseudonym(hint ?? "EmailAdr", n),
    date: (n) => String(n),
});
