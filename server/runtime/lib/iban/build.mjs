// Generated from src/lib/iban/build.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure IBAN builder. Given a country code and exact-length BBAN field
 * values, computes ISO 13616 check digits and returns the assembled
 * IBAN, its pretty-printed form, and the runtime analysis.
 *
 * No fetch, telemetry, storage, live BIC enrichment, account-existence
 * check, or VOP. Every fact comes from the bundled registry and a
 * synchronous string operation.
 */
import { ibanToNumeric, mod97 } from "./internal/mod97.mjs";
import { prettyPrint } from "./internal/normalize.mjs";
import { getCountry } from "./registry.mjs";
import { charsetMatches, describeCharClass, getBbanTemplate, } from "./structure.mjs";
import { analyzeIban } from "./validate.mjs";
function normalizeFieldValue(raw) {
    if (!raw)
        return "";
    let out = "";
    for (const ch of raw) {
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r")
            continue;
        out += ch.toUpperCase();
    }
    return out;
}
function validateField(field, raw) {
    const value = normalizeFieldValue(raw);
    if (value.length === 0) {
        return {
            fieldId: field.id,
            label: field.label,
            reason: "missing",
            expectedLength: field.length,
            actualLength: 0,
            charClass: field.charClass,
            message: `${field.label} is required (${field.length} ${describeCharClass(field.charClass)}).`,
        };
    }
    if (value.length !== field.length) {
        return {
            fieldId: field.id,
            label: field.label,
            reason: "wrong-length",
            expectedLength: field.length,
            actualLength: value.length,
            charClass: field.charClass,
            message: `${field.label} must be exactly ${field.length} characters (got ${value.length}).`,
        };
    }
    if (!charsetMatches(value, field.charClass)) {
        return {
            fieldId: field.id,
            label: field.label,
            reason: "wrong-charset",
            expectedLength: field.length,
            actualLength: value.length,
            charClass: field.charClass,
            message: `${field.label} must be ${describeCharClass(field.charClass)}.`,
        };
    }
    return undefined;
}
/**
 * Compute ISO 13616 check digits for a country and BBAN string.
 * Both inputs must already be uppercased and stripped of whitespace.
 *
 * Returns a two-character zero-padded string (`"00".."98"`) or
 * `undefined` if the inputs contain characters outside [A-Z0-9].
 */
export function computeCheckDigits(countryCode, bban) {
    const numeric = ibanToNumeric(bban + countryCode + "00");
    if (numeric === null)
        return undefined;
    const remainder = mod97(numeric);
    const cd = 98 - remainder;
    return cd.toString().padStart(2, "0");
}
/**
 * Assemble an IBAN from a country code and exact-length BBAN field values.
 *
 * Field values are normalized (whitespace stripped, uppercased) but
 * never numerically padded · the builder rejects values that are not
 * already the right length.
 */
export function buildIban(input) {
    const code = (input.countryCode ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
        return {
            ok: false,
            reason: "unknown-country",
            message: "Pick a country from the bundled IBAN registry.",
        };
    }
    const country = getCountry(code);
    if (!country) {
        return {
            ok: false,
            reason: "unknown-country",
            message: `Country “${code}” is not in the bundled IBAN registry.`,
        };
    }
    const template = getBbanTemplate(country);
    const fieldErrors = [];
    for (const field of template.fields) {
        const err = validateField(field, input.fields[field.id]);
        if (err)
            fieldErrors.push(err);
    }
    if (fieldErrors.length > 0) {
        return {
            ok: false,
            reason: "field-errors",
            message: `${fieldErrors.length} field${fieldErrors.length === 1 ? "" : "s"} need attention.`,
            template,
            fieldErrors,
        };
    }
    let bban = "";
    for (const field of template.fields) {
        bban += normalizeFieldValue(input.fields[field.id]);
    }
    const checkDigits = computeCheckDigits(code, bban);
    if (checkDigits === undefined) {
        return {
            ok: false,
            reason: "internal-self-check",
            message: "Internal: could not derive ISO 13616 check digits.",
            template,
        };
    }
    const electronic = code + checkDigits + bban;
    const pretty = prettyPrint(electronic);
    const analysis = analyzeIban(electronic);
    if (analysis.verdict !== "valid") {
        return {
            ok: false,
            reason: "internal-self-check",
            message: "Internal: assembled IBAN failed self-check.",
            template,
            analysis,
        };
    }
    return {
        ok: true,
        countryCode: code,
        bban,
        checkDigits,
        electronic,
        pretty,
        template,
        analysis,
    };
}
