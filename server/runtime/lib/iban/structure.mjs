// Generated from src/lib/iban/structure.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure derivation of a country's BBAN field template from the bundled
 * IBAN registry entry. The template is the input shape the builder UI
 * needs: a list of fixed-length, single-charset fields with stable IDs
 * and example slices taken from the country's bundled example IBAN.
 *
 * Reads only `bbanStructure`, `bankIdentifier.position`,
 * `branchIdentifier.position`, and `exampleIbanElectronic` from the
 * bundled registry. No fetch, no enrichment, no live BIC or
 * SEPA-reachability lookup · every fact comes from the generated JSON
 * baked into the bundle.
 */
import { parseMask } from "./internal/mask.mjs";
function parseRange(spec) {
    if (!spec)
        return undefined;
    const m = spec.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m)
        return undefined;
    const start = Number(m[1]) - 1;
    const end = Number(m[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        return undefined;
    }
    return { start, end };
}
function labelFor(kind, partIdx) {
    const base = kind === "bank-identifier"
        ? "Bank identifier"
        : kind === "branch-identifier"
            ? "Branch identifier"
            : kind === "account-residue"
                ? "Account number / residue"
                : "Other";
    return partIdx ? `${base} (part ${partIdx})` : base;
}
/**
 * Derive the builder field template for a country.
 *
 * Walks the BBAN positions and groups them into runs that share a single
 * charset *and* a single field kind. Bank/branch ranges from the registry
 * win their positions; everything before the bank/branch range is
 * labelled "other" (typically a national check character), everything
 * after is "account-residue".
 */
export function getBbanTemplate(country) {
    const segments = parseMask(country.bbanStructure);
    for (const seg of segments) {
        if (seg.kind === "literal") {
            throw new Error(`getBbanTemplate: BBAN structure for ${country.countryCode} unexpectedly contains literal "${seg.literal}"`);
        }
    }
    const bank = parseRange(country.bankIdentifier?.position);
    const branch = parseRange(country.branchIdentifier?.position);
    const totalLength = country.bbanLength;
    const exampleBban = country.exampleIbanElectronic.length === country.ibanLength
        ? country.exampleIbanElectronic.slice(4)
        : "";
    const segmentAt = (pos) => {
        for (const s of segments) {
            if (pos >= s.start && pos < s.start + s.length)
                return s;
        }
        return undefined;
    };
    const kindAt = (pos) => {
        if (bank && pos >= bank.start && pos < bank.end)
            return "bank-identifier";
        if (branch && pos >= branch.start && pos < branch.end)
            return "branch-identifier";
        const afterBank = !bank || pos >= bank.end;
        const afterBranch = !branch || pos >= branch.end;
        if (afterBank && afterBranch)
            return "account-residue";
        return "other";
    };
    const runs = [];
    let cursor = 0;
    while (cursor < totalLength) {
        const seg = segmentAt(cursor);
        if (!seg || seg.kind !== "class") {
            throw new Error(`getBbanTemplate: position ${cursor} not covered by a class mask segment for ${country.countryCode}`);
        }
        const kind = kindAt(cursor);
        const charClass = seg.charClass;
        let len = 1;
        while (cursor + len < totalLength) {
            const next = segmentAt(cursor + len);
            if (!next || next.kind !== "class")
                break;
            if (kindAt(cursor + len) !== kind)
                break;
            if (next.charClass !== charClass)
                break;
            len++;
        }
        runs.push({ start: cursor, length: len, kind, charClass });
        cursor += len;
    }
    const totalsByKind = new Map();
    for (const r of runs)
        totalsByKind.set(r.kind, (totalsByKind.get(r.kind) ?? 0) + 1);
    const seenByKind = new Map();
    const fields = runs.map((r) => {
        const total = totalsByKind.get(r.kind) ?? 1;
        const seen = (seenByKind.get(r.kind) ?? 0) + 1;
        seenByKind.set(r.kind, seen);
        const idSuffix = total > 1 ? `-${seen}` : "";
        const id = `${r.kind}${idSuffix}`;
        const label = labelFor(r.kind, total > 1 ? seen : undefined);
        const positionStr = `${r.start + 1}-${r.start + r.length}`;
        const example = exampleBban.length >= r.start + r.length
            ? exampleBban.slice(r.start, r.start + r.length)
            : "";
        return {
            id,
            kind: r.kind,
            label,
            position: positionStr,
            start: r.start,
            length: r.length,
            charClass: r.charClass,
            example,
        };
    });
    return {
        countryCode: country.countryCode,
        countryName: country.countryName,
        bbanLength: country.bbanLength,
        bbanStructure: country.bbanStructure,
        ibanLength: country.ibanLength,
        fields,
    };
}
/** Test a single character against a SWIFT charset class. */
export function charsetMatchesChar(ch, charClass) {
    if (charClass === "n")
        return ch >= "0" && ch <= "9";
    if (charClass === "a")
        return ch >= "A" && ch <= "Z";
    if (charClass === "c")
        return (ch >= "0" && ch <= "9") || (ch >= "A" && ch <= "Z");
    return ch === " ";
}
/** Test that every character in `value` belongs to the charset class. */
export function charsetMatches(value, charClass) {
    for (let i = 0; i < value.length; i++) {
        if (!charsetMatchesChar(value[i], charClass))
            return false;
    }
    return true;
}
/** Human-readable description of a charset class for builder error messages. */
export function describeCharClass(charClass) {
    if (charClass === "n")
        return "digits 0-9";
    if (charClass === "a")
        return "uppercase letters A-Z";
    if (charClass === "c")
        return "digits or uppercase letters";
    return "spaces";
}
