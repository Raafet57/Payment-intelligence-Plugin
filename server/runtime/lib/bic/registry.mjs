// Generated from src/lib/bic/registry.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Read-only access to the bundled BIC demo snapshot. Both the dataset and
 * meta are imported from build-generated JSON committed to the repo · there
 * is no runtime fetch and no live bank-directory enrichment. The bundled
 * subset is intentionally small and is for demonstration only; it is not
 * authoritative bank-directory data.
 */
import generatedDataset from "./data/bic-snapshot.generated.json" with { type: "json" };
import generatedMeta from "./data/bic-snapshot.generated.json.meta.json" with { type: "json" };
const DATASET = generatedDataset;
const META = generatedMeta;
const ENTRIES_BY_BIC = new Map(DATASET.entries.map((entry) => [entry.bic, entry]));
/** Look up a bundled demo entry by BIC11 (case-insensitive). */
export function getBicSnapshotEntry(bic) {
    if (!bic)
        return undefined;
    return ENTRIES_BY_BIC.get(bic.toUpperCase());
}
/** Sorted list of all bundled demo entries. */
export function listBicSamples() {
    return DATASET.entries.slice().sort((a, b) => a.bic.localeCompare(b.bic));
}
/** Snapshot of the bundled demo meta. */
export function getBicSnapshotMeta() {
    return META;
}
