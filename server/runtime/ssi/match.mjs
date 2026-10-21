// Generated from plugins/payment-intelligence/server/src/ssi/match.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Checks a payment's settlement route against the user's own SSI file.
 *
 * Lookup follows the SWIFTRef SSI model: owner BIC + currency + asset category gives the
 * owner's standing instructions; the preferred effective one names the account-holding
 * institution (correspondent) and the account to pay into.
 *
 * From a message:
 * - pacs.008: owner = CdtrAgt; correspondent = the last IntrmyAgtN before it;
 *   account = CdtrAgtAcct; asset category defaults to COPA.
 * - pacs.009: owner = Cdtr; correspondent = CdtrAgt; account = CdtrAcct;
 *   asset category defaults to CASH.
 */
import { detectMessageKind, findDescendantsByLocalName, getFirstChildByLocalName, parseXml, } from "../lib/iso20022/index.mjs";
import { maskAccount } from "./parse.mjs";
import { isActive, isEffectiveOn, isPreferred, normaliseAsset, normaliseBic, safeRecord, } from "./rules.mjs";
const SEVERITY = {
    MATCH: "ok",
    MATCH_AGENT_ONLY: "warn",
    ACCOUNT_MISMATCH: "fail",
    AGENT_MISMATCH: "fail",
    NOT_PREFERRED: "warn",
    AMBIGUOUS_SSI: "fail",
    NO_EFFECTIVE_SSI: "fail",
    NO_SSI: "fail",
    INCOMPLETE_ROUTE: "fail",
};
export class RouteError extends Error {
}
const text = (el) => el?.textContent?.trim() || undefined;
function child(el, ...path) {
    let cur = el ?? null;
    for (const name of path)
        cur = cur ? getFirstChildByLocalName(cur, name) : null;
    return cur;
}
function agentBic(el) {
    return text(child(el, "FinInstnId", "BICFI")) ?? text(child(el, "FinInstnId", "BIC"));
}
function accountId(el) {
    return text(child(el, "Id", "IBAN")) ?? text(child(el, "Id", "Othr", "Id"));
}
/** Extracts one settlement route per transaction from a pacs.008 or pacs.009. */
export function routesFromMessage(xml) {
    const parsed = parseXml(xml);
    if (!parsed.ok)
        throw new RouteError(`XML could not be parsed. ${parsed.error.detail ?? ""}`.trim());
    const kind = detectMessageKind(parsed.doc);
    if (kind !== "pacs.008" && kind !== "pacs.009") {
        throw new RouteError(`SSI checks read pacs.008 and pacs.009 messages; this is ${kind}. Pass the route fields directly instead.`);
    }
    const root = parsed.doc.documentElement;
    const txs = findDescendantsByLocalName(root, "CdtTrfTxInf");
    if (txs.length === 0)
        throw new RouteError("The message has no CdtTrfTxInf transaction.");
    const routes = txs.map((tx, i) => {
        const amount = child(tx, "IntrBkSttlmAmt");
        const base = {
            currency: amount?.getAttribute("Ccy") ?? undefined,
            value_date: text(child(tx, "IntrBkSttlmDt")),
            transaction: text(child(tx, "PmtId", "UETR")) ??
                text(child(tx, "PmtId", "EndToEndId")) ??
                `transaction ${i + 1}`,
        };
        if (kind === "pacs.008") {
            const intermediaries = ["IntrmyAgt3", "IntrmyAgt2", "IntrmyAgt1"].map((n) => agentBic(child(tx, n)));
            return {
                ...base,
                owner_bic: agentBic(child(tx, "CdtrAgt")),
                account_holder_bic: intermediaries.find(Boolean),
                account: accountId(child(tx, "CdtrAgtAcct")),
                asset_category: "COPA",
            };
        }
        return {
            ...base,
            owner_bic: agentBic(child(tx, "Cdtr")),
            account_holder_bic: agentBic(child(tx, "CdtrAgt")),
            account: accountId(child(tx, "CdtrAcct")),
            asset_category: "CASH",
        };
    });
    return { kind, routes };
}
/** BIC8 and its primary-office BIC11 (XXX) are the same institution. */
const sameBic = (a, b) => {
    const [x, y] = [normaliseBic(a ?? ""), normaliseBic(b ?? "")];
    if (!x || !y)
        return false;
    const expand = (v) => (v.length === 8 ? `${v}XXX` : v);
    return expand(x) === expand(y);
};
function sameAccount(expected, actual) {
    const [e, a] = [
        expected.replace(/\s+/g, "").toUpperCase(),
        actual.replace(/\s+/g, "").toUpperCase(),
    ];
    if (e.includes("****") || a.includes("****")) {
        const last4 = (v) => v.replace(/\D/g, "").slice(-4);
        return last4(e) !== "" && last4(e) === last4(a) ? "last4" : false;
    }
    return e === a;
}
export function checkRoute(records, route, today) {
    const owner = normaliseBic(route.owner_bic ?? "");
    const currency = (route.currency ?? "").trim().toUpperCase();
    const asset = normaliseAsset(route.asset_category ?? "");
    const day = route.value_date ?? today;
    const actual = {
        transaction: route.transaction,
        owner_bic: owner || undefined,
        currency: currency || undefined,
        asset_category: asset || undefined,
        account_holder_bic: route.account_holder_bic
            ? normaliseBic(route.account_holder_bic)
            : undefined,
        account: route.account ? maskAccount(route.account) : undefined,
        value_date: day,
    };
    const result = (status, explanation, extra = {}) => ({
        status,
        outcome: SEVERITY[status],
        explanation,
        actual,
        ...extra,
    });
    if (!owner || !currency || !asset) {
        const missing = [
            !owner && "owner BIC",
            !currency && "currency",
            !asset && "asset category",
        ].filter(Boolean);
        return result("INCOMPLETE_ROUTE", `Cannot look up an SSI without the ${missing.join(", ")}.`);
    }
    const forOwner = records.filter((r) => sameBic(r.ownerBic, owner) && r.currency.trim().toUpperCase() === currency);
    const sameAsset = forOwner.filter((r) => {
        const a = normaliseAsset(r.assetCategory);
        return a === asset || a === "ANYY";
    });
    if (sameAsset.length === 0) {
        const otherAssets = [...new Set(forOwner.map((r) => normaliseAsset(r.assetCategory)))].filter(Boolean);
        return result("NO_SSI", otherAssets.length
            ? `No ${currency} ${asset} SSI for ${owner}. The file has ${currency} SSIs for ${owner} under ${otherAssets.join(", ")}; check the asset category.`
            : `No ${currency} SSI for ${owner} in the file.`);
    }
    const effective = sameAsset.filter((r) => isEffectiveOn(r, day));
    if (effective.length === 0) {
        const reasons = sameAsset.map((r) => ({
            ...safeRecord(r),
            reason: !isActive(r, day)
                ? "deleted, retired or stopped before the value date"
                : "starts after the value date",
        }));
        return result("NO_EFFECTIVE_SSI", `${owner} has ${currency} ${asset} SSIs, but none is effective on ${day}.`, {
            candidates: reasons.slice(0, 5),
        });
    }
    const preferred = effective.filter(isPreferred);
    const preferredHolders = new Set(preferred.map((r) => normaliseBic(r.accountHolderBic)));
    if (preferredHolders.size > 1) {
        return result("AMBIGUOUS_SSI", `The file marks ${preferredHolders.size} different correspondents as preferred for ${owner} ${currency} ${asset}. Fix the SSI file before relying on it.`, { candidates: preferred.slice(0, 5).map(safeRecord) });
    }
    const expected = preferred[0] ?? (effective.length === 1 ? effective[0] : undefined);
    const others = effective
        .filter((r) => r !== expected)
        .slice(0, 5)
        .map(safeRecord);
    if (!expected) {
        // Common in SWIFTRef data, where few SSIs carry a preferred flag: say whether the
        // payment's correspondent is at least one of the effective instructions.
        const used = actual.account_holder_bic ? normaliseBic(actual.account_holder_bic) : "";
        const listed = used && effective.some((r) => sameBic(r.accountHolderBic, used));
        const routeNote = !used
            ? ""
            : listed
                ? ` The payment's correspondent ${used} is one of them, so the route is valid but not confirmed as preferred.`
                : ` The payment's correspondent ${used} is not one of them.`;
        return result("AMBIGUOUS_SSI", `${effective.length} effective ${currency} ${asset} SSIs exist for ${owner} and none is marked preferred.${routeNote}`, { candidates: others, ...(used ? { payment_correspondent_listed: listed } : {}) });
    }
    const ownAccountAtOwner = sameBic(expected.accountHolderBic, owner) || !expected.accountHolderBic.trim();
    const holderMatches = actual.account_holder_bic
        ? sameBic(expected.accountHolderBic, actual.account_holder_bic)
        : ownAccountAtOwner;
    const extra = { expected: safeRecord(expected), other_effective_ssis: others };
    if (!holderMatches) {
        if (!actual.account_holder_bic) {
            return result("AGENT_MISMATCH", `The message names no correspondent, but the SSI says to pay ${owner} through ${normaliseBic(expected.accountHolderBic)}.`, extra);
        }
        const alternative = effective.find((r) => r !== expected && sameBic(r.accountHolderBic, actual.account_holder_bic));
        if (alternative) {
            return result("NOT_PREFERRED", `${actual.account_holder_bic} is an effective but non-preferred correspondent for ${owner}. The preferred one is ${normaliseBic(expected.accountHolderBic)}.`, extra);
        }
        return result("AGENT_MISMATCH", `The message routes through ${actual.account_holder_bic}, but the SSI says ${normaliseBic(expected.accountHolderBic)}.`, extra);
    }
    if (!route.account || !expected.account.trim()) {
        return result("MATCH_AGENT_ONLY", route.account
            ? "The correspondent matches. The SSI file has no account number to compare."
            : "The correspondent matches. The message carries no account at the correspondent, so the account was not checked.", extra);
    }
    const accountMatch = sameAccount(expected.account, route.account);
    if (!accountMatch) {
        return result("ACCOUNT_MISMATCH", `The correspondent matches, but the account ${maskAccount(route.account)} differs from the SSI account ${maskAccount(expected.account)}.`, extra);
    }
    return result("MATCH", accountMatch === "last4"
        ? "Correspondent matches and the account's last four digits match (one side is masked)."
        : "Correspondent and account match the preferred effective SSI.", extra);
}
