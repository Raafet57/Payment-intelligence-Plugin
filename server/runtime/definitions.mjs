// Generated from plugins/payment-intelligence/server/src/definitions.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Tool catalogue: name, JSON Schema, MCP annotations and handler for every
 * tool the server exposes. Schemas use a small JSON Schema subset that
 * `validateArgs` enforces before a handler runs.
 */
import { analyzePaymentLifecycle, buildIbanTool, checkBic, checkCbpr, checkPaymentAgainstSsi, decodeReasonCodeTool, explainPaymentMessage, scrubPaymentMessage, ToolInputError, validateIban, validateSsiFile, } from "./tools.mjs";
const str = (description) => ({ type: "string", description });
const xmlSource = {
    xml: str("The ISO 20022 XML message, inline."),
    path: str("Path to a local XML file. Prefer this for real data so it never enters the chat."),
};
function annotations(title, readOnly = true) {
    return {
        title,
        readOnlyHint: readOnly,
        destructiveHint: false,
        idempotentHint: readOnly,
        openWorldHint: false,
    };
}
function tool(name, title, description, properties, required, handler, readOnly = true) {
    return {
        name,
        title,
        description,
        inputSchema: { type: "object", properties, required, additionalProperties: false },
        annotations: annotations(title, readOnly),
        handler,
    };
}
export const TOOLS = [
    tool("validate_iban", "Validate IBAN", "Validate an IBAN offline against the bundled SWIFT IBAN Registry snapshot: country, length, BBAN structure and MOD-97 check digits. Does not confirm the account exists.", { iban: str("IBAN, with or without spaces.") }, ["iban"], validateIban),
    tool("build_iban", "Build IBAN", "Build an IBAN from its BBAN fields and compute the MOD-97 check digits. Call without `fields` first to get the country's field template.", {
        country_code: str("ISO 3166 alpha-2 country code, e.g. DE."),
        fields: {
            type: "object",
            description: "Map of template field id to value, e.g. { bank: '37040044', account: '0532013000' }.",
            additionalProperties: { type: "string" },
        },
    }, ["country_code"], buildIbanTool),
    tool("check_bic", "Check BIC syntax", "ISO 9362 BIC syntax and ISO 3166 country-code checks. No bank directory is bundled, so it cannot confirm a BIC exists or is reachable; never use it for routing or compliance decisions.", { bic: str("8- or 11-character BIC.") }, ["bic"], checkBic),
    tool("explain_payment_message", "Explain payment message", "Explain an ISO 20022 payment message. pacs.008, pacs.009 and camt.053 get a plain-language narrative; pacs.002, pacs.004, camt.052 and camt.054 get a structured field projection. All get an operator summary and quick insights.", xmlSource, [], explainPaymentMessage),
    tool("scrub_payment_message", "Scrub payment message", "Replace names, IBANs, account ids, UETRs and references in a pacs/camt message with consistent pseudonyms. With `path` + `output_path`, writes the scrubbed copy to disk and returns only masked statistics, so the original data never enters the conversation. Never overwrites an existing file.", {
        ...xmlSource,
        output_path: str("Where to write the scrubbed XML. Must not exist yet and must differ from `path`."),
        options: {
            type: "object",
            additionalProperties: false,
            properties: {
                consistency: {
                    type: "boolean",
                    description: "Same original, same pseudonym (default true).",
                },
                preserveRemittance: {
                    type: "boolean",
                    description: "Keep remittance text (default false).",
                },
                shiftDates: { type: "boolean", description: "Shift dates by `dateOffsetDays`." },
                dateOffsetDays: { type: "integer" },
                maskFiOtherIds: { type: "boolean", description: "Also mask FI proprietary ids." },
            },
        },
    }, [], scrubPaymentMessage, false),
    tool("check_cbpr_readiness", "Check CBPR+ readiness", "Local CBPR+ readiness hints: AppHdr/Document namespaces, schema-profile coverage, UETR, BIC and IBAN syntax. Not a certified validator.", xmlSource, [], checkCbpr),
    tool("analyze_payment_lifecycle", "Analyze payment lifecycle", "Group a set of ACK/NACK, pacs and camt files by shared identifiers (UETR, EndToEndId, TxId) into threads with a timeline and warnings. Works only on the files given.", {
        paths: { type: "array", description: "Local file paths.", items: { type: "string" } },
        documents: {
            type: "array",
            description: "Inline documents.",
            items: {
                type: "object",
                properties: { file_name: { type: "string" }, xml: { type: "string" } },
                required: ["file_name", "xml"],
                additionalProperties: false,
            },
        },
    }, [], analyzePaymentLifecycle),
    tool("validate_ssi_file", "Validate SSI file", "Validate a standing settlement instruction (SSI) file: a SWIFTRef SSI Plus V3 extract or a CSV/TSV export. Checks BIC, ISO country, ISO 4217 currency and SSI asset-category formats, required fields, preferred flags, lifecycle dates, staleness, and conflicts (two preferred correspondents, overlapping active instructions). Rule ids match SSI Control Tower. Accounts are masked in the output.", {
        ssi_path: str("Path to the local SSI file. Prefer this: the file never enters the chat."),
        ssi_content: str("The SSI file content, inline (small files only)."),
        as_of: str("Date to judge active and stale instructions, YYYY-MM-DD. Defaults to today."),
        max_findings: {
            type: "integer",
            description: "Maximum findings to list (default 50, max 500).",
        },
    }, [], validateSsiFile),
    tool("check_payment_against_ssi", "Check payment against SSI file", "Check that a payment pays the beneficiary institution through the correspondent and account in the user's own SSI file. Reads the route from a pacs.008 (creditor agent, last intermediary, CdtrAgtAcct) or pacs.009 (creditor, creditor agent, CdtrAcct), or from explicit fields, then looks up owner BIC + currency + asset category and compares with the preferred SSI effective on the value date. Returns MATCH, ACCOUNT_MISMATCH, AGENT_MISMATCH, NOT_PREFERRED, AMBIGUOUS_SSI, NO_EFFECTIVE_SSI or NO_SSI per transaction. Accounts are masked.", {
        ssi_path: str("Path to the user's SSI file (SWIFTRef SSI Plus V3, CSV or TSV)."),
        ssi_content: str("The SSI file content, inline (small files only)."),
        ...xmlSource,
        owner_bic: str("Beneficiary institution BIC (the SSI owner). Overrides the message."),
        currency: str("ISO 4217 currency. Overrides the message."),
        asset_category: str("SSI asset category such as COPA, CASH, FOEX, SECU. Overrides the default for the message type."),
        account_holder_bic: str("Correspondent (account-holding institution) BIC used by the payment. Overrides the message."),
        account: str("Account at the correspondent used by the payment. Overrides the message."),
        value_date: str("Value date, YYYY-MM-DD. Defaults to the message settlement date, else today."),
    }, [], checkPaymentAgainstSsi),
    tool("decode_reason_code", "Decode status or reason code", "Explain an ISO 20022 status or reason code such as RJCT, AC01 or MD07. Omit `code` to list the curated set.", { code: str("Status or reason code.") }, [], decodeReasonCodeTool),
];
/** Throws ToolInputError when `value` does not match `schema`. */
export function validateArgs(schema, value, where = "arguments") {
    switch (schema.type) {
        case "string":
            if (typeof value !== "string")
                throw new ToolInputError(`${where} must be a string.`);
            return;
        case "boolean":
            if (typeof value !== "boolean")
                throw new ToolInputError(`${where} must be a boolean.`);
            return;
        case "integer":
            if (!Number.isInteger(value))
                throw new ToolInputError(`${where} must be an integer.`);
            return;
        case "array":
            if (!Array.isArray(value))
                throw new ToolInputError(`${where} must be an array.`);
            value.forEach((item, i) => schema.items && validateArgs(schema.items, item, `${where}[${i}]`));
            return;
        case "object": {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                throw new ToolInputError(`${where} must be an object.`);
            }
            const record = value;
            for (const key of schema.required ?? []) {
                if (record[key] === undefined)
                    throw new ToolInputError(`${where}.${key} is required.`);
            }
            for (const [key, item] of Object.entries(record)) {
                if (item === undefined)
                    continue;
                const known = schema.properties?.[key];
                if (known)
                    validateArgs(known, item, `${where}.${key}`);
                else if (typeof schema.additionalProperties === "object") {
                    validateArgs(schema.additionalProperties, item, `${where}.${key}`);
                }
                else if (schema.additionalProperties === false) {
                    throw new ToolInputError(`${where}.${key} is not a known argument.`);
                }
            }
        }
    }
}
