// Generated from src/lib/cbpr/manifest.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import generatedManifest from "./data/cbprplus-schemas.generated.json" with { type: "json" };
import generatedManifestMeta from "./data/cbprplus-schemas.generated.json.meta.json" with { type: "json" };
const MANIFEST = generatedManifest;
const META = generatedManifestMeta;
const MESSAGE_ID_RE = /\b(?:admi|camt|pacs|pain)\.\d{3}\.\d{3}\.\d{2}\b/;
const PROFILES_BY_MESSAGE_ID = new Map();
for (const profile of MANIFEST.schemaProfiles) {
    const list = PROFILES_BY_MESSAGE_ID.get(profile.messageId) ?? [];
    list.push(profile);
    PROFILES_BY_MESSAGE_ID.set(profile.messageId, list);
}
/** Return every schema profile in deterministic manifest order. */
export function listCbprSchemaProfiles() {
    return MANIFEST.schemaProfiles;
}
/** Return deterministic manifest provenance metadata. */
export function getCbprSchemaManifestMeta() {
    return META;
}
/** Return the sorted unique CBPR+ message ids covered by the bundled manifest. */
export function listCbprMessageIds() {
    return META.supportedMessageIds;
}
/** Return all schema-profile variants for a message id, preserving variants such as STP/COV/ADV. */
export function findCbprSchemaProfiles(messageId) {
    return PROFILES_BY_MESSAGE_ID.get(messageId) ?? [];
}
/** Whether the bundled SR2025 manifest has at least one schema profile for this message id. */
export function isCbprMessageIdSupported(messageId) {
    return PROFILES_BY_MESSAGE_ID.has(messageId);
}
/** Extract an ISO 20022 message id from a namespace or free-text message-definition value. */
export function extractMessageId(value) {
    if (!value)
        return undefined;
    const match = value.match(MESSAGE_ID_RE);
    return match?.[0];
}
