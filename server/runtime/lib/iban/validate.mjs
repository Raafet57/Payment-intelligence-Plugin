// Generated from src/lib/iban/validate.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure runtime IBAN validator. Combines the curated registry (country
 * lookup, declared length, BBAN/IBAN structure masks, BBAN field positions)
 * with the ISO 13616 mod-97 checksum to produce a structured analysis the
 * UI can render directly.
 *
 * No fetch, storage, telemetry, or live enrichment · every fact comes from
 * the bundled generated JSON or a synchronous string operation.
 */
import { matchMask } from "./internal/mask.mjs";
import { validateMod97 } from "./internal/mod97.mjs";
import { normalizeIban, prettyPrint } from "./internal/normalize.mjs";
import { getCountry } from "./registry.mjs";
function makeCheck(id, label, status, detail) {
    return { id, label, status, detail };
}
function detectCountry(normalized) {
    if (normalized.length < 2)
        return { code: "" };
    const code = normalized.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(code))
        return { code };
    const country = getCountry(code);
    return country ? { code, country } : { code };
}
function buildBban(country, normalized) {
    if (normalized.length !== country.ibanLength)
        return undefined;
    const bban = normalized.slice(4);
    const fields = [];
    let bankEnd = 0;
    if (country.bankIdentifier) {
        const range = parseRange(country.bankIdentifier.position);
        if (range) {
            fields.push({
                id: "bank-identifier",
                label: "Bank identifier",
                position: country.bankIdentifier.position,
                value: bban.slice(range.start, range.end),
            });
            bankEnd = Math.max(bankEnd, range.end);
        }
    }
    let branchEnd = bankEnd;
    if (country.branchIdentifier) {
        const range = parseRange(country.branchIdentifier.position);
        if (range) {
            fields.push({
                id: "branch-identifier",
                label: "Branch identifier",
                position: country.branchIdentifier.position,
                value: bban.slice(range.start, range.end),
            });
            branchEnd = Math.max(branchEnd, range.end);
        }
    }
    const residueStart = branchEnd;
    if (residueStart < bban.length) {
        fields.push({
            id: "account-residue",
            label: "Account number / residue",
            position: `${residueStart + 1}-${bban.length}`,
            value: bban.slice(residueStart),
        });
    }
    return fields;
}
function parseRange(spec) {
    // Registry positions are 1-based inclusive ranges, e.g. "1-3" or "5-8".
    const match = spec.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match)
        return undefined;
    const start = Number(match[1]) - 1;
    const end = Number(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        return undefined;
    }
    return { start, end };
}
/**
 * Run every available check against the supplied IBAN-shaped input and
 * return an `AnalyzeResult`. Empty input returns `verdict: "empty"` with
 * no checks run.
 */
export function analyzeIban(input) {
    const normalized = normalizeIban(input);
    if (!normalized) {
        return {
            input,
            normalized: "",
            pretty: "",
            countryCode: "",
            checks: [],
            verdict: "empty",
        };
    }
    const pretty = prettyPrint(normalized);
    const { code, country } = detectCountry(normalized);
    const checks = [];
    if (!country) {
        checks.push(makeCheck("country", "Country code", "fail", code
            ? `Prefix “${code}” is not a registered IBAN country.`
            : "Could not read a 2-letter country code."));
    }
    else {
        checks.push(makeCheck("country", "Country code", "pass", `${country.countryCode} · ${country.countryName}`));
    }
    if (!country) {
        checks.push(makeCheck("length", "Length", "skip", "Country prefix not registered."), makeCheck("structure", "Structure", "skip", "Country prefix not registered."));
    }
    else if (normalized.length !== country.ibanLength) {
        checks.push(makeCheck("length", "Length", "fail", `${country.countryCode} IBANs are ${country.ibanLength} characters; this is ${normalized.length}.`), makeCheck("structure", "Structure", "skip", "Skipped because the length does not match."));
    }
    else {
        checks.push(makeCheck("length", "Length", "pass", `${normalized.length} characters as registered.`));
        const matches = matchMask(normalized, country.ibanStructure);
        checks.push(makeCheck("structure", "Structure", matches ? "pass" : "fail", matches
            ? `Matches the registry mask ${country.ibanStructure}.`
            : `Does not match the registry mask ${country.ibanStructure}.`));
    }
    const mod97Ok = validateMod97(normalized);
    checks.push(makeCheck("mod97", "ISO 13616 check digits", mod97Ok ? "pass" : "fail", mod97Ok
        ? "MOD-97 of the rearranged numeric form equals 1."
        : "MOD-97 of the rearranged numeric form is not 1."));
    const verdict = checks.every((c) => c.status === "pass")
        ? "valid"
        : "invalid";
    const result = {
        input,
        normalized,
        pretty,
        countryCode: code,
        checks,
        verdict,
    };
    if (country) {
        result.country = country;
        const bban = buildBban(country, normalized);
        if (bban && bban.length > 0)
            result.bban = bban;
    }
    return result;
}
