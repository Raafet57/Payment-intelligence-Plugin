// Generated from plugins/payment-intelligence/server/src/tools.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Pure tool handlers for the Payment Intelligence MCP server.
 *
 * Each handler wraps an existing `src/lib` module and returns a plain
 * JSON-serialisable object. Nothing here makes a network call; the only I/O
 * is reading files the caller names and, for the scrubber, writing the
 * scrubbed copy to a path the caller names.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { analyzeBic } from "./lib/bic/index.mjs";
import { checkCbprReadiness } from "./lib/cbpr/index.mjs";
import { analyzeIban, buildIban, getBbanTemplate, getCountry, getRegistryMeta } from "./lib/iban/index.mjs";
import { analyzeDocuments, decodeReasonCode, insightsToMarkdown, listReasonCodes, REASON_CODE_CAVEAT, } from "./lib/insights/index.mjs";
import { scrub, ScrubInputError } from "./lib/iso20022/index.mjs";
import { buildNarratives, buildOperatorSummary, generateInsights, parseStory, StorytellerInputError, summarizeMarkdown, } from "./lib/storyteller/index.mjs";
import { firstLine } from "./reference/lines.mjs";
import { lookupReference, ReferenceInputError, } from "./reference/lookup.mjs";
import { ssiRecordsFromRelationships } from "./reference/ssi-relationships.mjs";
import { filePrefix, isSwiftRefHeader } from "./reference/swiftref.mjs";
import { checkRoute, RouteError, routesFromMessage } from "./ssi/match.mjs";
import { parseSsiFile, SsiFileError } from "./ssi/parse.mjs";
import { isActive, SSI_RULES, validateRecords } from "./ssi/rules.mjs";
/** Upper bound for any single payment message file the tools will read. */
export const MAX_FILE_BYTES = 2_000_000;
/** Upper bound for an SSI file (full SWIFTRef SSI Plus extracts are large). */
export const MAX_SSI_FILE_BYTES = 200_000_000;
export class ToolInputError extends Error {
}
export function readXmlSource({ xml, path: filePath }) {
    if (xml !== undefined && filePath !== undefined) {
        throw new ToolInputError("Pass either `xml` or `path`, not both.");
    }
    if (xml !== undefined)
        return { text: xml, label: "inline XML" };
    if (filePath !== undefined)
        return { text: readTextFile(filePath), label: filePath };
    throw new ToolInputError("Pass the message as `xml` (inline) or `path` (local file).");
}
function readTextFile(filePath, maxBytes = MAX_FILE_BYTES) {
    const resolved = path.resolve(filePath);
    if (!existsSync(resolved))
        throw new ToolInputError(`File not found: ${filePath}`);
    const stats = statSync(resolved);
    if (!stats.isFile())
        throw new ToolInputError(`Not a regular file: ${filePath}`);
    if (stats.size > maxBytes) {
        throw new ToolInputError(`File is ${stats.size} bytes; the limit is ${maxBytes} bytes per file.`);
    }
    return readFileSync(resolved, "utf8");
}
export function validateIban(input) {
    return { ...analyzeIban(input.iban), registry: getRegistryMeta() };
}
export function buildIbanTool(input) {
    const countryCode = input.country_code.trim().toUpperCase();
    const country = getCountry(countryCode);
    if (!country) {
        throw new ToolInputError(`${countryCode} is not in the bundled SWIFT IBAN Registry snapshot.`);
    }
    const template = getBbanTemplate(country);
    if (!input.fields || Object.keys(input.fields).length === 0) {
        return {
            ok: false,
            reason: "fields-required",
            message: "Supply a value for every field id in `template.fields` to build the IBAN.",
            template,
        };
    }
    return buildIban({ countryCode, fields: input.fields });
}
/** Environment variable naming the user's reference data (a SWIFTRef folder or a CSV/TSV). */
export const REFERENCE_PATH_ENV = "PAYMENT_INTELLIGENCE_REFERENCE_PATH";
const referencePath = (explicit) => explicit ?? (process.env[REFERENCE_PATH_ENV] || undefined);
export function checkBic(input) {
    // The plugin ships no bank-directory data, so drop the demo-snapshot lookup.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { snapshotEntry, ...result } = analyzeBic(input.bic);
    const base = {
        ...result,
        checks: result.checks.filter((check) => check.id !== "snapshot"),
    };
    const source = referencePath(input.reference_path);
    if (!source) {
        return {
            ...base,
            caveat: "ISO 9362 syntax and country-code checks only. No bank directory is bundled: pass reference_path (your BIC Directory or Payments Directory folder, or a CSV/TSV export) to look the BIC up in your own data. A well-formed BIC may not exist or be reachable. Never use this for routing or compliance decisions.",
        };
    }
    const lookup = runLookup(source, [input.bic], input.as_of);
    const hit = lookup.results[0];
    const current = hit.identifiers.filter((i) => i.current);
    return {
        ...base,
        directory: {
            sources: lookup.sources.map((s) => s.file),
            as_of: lookup.as_of,
            found: hit.identifiers.length > 0,
            current: current.length > 0,
            records: hit.identifiers,
            successor: hit.identifiers.find((i) => i.successor_id)?.successor_id,
            participations: hit.participations,
            notes: lookup.notes,
        },
        caveat: "Looked up in your own reference files. A current directory record does not prove the institution can be reached for a given payment: service participation, routing and bilateral relationships are separate checks.",
    };
}
function runLookup(source, ids, asOf, columnMap) {
    try {
        return lookupReference(source, ids, checkDate(asOf, "as_of") ?? today(), columnMap);
    }
    catch (err) {
        if (err instanceof ReferenceInputError)
            throw new ToolInputError(err.message);
        throw err;
    }
}
export function lookupReferenceData(input) {
    const source = referencePath(input.path);
    if (!source) {
        throw new ToolInputError(`Pass \`path\` (an unzipped SWIFTRef BIC Directory or Payments Directory folder, one of its .txt files, or a CSV/TSV export from any provider), or set ${REFERENCE_PATH_ENV}.`);
    }
    return {
        ...runLookup(source, input.ids, input.as_of, input.column_map),
        caveat: "Results come only from the reference files you pointed at, read locally. Only matching records are returned, and account numbers are masked. A current record does not prove reachability for a specific payment.",
    };
}
export function explainPaymentMessage(input) {
    const { text, label } = readXmlSource(input);
    let story;
    try {
        story = parseStory(text);
    }
    catch (err) {
        if (err instanceof StorytellerInputError)
            throw new ToolInputError(err.message);
        throw err;
    }
    const narratives = buildNarratives(story);
    return {
        source: label,
        support: story.support,
        operatorSummary: buildOperatorSummary(story),
        narrative: narratives.narrative,
        concise: narratives.concise,
        insights: generateInsights(story),
        summaryMarkdown: summarizeMarkdown(story),
    };
}
export function scrubPaymentMessage(input) {
    const { text, label } = readXmlSource(input);
    let result;
    try {
        result = scrub(text, input.options ?? {});
    }
    catch (err) {
        if (err instanceof ScrubInputError) {
            throw new ToolInputError(err.detail ? `${err.message} ${err.detail}` : err.message);
        }
        throw err;
    }
    const summary = {
        source: label,
        kind: result.kind,
        stats: result.stats,
        mapping: result.mapping,
        note: "Mapping shows masked previews only; originals are never returned.",
    };
    if (input.output_path === undefined) {
        return { ...summary, output: result.output };
    }
    const outPath = path.resolve(input.output_path);
    if (input.path !== undefined && outPath === path.resolve(input.path)) {
        throw new ToolInputError("`output_path` must differ from `path`; originals are never overwritten.");
    }
    if (existsSync(outPath)) {
        throw new ToolInputError(`Refusing to overwrite existing file: ${input.output_path}`);
    }
    writeFileSync(outPath, result.output, "utf8");
    return { ...summary, writtenTo: outPath };
}
export function checkCbpr(input) {
    const { text, label } = readXmlSource(input);
    return {
        source: label,
        ...checkCbprReadiness(text),
        caveat: "Local structure and namespace readiness hints only. Not a certified CBPR+ / MyStandards validator.",
    };
}
export function analyzePaymentLifecycle(input) {
    const sources = [
        ...(input.paths ?? []).map((p) => ({ fileName: path.basename(p), text: readTextFile(p) })),
        ...(input.documents ?? []).map((d) => ({ fileName: d.file_name, text: d.xml })),
    ];
    if (sources.length === 0) {
        throw new ToolInputError("Pass at least one file in `paths` or `documents`.");
    }
    const analysis = analyzeDocuments(sources);
    return {
        stats: analysis.stats,
        report: insightsToMarkdown(analysis),
        caveat: "Groups only the files supplied, by shared identifiers. Not live payment tracking, reachability or settlement monitoring.",
    };
}
export function decodeReasonCodeTool(input) {
    if (!input.code)
        return { caveat: REASON_CODE_CAVEAT, codes: listReasonCodes() };
    const info = decodeReasonCode(input.code);
    return info
        ? { caveat: REASON_CODE_CAVEAT, ...info }
        : { caveat: REASON_CODE_CAVEAT, code: input.code.toUpperCase(), found: false };
}
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const today = () => new Date().toISOString().slice(0, 10);
function readSsiFile(input) {
    if (input.ssi_path !== undefined && input.ssi_content === undefined) {
        const resolved = path.resolve(input.ssi_path);
        if (existsSync(resolved) &&
            statSync(resolved).isFile() &&
            filePrefix(resolved) === "RELATIONSHIPS" &&
            isSwiftRefHeader(firstLine(resolved))) {
            try {
                return { ...ssiRecordsFromRelationships(resolved), source: input.ssi_path };
            }
            catch (err) {
                if (err instanceof ReferenceInputError || err instanceof Error)
                    throw new ToolInputError(err.message);
                throw err;
            }
        }
    }
    if (input.ssi_path !== undefined && input.ssi_content !== undefined) {
        throw new ToolInputError("Pass either `ssi_path` or `ssi_content`, not both.");
    }
    const text = input.ssi_path !== undefined
        ? readTextFile(input.ssi_path, MAX_SSI_FILE_BYTES)
        : input.ssi_content !== undefined
            ? input.ssi_content
            : undefined;
    if (text === undefined)
        throw new ToolInputError("Pass the SSI file as `ssi_path` or `ssi_content`.");
    try {
        return {
            ...parseSsiFile(text, input.column_map),
            source: input.ssi_path ?? "inline SSI content",
        };
    }
    catch (err) {
        if (err instanceof SsiFileError)
            throw new ToolInputError(err.message);
        throw err;
    }
}
function checkDate(value, name) {
    if (value !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new ToolInputError(`\`${name}\` must be YYYY-MM-DD.`);
    }
    return value;
}
export function validateSsiFile(input) {
    const file = readSsiFile(input);
    const asOf = checkDate(input.as_of, "as_of") ?? today();
    const findings = validateRecords(file.records, file.columns, asOf).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.line - b.line);
    const byRule = new Map();
    for (const f of findings)
        byRule.set(f.rule_id, (byRule.get(f.rule_id) ?? 0) + 1);
    const failingLines = new Set(findings.filter((f) => f.severity !== "low").map((f) => f.line));
    const limit = Math.max(1, Math.min(input.max_findings ?? 50, 500));
    return {
        source: file.source,
        format: file.format,
        as_of: asOf,
        records: file.records.length,
        active_records: file.records.filter((r) => isActive(r, asOf)).length,
        records_with_issues: failingLines.size,
        columns_recognised: file.columns,
        columns_ignored: file.ignoredColumns,
        summary: [...byRule.entries()]
            .map(([rule_id, count]) => ({
            rule_id,
            severity: SSI_RULES[rule_id].severity,
            count,
            message: SSI_RULES[rule_id].message,
        }))
            .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count),
        findings: findings.slice(0, limit),
        findings_truncated: findings.length > limit ? findings.length - limit : 0,
        not_checked: "Rules ported from SSI Control Tower, minus its lineage, provider-conflict, entity-risk, licensing and export gates. Format and consistency only: this does not confirm that an institution, BIC or account exists. Account numbers are masked in all output.",
    };
}
export function checkPaymentAgainstSsi(input) {
    const file = readSsiFile(input);
    checkDate(input.value_date, "value_date");
    const overrides = {
        owner_bic: input.owner_bic,
        currency: input.currency,
        asset_category: input.asset_category,
        account_holder_bic: input.account_holder_bic,
        account: input.account,
        value_date: input.value_date,
    };
    const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined));
    let kind = "route fields";
    let routes = [overrides];
    if (input.xml !== undefined || input.path !== undefined) {
        const { text } = readXmlSource(input);
        try {
            const fromMessage = routesFromMessage(text);
            kind = fromMessage.kind;
            routes = fromMessage.routes.map((r) => ({ ...r, ...defined }));
        }
        catch (err) {
            if (err instanceof RouteError)
                throw new ToolInputError(err.message);
            throw err;
        }
    }
    const results = routes.map((route) => checkRoute(file.records, route, today()));
    return {
        ssi_source: file.source,
        ssi_format: file.format,
        ssi_records: file.records.length,
        checked: kind,
        results,
        assumptions: kind === "pacs.008"
            ? "pacs.008: owner = creditor agent, correspondent = last intermediary agent, account = CdtrAgtAcct, asset category COPA unless overridden."
            : kind === "pacs.009"
                ? "pacs.009: owner = creditor FI, correspondent = creditor agent, account = CdtrAcct, asset category CASH unless overridden."
                : undefined,
    };
}
