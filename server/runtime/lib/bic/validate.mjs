// Generated from src/lib/bic/validate.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure runtime BIC validator. Combines ISO 9362 structural rules with a
 * lookup against the bundled demo snapshot to produce a structured analysis
 * the UI can render directly.
 *
 * Snapshot membership is deliberately informational: a syntactically valid
 * BIC that is absent from the bundled subset is still reported as
 * `BIC-shape valid` · the snapshot is for demonstration only and is not
 * authoritative bank-directory data.
 *
 * No fetch, storage, telemetry, or live enrichment · every fact comes from
 * the bundled generated JSON or a synchronous string operation.
 */
import { expandToBic11, normalizeBic, prettyBic } from "./internal/normalize.mjs";
import { decomposeBic, isKnownSnapshotCountry } from "./internal/syntax.mjs";
import { getBicSnapshotEntry } from "./registry.mjs";
const RE_INSTITUTION = /^[A-Z]{4}$/;
const RE_LOCATION = /^[A-Z0-9]{2}$/;
const RE_BRANCH = /^[A-Z0-9]{3}$/;
const RE_COUNTRY = /^[A-Z]{2}$/;
function check(id, label, status, detail) {
    return { id, label, status, detail };
}
/**
 * Run the available checks against the supplied BIC-shaped input and return
 * a `BicAnalyzeResult`. Empty input returns `verdict: "empty"` with no checks
 * run.
 */
export function analyzeBic(input) {
    const normalized = normalizeBic(input);
    if (!normalized) {
        return {
            input,
            normalized: "",
            expanded: "",
            pretty: "",
            checks: [],
            verdict: "empty",
        };
    }
    const expanded = expandToBic11(normalized);
    const pretty = prettyBic(normalized);
    const lengthOk = normalized.length === 8 || normalized.length === 11;
    const checks = [];
    checks.push(check("length", "Length", lengthOk ? "pass" : "fail", lengthOk
        ? `${normalized.length} characters · ${normalized.length === 8 ? "BIC8 (expanded to BIC11 with XXX)" : "BIC11"}.`
        : `BICs must be 8 or 11 characters; this is ${normalized.length}.`));
    if (!lengthOk) {
        checks.push(check("institution", "Institution code", "skip", "Skipped because the length is invalid."), check("country", "Country code", "skip", "Skipped because the length is invalid."), check("location", "Location code", "skip", "Skipped because the length is invalid."), check("branch", "Branch code", "skip", "Skipped because the length is invalid."), check("snapshot", "Demo snapshot", "skip", "Skipped because the length is invalid."));
        return {
            input,
            normalized,
            expanded,
            pretty,
            checks,
            verdict: "invalid",
        };
    }
    const components = decomposeBic(expanded);
    const institutionCode = expanded.slice(0, 4);
    const countryCode = expanded.slice(4, 6);
    const locationCode = expanded.slice(6, 8);
    const branchCode = expanded.slice(8, 11);
    const institutionOk = RE_INSTITUTION.test(institutionCode);
    checks.push(check("institution", "Institution code", institutionOk ? "pass" : "fail", institutionOk
        ? `Four-letter institution code “${institutionCode}”.`
        : `Institution code must be four letters; got “${institutionCode}”.`));
    const countryShape = RE_COUNTRY.test(countryCode);
    const countryKnown = countryShape && isKnownSnapshotCountry(countryCode);
    checks.push(check("country", "Country code", countryKnown ? "pass" : "fail", countryKnown
        ? `${countryCode} is a recognised ISO 3166 country code.`
        : countryShape
            ? `${countryCode} is not a recognised ISO 3166 country code.`
            : `Country code must be two letters; got “${countryCode}”.`));
    const locationOk = RE_LOCATION.test(locationCode);
    checks.push(check("location", "Location code", locationOk ? "pass" : "fail", locationOk
        ? `Two-character location code “${locationCode}”.`
        : `Location code must be two alphanumeric characters; got “${locationCode}”.`));
    const branchOk = RE_BRANCH.test(branchCode);
    checks.push(check("branch", "Branch code", branchOk ? "pass" : "fail", branchOk
        ? branchCode === "XXX"
            ? "Primary office (branch code XXX)."
            : `Branch code “${branchCode}”.`
        : `Branch code must be three alphanumeric characters; got “${branchCode}”.`));
    const snapshotEntry = getBicSnapshotEntry(expanded);
    if (snapshotEntry) {
        checks.push(check("snapshot", "Demo snapshot", "pass", "Matched a bundled demo entry · see the breakdown below."));
    }
    else {
        checks.push(check("snapshot", "Demo snapshot", "skip", "Not present in the bundled demo snapshot · absence does not mean the BIC is invalid."));
    }
    const syntaxStatuses = checks.filter((c) => c.id !== "snapshot").map((c) => c.status);
    const verdict = syntaxStatuses.every((s) => s === "pass")
        ? "valid"
        : "invalid";
    const result = {
        input,
        normalized,
        expanded,
        pretty,
        checks,
        verdict,
    };
    if (components)
        result.components = components;
    if (snapshotEntry)
        result.snapshotEntry = snapshotEntry;
    return result;
}
