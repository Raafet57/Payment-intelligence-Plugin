// Generated from src/lib/iso20022/scrub.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { detectMessageKind } from "./detect.mjs";
import { buildPath, getChildrenByLocalName, getFirstChildByLocalName, getLocalName, parseXml, serialize, setTextContent, walkElements, } from "./dom.mjs";
import { accountPseudonym, addressLeafPseudonym, contactPseudonym, fallbackAccountPseudonym, fiOtherIdPseudonym, ibanPseudonym, maskOriginal, msgIdPseudonym, namePseudonym, orgIdPseudonym, prvtIdPseudonym, referencePseudonym, remittancePseudonym, uetrPseudonym, } from "./pseudonym.mjs";
import { isValidIban } from "./iban.mjs";
import { ADDRESS_COUNTRY_LEAF, APPROVED_DATE_PARENT_WRAPPERS, classifyOthrId, classifyLeaf, DATE_WRAPPERS, isRemittanceText, } from "./rules.mjs";
const MASK_TYPES = [
    "name",
    "address",
    "iban",
    "account",
    "orgId",
    "prvtId",
    "fiOtherId",
    "reference",
    "uetr",
    "msgId",
    "remittance",
    "contact",
    "date",
];
export const DEFAULT_OPTIONS = Object.freeze({
    consistency: true,
    preserveRemittance: false,
    shiftDates: false,
    dateOffsetDays: 0,
    maskFiOtherIds: false,
});
export class ScrubInputError extends Error {
    detail;
    constructor(error) {
        super(error.message);
        this.name = "ScrubInputError";
        this.detail = error.detail;
    }
}
export function scrub(input, options = {}) {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    const parsed = parseXml(input);
    if (!parsed.ok) {
        throw new ScrubInputError(parsed.error);
    }
    const ctx = {
        options: merged,
        mapping: [],
        stats: createEmptyStats(),
        cache: new Map(),
        uniqueOriginals: new Map(MASK_TYPES.map((t) => [t, new Set()])),
    };
    const kind = detectMessageKind(parsed.doc);
    const root = parsed.doc.documentElement;
    // First pass: handle leaf-level rules (names, refs, ids, contacts, dates).
    walkElements(root, (el, ancestors) => {
        applyLeafRules(el, ancestors, ctx);
    });
    // Second pass: address leaves are handled in the leaf pass too, but we need a final
    // sweep for date wrappers that contain only formatted text content (e.g. <BookgDt><Dt>...).
    // Already covered by leaf logic; nothing extra needed.
    return {
        kind,
        output: serialize(parsed.doc),
        mapping: ctx.mapping,
        stats: ctx.stats,
    };
}
function applyLeafRules(el, ancestors, ctx) {
    const localName = getLocalName(el);
    // Date / dateTime shift (path-aware).
    if (ctx.options.shiftDates && ctx.options.dateOffsetDays !== 0 && isDateLeaf(el, ancestors)) {
        handleDateLeaf(el, ancestors, ctx);
        return;
    }
    // Othr/Id classification (account vs orgId vs prvtId vs fiOtherId).
    const othrRole = classifyOthrId(ancestors, localName);
    if (othrRole) {
        if (othrRole === "fiOtherId" && !ctx.options.maskFiOtherIds)
            return;
        handleOthrId(el, ancestors, ctx, othrRole);
        return;
    }
    // FI member id under FinInstnId/ClrSysMmbId/MmbId · only when toggle is on.
    if (localName === "MmbId" &&
        ancestors.includes("ClrSysMmbId") &&
        ancestors.includes("FinInstnId")) {
        if (!ctx.options.maskFiOtherIds)
            return;
        handleSimpleLeaf(el, ancestors, ctx, "fiOtherId", localName, fiOtherIdPseudonym);
        return;
    }
    // Remittance and free text: optional preservation toggle.
    if (isRemittanceText(ancestors, localName)) {
        if (ctx.options.preserveRemittance)
            return;
        handleSimpleLeaf(el, ancestors, ctx, "remittance", localName, (n) => remittancePseudonym(n));
        return;
    }
    // Generic classifier covers names, addresses, msgIds, refs, UETR, IBAN, contacts.
    const classified = classifyLeaf(ancestors, localName);
    if (!classified)
        return;
    switch (classified.type) {
        case "name":
            handleSimpleLeaf(el, ancestors, ctx, "name", localName, (n) => namePseudonym(n));
            return;
        case "address":
            handleAddressLeaf(el, ancestors, ctx, classified.hint ?? localName);
            return;
        case "iban":
            handleIban(el, ancestors, ctx);
            return;
        case "uetr":
            handleSimpleLeaf(el, ancestors, ctx, "uetr", localName, uetrPseudonym);
            return;
        case "msgId":
            handleSimpleLeaf(el, ancestors, ctx, "msgId", localName, (n) => msgIdPseudonym(localName, n));
            return;
        case "reference":
            handleSimpleLeaf(el, ancestors, ctx, "reference", localName, (n) => referencePseudonym(classified.hint ?? localName, n));
            return;
        case "contact":
            handleSimpleLeaf(el, ancestors, ctx, "contact", localName, (n) => contactPseudonym(classified.hint ?? localName, n));
            return;
        default:
            return;
    }
}
function handleSimpleLeaf(el, ancestors, ctx, type, tag, generator) {
    const original = textOf(el);
    if (!original)
        return;
    const replacement = pseudonymFor(ctx, type, original, generator);
    if (replacement === original)
        return;
    setTextContent(el, replacement);
    recordMapping(ctx, type, tag, original, replacement, buildPath(ancestors, el));
}
function handleAddressLeaf(el, ancestors, ctx, leafName) {
    // Skip the country code leaf so we keep ISO country fidelity.
    if (leafName === ADDRESS_COUNTRY_LEAF)
        return;
    const original = textOf(el);
    if (!original)
        return;
    const replacement = pseudonymFor(ctx, "address", original, (n) => addressLeafPseudonym(leafName, n));
    if (replacement === original)
        return;
    setTextContent(el, replacement);
    recordMapping(ctx, "address", leafName, original, replacement, buildPath(ancestors, el));
}
function handleIban(el, ancestors, ctx) {
    const original = textOf(el);
    if (!original)
        return;
    const cleaned = original.replace(/\s+/g, "").toUpperCase();
    const country = isValidIban(cleaned) ? cleaned.slice(0, 2) : null;
    const replacement = pseudonymFor(ctx, "iban", original, (n) => ibanPseudonym(n, country));
    if (replacement === original)
        return;
    setTextContent(el, replacement);
    recordMapping(ctx, "iban", "IBAN", original, replacement, buildPath(ancestors, el));
}
function handleOthrId(el, ancestors, ctx, role) {
    const original = textOf(el);
    if (!original)
        return;
    const generator = pickOthrGenerator(role);
    const replacement = pseudonymFor(ctx, role, original, generator);
    if (replacement === original)
        return;
    setTextContent(el, replacement);
    recordMapping(ctx, role, role === "account" ? "AcctId.Othr.Id" : `${role}.Othr.Id`, original, replacement, buildPath(ancestors, el));
}
function pickOthrGenerator(role) {
    switch (role) {
        case "account":
            return (n) => {
                const candidate = accountPseudonym(n);
                return candidate.length > 0 ? candidate : fallbackAccountPseudonym(n);
            };
        case "orgId":
            return (n) => orgIdPseudonym(n);
        case "prvtId":
            return (n) => prvtIdPseudonym(n);
        case "fiOtherId":
            return (n) => fiOtherIdPseudonym(n);
    }
}
function isDateLeaf(el, ancestors) {
    const localName = getLocalName(el);
    // <CreDtTm>, <IntrBkSttlmDt>, <ReqdExctnDt>, etc. · leaves whose own name is a known wrapper
    // *and* contain ISO date/time text directly.
    if (DATE_WRAPPERS.has(localName) && hasDirectIsoText(el)) {
        return true;
    }
    // Generic <Dt> or <DtTm> nested under an approved date parent wrapper.
    if ((localName === "Dt" || localName === "DtTm") && parentInApproved(ancestors)) {
        return true;
    }
    return false;
}
function parentInApproved(ancestors) {
    const parent = ancestors[ancestors.length - 1];
    return parent !== undefined && APPROVED_DATE_PARENT_WRAPPERS.has(parent);
}
function hasDirectIsoText(el) {
    // Ignore wrappers that contain element children (e.g. <BookgDt><Dt>...</Dt></BookgDt>).
    if (el.children.length > 0)
        return false;
    const text = textOf(el);
    return ISO_DATE_REGEX.test(text);
}
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
function handleDateLeaf(el, ancestors, ctx) {
    const original = textOf(el);
    if (!original)
        return;
    const shifted = shiftIsoDate(original, ctx.options.dateOffsetDays);
    if (shifted === original)
        return;
    setTextContent(el, shifted);
    recordMapping(ctx, "date", getLocalName(el), original, shifted, buildPath(ancestors, el));
}
function shiftIsoDate(value, offsetDays) {
    if (!ISO_DATE_REGEX.test(value))
        return value;
    const datePart = value.slice(0, 10);
    const shifted = addDays(datePart, offsetDays);
    if (shifted === null)
        return value;
    return `${shifted}${value.slice(10)}`;
}
/**
 * Pure calendar-arithmetic add-days. Avoids any Date/UTC machinery so the result is
 * unaffected by host time zone, DST, or epoch range. Returns null if the input
 * date is structurally invalid (e.g. month=13).
 */
export function addDays(yyyyMmDd, offset) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
    if (!m)
        return null;
    let year = Number(m[1]);
    let month = Number(m[2]);
    let day = Number(m[3]);
    if (month < 1 || month > 12)
        return null;
    if (day < 1 || day > daysInMonth(year, month))
        return null;
    let remaining = offset;
    while (remaining > 0) {
        const dim = daysInMonth(year, month);
        if (day + remaining <= dim) {
            day += remaining;
            remaining = 0;
        }
        else {
            remaining -= dim - day + 1;
            day = 1;
            month += 1;
            if (month === 13) {
                month = 1;
                year += 1;
            }
        }
    }
    while (remaining < 0) {
        if (day + remaining >= 1) {
            day += remaining;
            remaining = 0;
        }
        else {
            remaining += day;
            month -= 1;
            if (month === 0) {
                month = 12;
                year -= 1;
            }
            day = daysInMonth(year, month);
        }
    }
    return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}
function daysInMonth(year, month) {
    if (month === 2)
        return isLeap(year) ? 29 : 28;
    if (month === 4 || month === 6 || month === 9 || month === 11)
        return 30;
    return 31;
}
function isLeap(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
function pad(value, width) {
    return String(value).padStart(width, "0");
}
function pseudonymFor(ctx, type, original, generator) {
    if (ctx.options.consistency) {
        const key = `${type}::${original}`;
        const existing = ctx.cache.get(key);
        if (existing !== undefined)
            return existing;
        const counter = nextCounter(ctx, type);
        const value = generator(counter);
        ctx.cache.set(key, value);
        return value;
    }
    // Non-consistency: each occurrence gets its own pseudonym based on a fresh counter.
    const counter = nextCounter(ctx, type);
    return generator(counter);
}
function nextCounter(ctx, type) {
    // Counter equals the next occurrence number (1-based).
    return ctx.stats[type].occurrences + 1;
}
function recordMapping(ctx, type, tag, original, replacement, path) {
    ctx.stats[type].occurrences += 1;
    const seen = ctx.uniqueOriginals.get(type);
    if (!seen.has(original)) {
        seen.add(original);
        ctx.stats[type].unique += 1;
    }
    ctx.mapping.push({
        type,
        tag,
        path,
        originalMasked: maskOriginal(original),
        replacement,
    });
}
function textOf(el) {
    return (el.textContent ?? "").trim();
}
function createEmptyStats() {
    const out = {};
    for (const t of MASK_TYPES) {
        out[t] = { unique: 0, occurrences: 0 };
    }
    return out;
}
// Re-exported for callers that want to inspect helpers in isolation.
export { getChildrenByLocalName, getFirstChildByLocalName };
