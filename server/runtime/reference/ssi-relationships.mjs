// Generated from plugins/payment-intelligence/server/src/reference/ssi-relationships.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { resolveSources } from "./lookup.mjs";
import { readSwiftRef } from "./swiftref.mjs";
export function ssiRecordsFromRelationships(filePath) {
    const { layouts } = resolveSources(filePath);
    const records = [];
    const summary = readSwiftRef(filePath, layouts, (r) => {
        if (r.structure !== "SSI")
            return;
        const f = r.fields;
        const categories = (f["ASSET CATEGORIES"] ?? "")
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        for (const assetCategory of categories.length ? categories : [""]) {
            records.push({
                line: r.line,
                recordKey: r.recordKey,
                modificationFlag: r.modificationType,
                ownerBic: f["ID INST1"] ?? "",
                ownerName: f["NAME INST1"] ?? "",
                ownerCountry: f["COUNTRY CODE INST1"] ?? "",
                ownerId: "",
                market: "",
                currency: f["CURRENCY CODE"] ?? "",
                assetCategory,
                accountHolderBic: f["ID INST2"] ?? "",
                accountHolderName: f["NAME INST2"] ?? "",
                accountHolderCountry: f["COUNTRY CODE INST2"] ?? "",
                account: f["ACCOUNT NBR INST1"] ?? "",
                preferredFlag: f["PREFERRED"] ?? "",
                holderType: "",
                updateDate: f["UPDATE DATE"] ?? "",
                // SWIFTRef gives no traffic date, so the flag alone would trip the flag-without-date rule.
                trafficFlag: "",
                trafficDate: "",
                startDate: r.startDate,
                stopDate: r.stopDate,
                status: r.recordStatus === "O" ? "expired" : "",
                lastConfirmed: "",
            });
        }
    }, (line) => line.includes("\tSSI\t"));
    if (records.length === 0) {
        const why = summary.unknownStructures.includes("SSI")
            ? " Its SSI rows have no known layout: put the STRUCTURES-*.txt file from the same download next to it."
            : "";
        throw new Error(`No SSI records found in this SWIFTRef RELATIONSHIPS file.${why}`);
    }
    return {
        format: "SWIFTRef RELATIONSHIPS (SSI)",
        records,
        columns: [
            "recordKey",
            "modificationFlag",
            "ownerBic",
            "ownerName",
            "ownerCountry",
            "currency",
            "assetCategory",
            "accountHolderBic",
            "accountHolderName",
            "accountHolderCountry",
            // ACCOUNT NBR INST1, START DATE and STOP DATE are optional in SWIFTRef, so they are not
            // listed as columns: the required-field rules skip them, while accounts and dates are
            // still compared and used for effectiveness wherever a record has them.
            "preferredFlag",
            "updateDate",
        ],
        ignoredColumns: [],
    };
}
