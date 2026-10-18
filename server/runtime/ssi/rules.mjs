// Generated from plugins/payment-intelligence/server/src/ssi/rules.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * SSI validation rules, ported from SSI Control Tower's instruction catalogue
 * (app/services/ssi_validation_catalogue.py and instruction_validation.py) with the
 * same rule ids, severities and fixes, so findings line up across both products.
 *
 * Not ported: lineage, provider-conflict, entity-risk, licensing and export gates,
 * which need SSI Control Tower's database and provider feeds. The privacy rule that
 * rejects unmasked accounts is replaced by masking every account in the output.
 * Rules marked `origin: "plugin"` are additions that the catalogue does not have.
 */
import { isKnownSnapshotCountry } from "../lib/bic/internal/syntax.mjs";
import { ASSET_ALIASES, ASSET_CATEGORIES, CURRENCY_CODES, HOLDER_TYPES, PREFERRED_FLAGS, PREFERRED_TRUE, } from "./codes.mjs";
import { maskAccount, parseSsiDate } from "./parse.mjs";
const rule = (id, severity, message, fix, origin = "ssi-control-tower") => ({ id, severity, message, fix, origin });
export const SSI_RULES = Object.fromEntries([
    rule("ssi.owner_bic.required", "high", "Owner BIC is required.", "Populate the SSI owner BIC."),
    rule("ssi.owner_bic.format", "high", "Owner BIC is missing or malformed.", "Provide a valid 8 or 11 character BIC."),
    rule("ssi.owner_country.reference", "medium", "Owner country must use an ISO country code when present.", "Use a two-letter ISO 3166 country code."),
    rule("ssi.instrument.currency.required", "high", "Instruction currency is required.", "Populate the SSI currency code."),
    rule("ssi.instrument.currency.reference", "high", "Currency must be an active ISO 4217 code.", "Use a three-letter ISO 4217 currency code."),
    rule("ssi.instrument.asset.required", "high", "Instruction asset category is required.", "Populate the SSI asset category."),
    rule("ssi.instrument.asset.reference", "medium", "Asset category must be in the SSI Directory relationship code family.", "Use a supported asset category such as CASH, COPA, SECU, FOEX or TREA."),
    rule("ssi.account_holder_bic.required", "high", "Account-holder BIC is required.", "Populate the account-holding institution BIC."),
    rule("ssi.account_holder_bic.format", "high", "Account-holder BIC is missing or malformed.", "Provide a valid 8 or 11 character BIC."),
    rule("ssi.account_holder_country.reference", "medium", "Account-holder country must use an ISO country code when present.", "Use a two-letter ISO 3166 country code."),
    rule("ssi.account_holder.type.reference", "low", "Account-holder type must use an approved code when present.", "Use a known account-holder type code (B, C, BANK, CORRESPONDENT) or leave it blank."),
    rule("ssi.account.required", "critical", "Account number with the account-holding institution is required.", "Populate the account number from the counterparty's confirmed SSI."),
    rule("ssi.preference.flag.reference", "medium", "Preferred flag must use an approved value.", "Use Y/P for preferred or N/blank for non-preferred."),
    rule("ssi.lifecycle.active_start.required", "medium", "Active instruction requires a start date.", "Add an effective start date before activating the instruction."),
    rule("ssi.lifecycle.date_range", "high", "Instruction stop date must not be earlier than start date.", "Correct the instruction lifecycle dates."),
    rule("ssi.lifecycle.date_format", "medium", "A date could not be read.", "Use YYYYMMDD or YYYY-MM-DD.", "plugin"),
    rule("ssi.lifecycle.update_freshness", "low", "Update date is missing, so source freshness cannot be proven.", "Retain the source update date where available."),
    rule("ssi.lifecycle.traffic_freshness", "medium", "Traffic date is required when traffic flag indicates activity.", "Populate traffic date or correct traffic flag."),
    rule("SSI.STALE.12M", "high", "Last confirmation is older than 365 days.", "Reconfirm the SSI with the counterparty and record the evidence."),
    rule("ssi.conflict.preferred_unique", "high", "Only one active preferred instruction is allowed per operational group.", "Retain one preferred instruction and mark the others non-preferred."),
    rule("ssi.conflict.active_interval_overlap", "high", "Active instruction intervals overlap within the same operational group.", "Adjust lifecycle dates or close the superseded instruction."),
    rule("ssi.conflict.preferred_correspondent_unique", "high", "More than one account-holding institution is marked preferred for the same owner, currency and asset category, so payments cannot be routed unambiguously.", "Keep one preferred correspondent per owner, currency and asset category.", "plugin"),
].map((r) => [r.id, r]));
const BIC_RE = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
const INACTIVE_STATUSES = new Set([
    "inactive",
    "retired",
    "deleted",
    "expired",
    "closed",
    "cancelled",
    "rejected",
]);
export const normaliseBic = (v) => v.replace(/\s+/g, "").toUpperCase();
export const normaliseAsset = (v) => {
    const raw = v.trim();
    return ASSET_ALIASES[raw.toLowerCase()] ?? raw.toUpperCase();
};
export const isPreferred = (r) => PREFERRED_TRUE.has(r.preferredFlag.trim().toUpperCase());
const date = (v) => parseSsiDate(v) ?? undefined;
/** Not deleted, not retired, and not stopped before `asOf`. */
export function isActive(r, asOf) {
    if (r.modificationFlag.trim().toUpperCase() === "D")
        return false;
    if (INACTIVE_STATUSES.has(r.status.trim().toLowerCase()))
        return false;
    const stop = date(r.stopDate);
    return !stop || stop >= asOf;
}
/** Effective on `day`: active, started on or before it and not stopped before it. */
export function isEffectiveOn(r, day) {
    const start = date(r.startDate);
    return isActive(r, day) && (!start || start <= day);
}
function daysBetween(from, to) {
    return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}
export function validateRecords(records, columns, asOf) {
    const findings = [];
    const has = new Set(columns);
    const add = (r, ruleId, field, value) => {
        const def = SSI_RULES[ruleId];
        findings.push({
            rule_id: def.id,
            severity: def.severity,
            line: r.line,
            record_key: r.recordKey,
            field,
            ...(value !== undefined ? { value } : {}),
            message: def.message,
            fix: def.fix,
        });
    };
    for (const r of records) {
        const ownerBic = normaliseBic(r.ownerBic);
        if (!ownerBic)
            add(r, "ssi.owner_bic.required", "ownerBic");
        else if (!BIC_RE.test(ownerBic))
            add(r, "ssi.owner_bic.format", "ownerBic", r.ownerBic);
        if (r.ownerCountry && !isKnownSnapshotCountry(r.ownerCountry.trim().toUpperCase())) {
            add(r, "ssi.owner_country.reference", "ownerCountry", r.ownerCountry);
        }
        const ccy = r.currency.trim().toUpperCase();
        if (!ccy)
            add(r, "ssi.instrument.currency.required", "currency");
        else if (!CURRENCY_CODES.has(ccy))
            add(r, "ssi.instrument.currency.reference", "currency", r.currency);
        if (has.has("assetCategory")) {
            if (!r.assetCategory.trim())
                add(r, "ssi.instrument.asset.required", "assetCategory");
            else if (!ASSET_CATEGORIES[normaliseAsset(r.assetCategory)]) {
                add(r, "ssi.instrument.asset.reference", "assetCategory", r.assetCategory);
            }
        }
        if (has.has("accountHolderBic")) {
            const holder = normaliseBic(r.accountHolderBic);
            if (!holder)
                add(r, "ssi.account_holder_bic.required", "accountHolderBic");
            else if (!BIC_RE.test(holder))
                add(r, "ssi.account_holder_bic.format", "accountHolderBic", r.accountHolderBic);
        }
        if (r.accountHolderCountry &&
            !isKnownSnapshotCountry(r.accountHolderCountry.trim().toUpperCase())) {
            add(r, "ssi.account_holder_country.reference", "accountHolderCountry", r.accountHolderCountry);
        }
        if (!HOLDER_TYPES.has(r.holderType.trim().toUpperCase())) {
            add(r, "ssi.account_holder.type.reference", "holderType", r.holderType);
        }
        if (has.has("account") && !r.account.trim())
            add(r, "ssi.account.required", "account");
        if (!PREFERRED_FLAGS.has(r.preferredFlag.trim().toUpperCase())) {
            add(r, "ssi.preference.flag.reference", "preferredFlag", r.preferredFlag);
        }
        for (const field of [
            "startDate",
            "stopDate",
            "updateDate",
            "trafficDate",
            "lastConfirmed",
        ]) {
            if (parseSsiDate(r[field]) === null)
                add(r, "ssi.lifecycle.date_format", field, r[field]);
        }
        const start = date(r.startDate);
        const stop = date(r.stopDate);
        if (has.has("startDate") && isActive(r, asOf) && !start)
            add(r, "ssi.lifecycle.active_start.required", "startDate");
        if (start && stop && stop < start)
            add(r, "ssi.lifecycle.date_range", "stopDate", r.stopDate);
        if (has.has("updateDate") && !r.updateDate.trim())
            add(r, "ssi.lifecycle.update_freshness", "updateDate");
        if (r.trafficFlag.trim().toUpperCase() === "Y" && !r.trafficDate.trim()) {
            add(r, "ssi.lifecycle.traffic_freshness", "trafficDate");
        }
        const confirmed = date(r.lastConfirmed);
        if (confirmed && isActive(r, asOf) && daysBetween(confirmed, asOf) > 365) {
            add(r, "SSI.STALE.12M", "lastConfirmed", r.lastConfirmed);
        }
    }
    // Group rules over active records, as SSI Control Tower groups them: owner BIC +
    // currency + asset category + account-holder BIC. Exports that carry a legal-entity
    // or fund id and a market (SSI Control Tower's CSV) add those, as its duplicate rule does.
    const groups = new Map();
    const routes = new Map();
    for (const r of records) {
        if (!isActive(r, asOf))
            continue;
        const route = [
            normaliseBic(r.ownerBic),
            r.ownerId.trim().toUpperCase(),
            r.market.trim().toUpperCase(),
            r.currency.trim().toUpperCase(),
            normaliseAsset(r.assetCategory),
        ].join("|");
        const key = `${route}|${normaliseBic(r.accountHolderBic)}`;
        groups.set(key, [...(groups.get(key) ?? []), r]);
        routes.set(route, [...(routes.get(route) ?? []), r]);
    }
    for (const members of groups.values()) {
        const preferred = members.filter(isPreferred);
        if (preferred.length > 1)
            preferred.forEach((r) => add(r, "ssi.conflict.preferred_unique", "preferredFlag"));
        const overlapping = new Set();
        members.forEach((a, i) => members.slice(i + 1).forEach((b) => {
            const [aStart, bStart] = [date(a.startDate), date(b.startDate)];
            if (!aStart || !bStart)
                return;
            const [aStop, bStop] = [date(a.stopDate) ?? "9999-12-31", date(b.stopDate) ?? "9999-12-31"];
            if (aStart <= bStop && bStart <= aStop)
                overlapping.add(a).add(b);
        }));
        overlapping.forEach((r) => add(r, "ssi.conflict.active_interval_overlap", "startDate"));
    }
    for (const members of routes.values()) {
        const preferred = members.filter(isPreferred);
        const holders = new Set(preferred.map((r) => normaliseBic(r.accountHolderBic)));
        if (holders.size > 1)
            preferred.forEach((r) => add(r, "ssi.conflict.preferred_correspondent_unique", "accountHolderBic", r.accountHolderBic));
    }
    return findings;
}
/** A record as it may be shown: account masked, names kept (they are institutions). */
export function safeRecord(r) {
    return {
        line: r.line,
        record_key: r.recordKey,
        owner_bic: normaliseBic(r.ownerBic),
        owner_name: r.ownerName || undefined,
        currency: r.currency.trim().toUpperCase(),
        asset_category: normaliseAsset(r.assetCategory) || undefined,
        account_holder_bic: normaliseBic(r.accountHolderBic) || undefined,
        account_holder_name: r.accountHolderName || undefined,
        account: maskAccount(r.account) || undefined,
        preferred: isPreferred(r),
        start_date: date(r.startDate),
        stop_date: date(r.stopDate),
    };
}
