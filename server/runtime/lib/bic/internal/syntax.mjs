// Generated from src/lib/bic/internal/syntax.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure structural decomposition for ISO 9362 BICs and a small lookup against
 * the bundled demo-snapshot country set. Imports only the generated JSON via
 * a sibling registry export · no IO, no fetch.
 */
import generatedDataset from "../data/bic-snapshot.generated.json" with { type: "json" };
const DATASET = generatedDataset;
const SNAPSHOT_COUNTRY_CODES = new Set(DATASET.countryCodes);
/**
 * Decompose a normalized BIC into its institution / country / location /
 * branch components and the advisory flags read from the second
 * location-code character. Returns `undefined` for inputs too short to
 * decompose (i.e. shorter than 8 characters).
 */
export function decomposeBic(normalized) {
    if (normalized.length < 8)
        return undefined;
    const institutionCode = normalized.slice(0, 4);
    const countryCode = normalized.slice(4, 6);
    const locationCode = normalized.slice(6, 8);
    const branchCode = normalized.length >= 11 ? normalized.slice(8, 11) : "XXX";
    const locationFlag = locationCode.charAt(1);
    return {
        institutionCode,
        countryCode,
        locationCode,
        branchCode,
        isPrimaryOffice: branchCode === "XXX",
        isTestBic: locationFlag === "0",
        isPassive: locationFlag === "1",
        isReverseBilling: locationFlag === "2",
    };
}
/** Whether the supplied 2-letter country code appears in the bundled demo snapshot. */
export function isKnownSnapshotCountry(countryCode) {
    if (!countryCode || countryCode.length !== 2)
        return false;
    return SNAPSHOT_COUNTRY_CODES.has(countryCode.toUpperCase());
}
