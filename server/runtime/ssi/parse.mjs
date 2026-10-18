// Generated from plugins/payment-intelligence/server/src/ssi/parse.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Reads a user's SSI file into one record shape.
 *
 * Supported: the SWIFTRef SSI Plus V3 tab-delimited file (28-field header), and CSV or
 * TSV exports whose headers match the aliases below (including SSI Control Tower's
 * import CSV). Values are kept as found; rules normalise them. Account numbers stay in
 * memory only and are masked before anything is returned.
 */
/** Header aliases in priority order: the first one present wins. */
const ALIASES = {
    recordKey: ["record key", "ssi reference", "ssi id", "ssi key", "reference"],
    modificationFlag: ["modification flag"],
    ownerBic: ["bic owner", "owner bic", "account owner bic", "entity bic", "bic"],
    ownerName: ["institution name owner", "owner name", "entity name", "legal entity", "fund name"],
    ownerCountry: ["iso country code owner", "owner country", "owner country code", "jurisdiction"],
    ownerId: ["lei", "legal entity id", "fund code", "account owner id"],
    market: ["market", "settlement market"],
    currency: ["iso currency code", "currency", "currency code", "ccy"],
    assetCategory: ["asset category", "asset class", "asset type"],
    accountHolderBic: [
        "bic account holding institution",
        "account holder bic",
        "account holding institution bic",
        "correspondent bic",
        "local agent bic",
        "global custodian bic",
    ],
    accountHolderName: [
        "institution name account holding institution",
        "account holder name",
        "correspondent name",
    ],
    accountHolderCountry: [
        "iso country code account holding institution",
        "account holder country",
        "account holder country code",
        "correspondent country",
    ],
    account: [
        "account nbr with account holding institution",
        "account number",
        "account",
        "cash account",
        "securities account",
    ],
    preferredFlag: ["preferred account holding institution", "preferred flag", "preferred"],
    holderType: ["account holding institution type", "account holder type"],
    updateDate: ["update date", "last updated"],
    trafficFlag: ["traffic flag"],
    trafficDate: ["traffic date"],
    startDate: ["start date", "effective from", "valid from"],
    stopDate: ["stop date", "effective to", "valid to"],
    status: ["status"],
    lastConfirmed: ["last confirmed", "last confirmed at", "confirmed on"],
};
const SSIPLUS_V3_MARKERS = [
    "BIC OWNER",
    "ISO CURRENCY CODE",
    "ASSET CATEGORY",
    "BIC ACCOUNT HOLDING INSTITUTION",
];
export class SsiFileError extends Error {
}
export function parseSsiFile(text) {
    const body = text.replace(/^\uFEFF/, "");
    const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
    if (!firstLine.trim())
        throw new SsiFileError("The SSI file is empty.");
    const delimiter = detectDelimiter(firstLine);
    const rows = parseDelimited(body, delimiter);
    const header = rows[0].map((cell) => cell.trim());
    const upper = header.map((cell) => cell.toUpperCase());
    const isSsiPlus = delimiter === "\t" && SSIPLUS_V3_MARKERS.every((m) => upper.includes(m));
    const lower = header.map((cell) => cell.toLowerCase());
    const index = {};
    for (const [field, aliases] of Object.entries(ALIASES)) {
        index[field] = aliases.map((a) => lower.indexOf(a)).find((i) => i >= 0) ?? -1;
    }
    const used = new Set(Object.values(index).filter((i) => i >= 0));
    const columns = Object.keys(index).filter((f) => index[f] >= 0);
    if (index.ownerBic < 0 || index.currency < 0) {
        throw new SsiFileError("Could not find the owner BIC and currency columns. Expected a SWIFTRef SSI Plus V3 file or a CSV/TSV with headers such as 'Owner BIC', 'Currency', 'Asset Category', 'Account Holder BIC' and 'Account Number'.");
    }
    const records = [];
    rows.slice(1).forEach((cells, i) => {
        if (cells.every((c) => !c.trim()))
            return;
        const get = (field) => (index[field] >= 0 ? (cells[index[field]] ?? "").trim() : "");
        const record = { line: i + 2 };
        for (const field of Object.keys(ALIASES))
            record[field] = get(field);
        records.push(record);
    });
    return {
        format: isSsiPlus ? "SWIFTRef SSI Plus V3" : delimiter === "\t" ? "TSV" : "CSV",
        records,
        columns,
        ignoredColumns: header.filter((cell, i) => cell && !used.has(i)),
    };
}
function detectDelimiter(headerLine) {
    const counts = ["\t", ",", ";", "|"].map((d) => [d, headerLine.split(d).length - 1]);
    return counts.sort((a, b) => b[1] - a[1])[0][0];
}
/** RFC 4180-style parsing: quoted fields may contain delimiters, quotes ("") and newlines. */
function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                }
                else
                    quoted = false;
            }
            else
                cell += ch;
        }
        else if (ch === '"' && cell === "")
            quoted = true;
        else if (ch === delimiter) {
            row.push(cell);
            cell = "";
        }
        else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n")
                i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        }
        else
            cell += ch;
    }
    if (cell !== "" || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}
/** Parses YYYYMMDD, YYYY-MM-DD, DD/MM/YYYY or MM/DD/YYYY (tried in that order) to YYYY-MM-DD. */
export function parseSsiDate(value) {
    const raw = value.trim();
    if (!raw)
        return undefined;
    let y, m, d;
    let match;
    if ((match = raw.match(/^(\d{4})(\d{2})(\d{2})$/)) ||
        (match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
        [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    }
    else if ((match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
        const [a, b] = [Number(match[1]), Number(match[2])];
        y = Number(match[3]);
        [d, m] = a > 12 || b <= 12 ? [a, b] : [b, a];
    }
    else
        return null;
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
        return null;
    return date.toISOString().slice(0, 10);
}
/** Masks an account number for output, keeping at most the last four characters. */
export function maskAccount(value) {
    const raw = value.replace(/\s+/g, "");
    if (!raw)
        return "";
    if (raw.includes("****"))
        return raw;
    return raw.length <= 4 ? "****" : `****${raw.slice(-4)}`;
}
