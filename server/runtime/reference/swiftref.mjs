// Generated from plugins/payment-intelligence/server/src/reference/swiftref.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * One reader for every SWIFTRef "V1 TXT" file: BIC Directory, Payments Directory and
 * the rest of the SWIFTRef family (IDENTIFIERS, PARTICIPANTS, RELATIONSHIPS, ...).
 *
 * Each file has a fixed header (MODIFICATION TYPE ... STOP DATE, then ATTRIBUTE 1..50).
 * What each ATTRIBUTE means depends on the record's RECORD STRUCTURE, and one file can
 * mix structures (RELATIONSHIPS holds both "SSI" and "PMI REL" rows). Layouts come from,
 * in priority order:
 *   1. the STRUCTURES-*.txt file shipped in the same download (authoritative);
 *   2. the file's own header-specification row (RECORD CONTENT TYPE "H");
 *   3. the built-in layouts below, for structures the tools rely on.
 * Nothing here ships reference data: only column names, which are format metadata.
 */
import path from "node:path";
import { firstLine, forEachLine } from "./lines.mjs";
const FIXED = [
    "MODIFICATION TYPE",
    "RECORD KEY",
    "RECORD STRUCTURE",
    "RECORD CONTENT TYPE",
    "RECORD STATUS",
    "START DATE",
    "STOP DATE",
];
/** Layouts the tools depend on, used only when neither STRUCTURES nor an "H" row gives one. */
const BUILT_IN = {
    "RELATIONSHIPS|SSI": [
        "RELATIONSHIP TYPE",
        "EID INST1",
        "ROLE INST1",
        "ID INST1",
        "ID TYPE INST1",
        "COUNTRY CODE INST1",
        "NAME INST1",
        "TOWN NAME INST1",
        "EID INST2",
        "ROLE INST2",
        "ID INST2",
        "ID TYPE INST2",
        "NAME INST2",
        "TOWN NAME INST2",
        "COUNTRY CODE INST2",
        "REL USAGE",
        "ASSET CATEGORIES",
        "CURRENCY CODE",
        "PREFERRED",
        "UPDATE DATE",
        "TRAFFIC FLAG",
        "ACCOUNT NBR INST1",
        "GROUP EID INST1",
        "GROUP EID INST2",
        "CONFIRMED INST1",
        "VALIDATED INST2",
    ],
};
export const layoutKey = (prefix, structure) => `${prefix.toUpperCase()}|${structure.trim().toUpperCase()}`;
/** IDENTIFIERS from "IDENTIFIERS-BIC-V1-F-2026-02-07.txt". */
export function filePrefix(filePath) {
    return path.basename(filePath).split("-")[0].toUpperCase();
}
/** True when the header line is a SWIFTRef V1 fixed header. */
export function isSwiftRefHeader(header) {
    const cells = header.split("\t").map((c) => c.trim());
    return FIXED.every((f) => cells.includes(f)) && cells.includes("ATTRIBUTE 1");
}
export function isSwiftRefFile(filePath) {
    return isSwiftRefHeader(firstLine(filePath));
}
/** A delta (monthly "M") file only lists changes, so a lookup in it alone is incomplete. */
export function isDeltaFile(filePath) {
    return /-V\d+-M-\d{4}-\d{2}-\d{2}/i.test(path.basename(filePath));
}
export function builtInLayouts() {
    return new Map(Object.entries(BUILT_IN).map(([k, v]) => [k, [...v]]));
}
/** Reads a STRUCTURES-*.txt file into layouts for every file prefix and record structure. */
export function loadStructures(structuresPath, into = new Map()) {
    readSwiftRef(structuresPath, new Map(), (record) => {
        if (record.structure !== "STRUCTURE")
            return;
        const prefix = record.fields["FILE NAME PREFIX"];
        const structure = record.fields["RECORD STRUCTURE NAME"];
        const attribute = record.fields["FILE HEADER ATTRIBUTE NAME"]?.match(/^ATTRIBUTE (\d+)$/);
        const name = record.fields["RECORD HEADER ATTRIBUTE NAME"];
        if (!prefix || !structure || !attribute || !name || /^(not used|n\/a)$/i.test(name))
            return;
        const key = layoutKey(prefix, structure);
        const layout = into.get(key) ?? [];
        layout[Number(attribute[1]) - 1] = name.trim();
        into.set(key, layout);
    });
    return into;
}
/**
 * Streams the file's data records to `onRecord`. `prefilter`, when given, skips data
 * lines before they are split (a cheap substring test makes large lookups fast).
 * Layouts found in "H" rows are added to `layouts` unless one is already there.
 */
export function readSwiftRef(filePath, layouts, onRecord, prefilter) {
    const prefix = filePrefix(filePath);
    let fixed;
    let attributes = [];
    const unknown = new Set();
    const summary = { lines: 0, records: 0, unknownStructures: [] };
    forEachLine(filePath, (line, lineNo) => {
        summary.lines = lineNo;
        if (lineNo === 1) {
            const cells = line.split("\t").map((c) => c.trim());
            fixed = Object.fromEntries(FIXED.map((f) => [f, cells.indexOf(f)]));
            attributes = [];
            cells.forEach((c, i) => {
                const m = c.match(/^ATTRIBUTE (\d+)$/);
                if (m)
                    attributes[Number(m[1]) - 1] = i;
            });
            return;
        }
        if (!fixed || !line)
            return;
        const isHeaderRow = line.split("\t", fixed["RECORD CONTENT TYPE"] + 1).pop() === "H";
        if (!isHeaderRow && prefilter && !prefilter(line))
            return;
        const cells = line.split("\t");
        const at = (i) => (i >= 0 ? (cells[i] ?? "").trim() : "");
        const structure = at(fixed["RECORD STRUCTURE"]);
        const key = layoutKey(prefix, structure);
        if (isHeaderRow) {
            if (!layouts.has(key))
                layouts.set(key, attributes.map((i) => at(i)));
            return;
        }
        const layout = layouts.get(key);
        if (!layout) {
            unknown.add(structure);
            return;
        }
        const fields = {};
        layout.forEach((name, n) => {
            const value = at(attributes[n] ?? -1);
            if (name && value)
                fields[name] = value;
        });
        summary.records++;
        onRecord({
            line: lineNo,
            prefix,
            structure,
            modificationType: at(fixed["MODIFICATION TYPE"]),
            recordKey: at(fixed["RECORD KEY"]),
            recordStatus: at(fixed["RECORD STATUS"]),
            startDate: at(fixed["START DATE"]),
            stopDate: at(fixed["STOP DATE"]),
            fields,
        });
    });
    summary.unknownStructures = [...unknown];
    return summary;
}
