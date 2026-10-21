// Generated from plugins/payment-intelligence/server/src/reference/lookup.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Looks identifiers (BIC8/BIC11, national clearing codes, LEIs) up in the user's own
 * reference files: a SWIFTRef download folder (BIC Directory, Payments Directory) or a
 * CSV/TSV export from any provider or in-house system.
 *
 * Only records that match a requested identifier are returned, capped per identifier.
 * The tools never list or copy a whole file, and account numbers are masked.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { detectDelimiter, maskAccount, parseDelimited } from "../ssi/parse.mjs";
import { firstLine, forEachLine } from "./lines.mjs";
import { builtInLayouts, filePrefix, isDeltaFile, isSwiftRefHeader, loadStructures, readSwiftRef, } from "./swiftref.mjs";
export class ReferenceInputError extends Error {
}
/** SWIFTRef file prefixes the lookup reads; the rest (CODES, CALENDARS, ...) are not identifier data. */
const LOOKUP_PREFIXES = new Set(["IDENTIFIERS", "PARTICIPANTS", "RELATIONSHIPS"]);
/** Upper bound for a CSV/TSV reference export, which is read whole. */
export const MAX_CSV_BYTES = 200_000_000;
export const MAX_IDS = 50;
const MAX_HITS = 20;
const BIC_RE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const norm = (v) => v.replace(/[\s-]/g, "").toUpperCase();
/** Equivalent spellings of one identifier: a BIC8 also matches its primary-office BIC11. */
function variants(query) {
    const q = norm(query);
    const out = new Set([q]);
    if (BIC_RE.test(q) && q.length === 8)
        out.add(`${q}XXX`);
    if (BIC_RE.test(q) && q.length === 11 && q.endsWith("XXX"))
        out.add(q.slice(0, 8));
    return out;
}
const effective = (start, stop, asOf) => (!start || start.slice(0, 10) <= asOf) && (!stop || stop.slice(0, 10) > asOf);
/** Lists the files a path stands for, with layouts from any STRUCTURES file beside them. */
export function resolveSources(target) {
    const resolved = path.resolve(target);
    if (!existsSync(resolved))
        throw new ReferenceInputError(`Path not found: ${target}`);
    const notes = [];
    const isDir = statSync(resolved).isDirectory();
    const dir = isDir ? resolved : path.dirname(resolved);
    const siblings = readdirSync(dir);
    const layouts = builtInLayouts();
    for (const name of siblings.filter((n) => /^STRUCTURES-.*\.txt$/i.test(n)).sort()) {
        loadStructures(path.join(dir, name), layouts);
    }
    let files;
    if (isDir) {
        files = siblings
            .filter((n) => {
            if (supersededDelta(n, siblings))
                return false;
            if (/\.(csv|tsv)$/i.test(n))
                return true;
            if (!/\.txt$/i.test(n) || NOT_IDENTIFIER_FILE.test(n))
                return false;
            const full = path.join(dir, n);
            // SWIFTRef V1 files: only the identifier-bearing families. Other .txt: legacy SWIFTRef
            // products or provider exports, kept when their header has an identifier column.
            if (isSwiftRefHeader(firstLine(full)))
                return LOOKUP_PREFIXES.has(filePrefix(n));
            if (/^SSIPLUS/i.test(n))
                return false;
            try {
                tabularColumns(firstLine(full).split(detectDelimiter(firstLine(full))), full);
                return true;
            }
            catch {
                return false;
            }
        })
            .sort()
            .map((n) => path.join(dir, n));
        if (siblings.some((n) => /\.zip$/i.test(n))) {
            notes.push("Zip files in the folder were skipped. Unzip the SWIFTRef download first.");
        }
        if (files.length === 0) {
            throw new ReferenceInputError(`No reference files found in ${target}. Point at an unzipped SWIFTRef download (IDENTIFIERS-*, PARTICIPANTS-*, RELATIONSHIPS-* .txt files) or a CSV/TSV export.`);
        }
    }
    else {
        if (/\.zip$/i.test(resolved)) {
            throw new ReferenceInputError("This is a zip file. Unzip the SWIFTRef download and point at the folder or a .txt file inside it.");
        }
        if (/\.xlsx?$/i.test(resolved)) {
            throw new ReferenceInputError("This looks like an Excel workbook. Save the sheet as CSV (or tab-delimited text) and point the tool at that file.");
        }
        files = [resolved];
    }
    return { files, layouts, notes };
}
/** Header aliases for CSV/TSV identifier exports from any provider. */
export const IDENTIFIER_ALIASES = {
    /** Every matching column is searched, so a file with both BIC and national ID columns works. */
    id: [
        "bic",
        "bic11",
        "bic8",
        "bic code",
        "swift code",
        "swift bic",
        "swift",
        "id",
        "identifier",
        "national id",
        "iban national id",
        "national clearing code",
        "clearing code",
        "routing number",
        "aba",
        "aba routing number",
        "sort code",
        "bank code",
        "ifsc",
        "chips uid",
        "lei",
        "iso lei code",
    ],
    idType: ["id type", "identifier type", "code type"],
    name: [
        "institution name",
        "bank name",
        "name",
        "legal name",
        "entity name",
        "participant name",
        "service name",
    ],
    town: ["town name", "town", "city", "city heading", "op city", "re city"],
    country: ["iso country code", "country code", "iban iso country code", "country"],
    status: ["record status", "institution status", "status"],
    modification: ["modification flag", "modification type"],
    start: [
        "start date",
        "valid from",
        "effective date",
        "effective from",
        "adherence start date",
        "activation date",
    ],
    stop: ["stop date", "valid to", "expiry date", "effective to", "adherence stop date"],
    successor: ["successor id", "successor bic", "successor", "new bic"],
    linkedBic: ["iban bic", "fin(plus) bic", "routing bic", "connected bic"],
    /** Service-participation files (SWIFTRef Reach Plus, gpi, SEPA routing, or any provider's). */
    service: ["service id", "scheme", "service"],
    participant: ["participant id", "adherence bic"],
    reach: ["reachability", "direct indirect", "participation type"],
};
function collectorFor(query) {
    return {
        keys: variants(query),
        result: {
            query,
            found: false,
            identifiers: [],
            linked_identifiers: [],
            participations: [],
            relationships: { as_account_owner: 0, as_account_holder: 0, other: 0, examples: [] },
            truncated: false,
        },
    };
}
function push(c, list, item) {
    c.result.found = true;
    if (list.length < MAX_HITS)
        list.push(item);
    else
        c.result.truncated = true;
}
function matches(c, value) {
    return !!value && c.keys.has(norm(value));
}
function identifierHit(r, source, asOf, historical) {
    const f = r.fields;
    return {
        source,
        line: r.line,
        id: f["ID"] ?? "",
        id_type: f["ID TYPE"] ?? "",
        name: f["NAME"] ?? "",
        town: f["TOWN NAME"] ?? "",
        country_code: f["COUNTRY CODE"] ?? "",
        entity_type: f["ENTITY TYPE"],
        swift_type: f["SWIFT TYPE"],
        payment_area_codes: f["PAYMENT AREA CODES"],
        successor_id: f["SUCCESSOR ID"],
        linked_bic: f["IBAN BIC"] ?? f["FIN(PLUS) BIC"],
        record_status: r.recordStatus,
        start_date: r.startDate,
        stop_date: r.stopDate,
        historical,
        current: !historical &&
            r.modificationType.toUpperCase() !== "D" &&
            r.recordStatus.toUpperCase() !== "O" &&
            effective(r.startDate, r.stopDate, asOf),
    };
}
function scanSwiftRef(file, layouts, collectors, asOf, notes) {
    const source = path.basename(file);
    const historical = /^IDENTIFIERS-HIST/i.test(source);
    const needles = [...new Set(collectors.flatMap((c) => [...c.keys]))];
    const summary = readSwiftRef(file, layouts, (r) => {
        const f = r.fields;
        for (const c of collectors) {
            if (r.prefix === "IDENTIFIERS") {
                if (matches(c, f["ID"]))
                    push(c, c.result.identifiers, identifierHit(r, source, asOf, historical));
                else if (matches(c, f["IBAN BIC"]) || matches(c, f["FIN(PLUS) BIC"]))
                    push(c, c.result.linked_identifiers, identifierHit(r, source, asOf, historical));
            }
            else if (r.prefix === "PARTICIPANTS") {
                if (matches(c, f["PARTICIPANT ID"]) || matches(c, f["BIC"])) {
                    push(c, c.result.participations, {
                        source,
                        line: r.line,
                        structure: r.structure,
                        service_id: f["SERVICE ID"] ?? "",
                        participant_id: f["PARTICIPANT ID"] ?? "",
                        participant_id_type: f["PARTICIPANT ID TYPE"] ?? "",
                        direct_indirect: f["DIRECT INDIRECT"],
                        service_roles: f["SERVICE ROLES"],
                        bic: f["BIC"],
                        current: r.modificationType.toUpperCase() !== "D" &&
                            effective(r.startDate, r.stopDate, asOf),
                    });
                }
            }
            else if (r.prefix === "RELATIONSHIPS") {
                const one = matches(c, f["ID INST1"]);
                const two = matches(c, f["ID INST2"]);
                if (!one && !two)
                    continue;
                const rel = c.result.relationships;
                const roleOne = (f["ROLE INST1"] ?? "").toLowerCase();
                if (r.structure === "SSI") {
                    if (one)
                        rel.as_account_owner++;
                    else
                        rel.as_account_holder++;
                }
                else
                    rel.other++;
                push(c, rel.examples, {
                    source,
                    line: r.line,
                    structure: r.structure,
                    role: one ? (f["ROLE INST1"] ?? roleOne) : (f["ROLE INST2"] ?? ""),
                    counterparty_id: one ? (f["ID INST2"] ?? "") : (f["ID INST1"] ?? ""),
                    counterparty_name: one ? (f["NAME INST2"] ?? "") : (f["NAME INST1"] ?? ""),
                    currency: f["CURRENCY CODE"] ?? "",
                    asset_categories: f["ASSET CATEGORIES"],
                    preferred: (f["PREFERRED"] ?? "").toUpperCase() === "Y",
                    account: f["ACCOUNT NBR INST1"] ? maskAccount(f["ACCOUNT NBR INST1"]) : undefined,
                    current: r.modificationType.toUpperCase() !== "D" && effective(r.startDate, r.stopDate, asOf),
                });
            }
        }
    }, (line) => {
        const upper = line.toUpperCase();
        return needles.some((n) => upper.includes(n));
    });
    if (summary.unknownStructures.length) {
        notes.push(`${source}: skipped record structures with no known layout (${summary.unknownStructures.join(", ")}). Put the STRUCTURES-*.txt file from the same download next to it.`);
    }
}
/** Legacy SWIFTRef files that hold no identifiers (code lists, layouts, licences). */
const NOT_IDENTIFIER_FILE = /(COUNTRY_CODE|CURRENCY_CODE|STRUCTURE|EULA|SHA256|HOLIDAY|PUBLICATIONSCHEDULE|ACCOUNTNBFORMAT|LOCALLANGUAGE|EXCLUSIONLIST)/i;
/** A delta file whose full counterpart sits in the same folder adds nothing but duplicates. */
function supersededDelta(name, siblings) {
    const full = name.replace(/_DELTA_/i, "_FULL_").replace(/-V(\d+)-M-/i, "-V$1-F-");
    return full !== name && siblings.some((s) => s.toLowerCase() === full.toLowerCase());
}
/** Finds the columns a tabular header provides, or explains what is missing. */
function tabularColumns(headerCells, file, columnMap) {
    const header = headerCells.map((c) => c.trim().toLowerCase());
    const find = (field) => {
        const mapped = columnMap?.[field];
        if (mapped) {
            const i = header.indexOf(mapped.trim().toLowerCase());
            if (i < 0)
                throw new ReferenceInputError(`column_map.${field}: no column named "${mapped}" in ${path.basename(file)}.`);
            return i;
        }
        return (IDENTIFIER_ALIASES[field]
            .map((a) => header.indexOf(a))
            .find((i) => i >= 0) ?? -1);
    };
    const ids = columnMap?.id
        ? [header.indexOf(columnMap.id.trim().toLowerCase())]
        : header
            .map((h, i) => (IDENTIFIER_ALIASES.id.includes(h) ? i : -1))
            .filter((i) => i >= 0);
    const fields = Object.fromEntries(Object.keys(IDENTIFIER_ALIASES).filter((f) => f !== "id").map((f) => [f, find(f)]));
    const bicCode = header.indexOf("bic code");
    const branchCode = header.indexOf("branch code");
    // With a separate branch code, BIC CODE alone would match every branch: match the combined BIC11 instead.
    const searched = bicCode >= 0 && branchCode >= 0 ? ids.filter((i) => i !== bicCode) : ids;
    const cols = { ...fields, ids: searched, bicCode, branchCode };
    if (ids[0] === -1 ||
        (ids.length === 0 && cols.participant < 0 && cols.linkedBic < 0 && cols.bicCode < 0)) {
        throw new ReferenceInputError(`${path.basename(file)}: no identifier column found. Expected a header such as 'BIC', 'Swift Code', 'National ID', 'Sort Code' or 'LEI', or pass column_map.id.`);
    }
    return cols;
}
function scanTabular(file, collectors, asOf, columnMap) {
    const source = path.basename(file);
    const header = firstLine(file);
    const delimiter = detectDelimiter(header);
    const cols = tabularColumns(header.split(delimiter).map((c) => c.replace(/^"|"$/g, "")), file, columnMap);
    const headerNames = header.split(delimiter).map((c) => c.trim());
    const isService = cols.service >= 0 && cols.participant >= 0;
    const onRow = (cells, line) => {
        const get = (idx) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");
        // BIC Directory 2018 splits the BIC into BIC CODE (8) and BRANCH CODE (3).
        const composite = cols.bicCode >= 0 && cols.branchCode >= 0
            ? get(cols.bicCode) + (get(cols.branchCode) || "XXX")
            : "";
        const status = get(cols.status);
        const deleted = get(cols.modification).toUpperCase() === "D";
        const current = !deleted &&
            !/^(o|inactive|deleted|expired|closed|retired)$/i.test(status) &&
            effective(get(cols.start), get(cols.stop), asOf);
        for (const c of collectors) {
            if (isService) {
                if (!matches(c, get(cols.participant)) && !cols.ids.some((i) => matches(c, get(i))))
                    continue;
                push(c, c.result.participations, {
                    source,
                    line,
                    structure: "service participation",
                    service_id: get(cols.service),
                    participant_id: get(cols.participant),
                    participant_id_type: "",
                    direct_indirect: get(cols.reach) || undefined,
                    bic: cols.ids.map(get).find(Boolean),
                    current,
                });
                continue;
            }
            const hitCol = cols.ids.find((idx) => matches(c, get(idx)));
            const compositeHit = hitCol === undefined && matches(c, composite);
            const linked = hitCol === undefined && !compositeHit && matches(c, get(cols.linkedBic));
            if (hitCol === undefined && !compositeHit && !linked)
                continue;
            const hit = {
                source,
                line,
                id: compositeHit ? composite : hitCol !== undefined ? get(hitCol) : get(cols.ids[0] ?? -1),
                id_type: get(cols.idType) ||
                    (compositeHit
                        ? "BIC11 (BIC CODE + BRANCH CODE)"
                        : (headerNames[hitCol ?? cols.ids[0] ?? -1] ?? "")),
                name: get(cols.name),
                town: get(cols.town),
                country_code: get(cols.country),
                successor_id: get(cols.successor) || undefined,
                linked_bic: get(cols.linkedBic) || undefined,
                record_status: deleted ? "D" : status,
                start_date: get(cols.start),
                stop_date: get(cols.stop),
                historical: false,
                current,
            };
            push(c, linked ? c.result.linked_identifiers : c.result.identifiers, hit);
        }
    };
    if (delimiter === "\t") {
        // Tab-delimited exports (all SWIFTRef legacy products) have no quoted multi-line cells, so stream them.
        const needles = [...new Set(collectors.flatMap((c) => [...c.keys]))];
        const bic8Needles = needles.filter((n) => n.length >= 8).map((n) => n.slice(0, 8));
        forEachLine(file, (line, lineNo) => {
            if (lineNo === 1 || !line)
                return;
            const upper = line.toUpperCase();
            if (!needles.some((n) => upper.includes(n)) &&
                !(cols.bicCode >= 0 && bic8Needles.some((n) => upper.includes(n))))
                return;
            onRow(line.split("\t"), lineNo);
        });
        return;
    }
    const size = statSync(file).size;
    if (size > MAX_CSV_BYTES) {
        throw new ReferenceInputError(`${source} is ${size} bytes; the limit for a comma-separated export is ${MAX_CSV_BYTES} bytes. Export it tab-delimited, which has no size limit.`);
    }
    const rows = parseDelimited(readFileSync(file, "utf8").replace(/^\uFEFF/, ""), delimiter);
    rows.slice(1).forEach((cells, i) => onRow(cells, i + 2));
}
/** Looks each identifier up in every file `target` stands for. */
export function lookupReference(target, ids, asOf, columnMap) {
    const queries = [...new Set(ids.map((i) => i.trim()).filter(Boolean))];
    if (queries.length === 0)
        throw new ReferenceInputError("Pass at least one identifier in `ids`.");
    if (queries.length > MAX_IDS)
        throw new ReferenceInputError(`Look up at most ${MAX_IDS} identifiers per call.`);
    const { files, layouts, notes } = resolveSources(target);
    const collectors = queries.map(collectorFor);
    const sources = [];
    for (const file of files) {
        const header = firstLine(file);
        if (isSwiftRefHeader(header)) {
            sources.push({
                file,
                format: "SWIFTRef V1 TXT",
                kind: filePrefix(file),
                ...(isDeltaFile(file) ? { delta_file: true } : {}),
            });
            scanSwiftRef(file, layouts, collectors, asOf, notes);
        }
        else if (/\.(csv|tsv|txt)$/i.test(file)) {
            const legacy = /^(BICPLUS|BICDIR\d*|BANKDIRECTORYPLUS|IBANPLUS|SEPAROUTING|EXCLUSIONLIST|REACHPLUS|GPI|SSIPLUS)/i.test(path.basename(file));
            sources.push({
                file,
                format: legacy
                    ? `SWIFTRef ${path.basename(file).split("_")[0]}`
                    : /\t/.test(header)
                        ? "TSV"
                        : "CSV",
                kind: "TABULAR",
                ...(/_DELTA_/i.test(file) ? { delta_file: true } : {}),
            });
            scanTabular(file, collectors, asOf, columnMap);
        }
    }
    if (sources.some((s) => s.delta_file)) {
        notes.push("Some files are monthly delta (M) files, which list only changes. Use the full (F) files for a complete lookup.");
    }
    return { as_of: asOf, sources, results: collectors.map((c) => c.result), notes };
}
