// Generated from src/lib/iban/registry.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Read-only access to the curated IBAN registry. The dataset and meta are
 * imported from build-generated JSON committed to the repo · there is no
 * runtime fetch, no remote call, and no live BIC, SEPA-reachability, or
 * bank-directory enrichment. Each module run uses the dataset baked into
 * the bundle when the user loaded the page.
 */
import generatedDataset from "./data/iban-registry.generated.json" with { type: "json" };
import generatedMeta from "./data/iban-registry.generated.json.meta.json" with { type: "json" };
const DATASET = generatedDataset;
const META = generatedMeta;
/** Look up a country entry by ISO 3166 alpha-2 code. Returns undefined if absent. */
export function getCountry(code) {
    if (!code || code.length !== 2)
        return undefined;
    return DATASET.countries[code.toUpperCase()];
}
/** Sorted list of all registered countries. */
export function listCountries() {
    return Object.values(DATASET.countries)
        .slice()
        .sort((a, b) => {
        return a.countryCode.localeCompare(b.countryCode);
    });
}
/** Snapshot of the bundled registry meta. */
export function getRegistryMeta() {
    return META;
}
