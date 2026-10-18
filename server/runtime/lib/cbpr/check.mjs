// Generated from src/lib/cbpr/check.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
import { analyzeIban } from "../iban/index.mjs";
import { extractMessageId, findCbprSchemaProfiles, getCbprSchemaManifestMeta, isCbprMessageIdSupported, } from "./manifest.mjs";
import { childElement, findFirstElement, firstText, parseCbprXml, uniqueElementTexts, } from "./parse.mjs";
const UETR_V4_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIC_SYNTAX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/;
const BIC_INSTITUTION = /^[A-Z]{4}$/;
const BIC_COUNTRY = /^[A-Z]{2}$/;
const BIC_LOCATION = /^[A-Z0-9]{2}$/;
const BIC_BRANCH = /^[A-Z0-9]{3}$/;
function finding(id, severity, title, detail, subject) {
    const item = { id, severity, title, detail };
    if (subject)
        item.subject = subject;
    return item;
}
function normalizeBicCandidate(value) {
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
function bicSyntaxIssue(value) {
    const normalized = normalizeBicCandidate(value);
    if (!BIC_SYNTAX.test(normalized)) {
        return "BIC must be BIC8 or BIC11 with a four-letter institution, two-letter country, two alphanumeric location characters, and optional three-character branch.";
    }
    const institution = normalized.slice(0, 4);
    const country = normalized.slice(4, 6);
    const location = normalized.slice(6, 8);
    const branch = normalized.slice(8);
    if (!BIC_INSTITUTION.test(institution))
        return "Institution code must be four letters.";
    if (!BIC_COUNTRY.test(country))
        return "Country position must be two letters.";
    if (!BIC_LOCATION.test(location))
        return "Location code must be two alphanumeric characters.";
    if (branch && !BIC_BRANCH.test(branch))
        return "Branch code must be three alphanumeric characters when present.";
    return undefined;
}
function computeReadiness(findings) {
    if (findings.some((item) => item.severity === "error"))
        return "not-ready";
    if (findings.some((item) => item.severity === "warning"))
        return "review";
    return "ready";
}
function collectDetectedFacts(document) {
    const appHdr = findFirstElement(document, ["AppHdr", "BusinessApplicationHeader"]);
    const documentElement = findFirstElement(document, ["Document"]);
    const msgDefIdr = firstText(appHdr, ["MsgDefIdr"]);
    const messageId = extractMessageId(documentElement?.namespaceURI ?? undefined);
    const detected = {
        appHdrPresent: Boolean(appHdr),
        documentPresent: Boolean(documentElement),
    };
    if (appHdr?.namespaceURI)
        detected.appHdrNamespace = appHdr.namespaceURI;
    if (documentElement?.namespaceURI)
        detected.documentNamespace = documentElement.namespaceURI;
    if (msgDefIdr)
        detected.msgDefIdr = msgDefIdr;
    if (messageId)
        detected.messageId = messageId;
    const bizSvc = firstText(appHdr, ["BizSvc"]);
    const bizMsgIdr = firstText(appHdr, ["BizMsgIdr"]);
    const creDt = firstText(appHdr, ["CreDt"]);
    if (bizSvc)
        detected.bizSvc = bizSvc;
    if (bizMsgIdr)
        detected.bizMsgIdr = bizMsgIdr;
    if (creDt)
        detected.creDt = creDt;
    const fromBic = firstText(childElement(appHdr, "Fr"), ["BICFI", "BIC"]);
    const toBic = firstText(childElement(appHdr, "To"), ["BICFI", "BIC"]);
    if (fromBic)
        detected.fromBic = normalizeBicCandidate(fromBic);
    if (toBic)
        detected.toBic = normalizeBicCandidate(toBic);
    if (messageId) {
        const profileCount = findCbprSchemaProfiles(messageId).length;
        if (profileCount > 0)
            detected.schemaProfileCount = profileCount;
    }
    return detected;
}
/**
 * Run local CBPR+ readiness checks. This is a browser-side structure helper,
 * not a certified XSD validator and not a MyStandards usage-rule engine.
 */
export function checkCbprReadiness(xml) {
    const findings = [];
    const stats = {
        bicCount: 0,
        bicIssueCount: 0,
        ibanCount: 0,
        ibanIssueCount: 0,
        uetrCount: 0,
        uetrIssueCount: 0,
    };
    const meta = getCbprSchemaManifestMeta();
    const parsed = parseCbprXml(xml);
    if (!parsed.ok) {
        findings.push(finding(parsed.id, "error", parsed.title, parsed.detail));
        return {
            readiness: "not-ready",
            detected: { appHdrPresent: false, documentPresent: false },
            findings,
            stats,
            meta,
        };
    }
    findings.push(finding("well-formed-xml", "info", "XML is well formed", "The browser XML parser accepted the message. Deeper checks are local readiness checks only."));
    const document = parsed.document;
    const appHdr = findFirstElement(document, ["AppHdr", "BusinessApplicationHeader"]);
    const messageDocument = findFirstElement(document, ["Document"]);
    const detected = collectDetectedFacts(document);
    if (!appHdr) {
        findings.push(finding("apphdr-missing", "error", "Business Application Header not found", "CBPR+ messages are expected to include an AppHdr / Business Application Header before the ISO 20022 Document."));
    }
    else {
        findings.push(finding("apphdr-present", "info", "Business Application Header present", detected.appHdrNamespace
            ? `Found AppHdr namespace ${detected.appHdrNamespace}.`
            : "Found AppHdr by local element name."));
    }
    if (!detected.msgDefIdr) {
        findings.push(finding("msgdefidr-missing", "error", "MsgDefIdr is missing from AppHdr", "The header should identify the ISO 20022 message definition, for example pacs.008.001.08."));
    }
    else {
        findings.push(finding("msgdefidr-present", "info", "MsgDefIdr present", `Header declares ${detected.msgDefIdr}.`, detected.msgDefIdr));
    }
    if (!detected.bizSvc) {
        findings.push(finding("bizsvc-missing", "warning", "BizSvc is not present", "CBPR+ flows commonly carry a business service marker in AppHdr. Review against your channel/profile requirements."));
    }
    if (!detected.creDt) {
        findings.push(finding("credt-missing", "warning", "CreDt is not present", "Creation date/time was not found in AppHdr. Review timestamp requirements for the target profile."));
    }
    if (!messageDocument) {
        findings.push(finding("document-missing", "error", "ISO 20022 Document not found", "The checker could not find a Document element to identify the MX message body."));
    }
    else if (!detected.messageId) {
        findings.push(finding("document-message-id-missing", "error", "Document namespace does not expose a message id", detected.documentNamespace
            ? `Document namespace is ${detected.documentNamespace}; expected an ISO 20022 message id such as pacs.008.001.08.`
            : "Document namespace is empty; expected an ISO 20022 namespace."));
    }
    else if (isCbprMessageIdSupported(detected.messageId)) {
        const profiles = findCbprSchemaProfiles(detected.messageId);
        findings.push(finding("document-message-supported", "info", "Document message is covered by bundled manifest", `${detected.messageId} maps to ${profiles.length} ${profiles.length === 1 ? "schema profile" : "schema profiles"} in ${meta.releaseLabel}.`, detected.messageId));
    }
    else {
        findings.push(finding("document-message-unsupported", "warning", "Document message is outside the bundled manifest", `${detected.messageId} was detected, but it is not in the committed ${meta.releaseLabel} schema manifest. This may be a non-CBPR+ message or a release/profile not bundled here.`, detected.messageId));
    }
    const headerMessageId = extractMessageId(detected.msgDefIdr);
    if (headerMessageId && detected.messageId && headerMessageId !== detected.messageId) {
        findings.push(finding("apphdr-document-mismatch", "error", "AppHdr MsgDefIdr and Document namespace disagree", `Header declares ${headerMessageId}, while Document namespace indicates ${detected.messageId}.`));
    }
    const uetrValues = uniqueElementTexts(document, ["UETR"]);
    stats.uetrCount = uetrValues.length;
    for (const [index, value] of uetrValues.entries()) {
        if (UETR_V4_SHAPE.test(value)) {
            findings.push(finding(`uetr-shape-ok-${index + 1}`, "info", "UETR shape OK", "UETR follows UUID version-4 shape.", value));
        }
        else {
            stats.uetrIssueCount += 1;
            findings.push(finding(`uetr-shape-issue-${index + 1}`, "warning", "UETR shape issue", "UETR should use UUID version-4 shape. Review the value before sending onward.", value));
        }
    }
    const bicValues = uniqueElementTexts(document, ["BICFI", "BIC"]);
    stats.bicCount = bicValues.length;
    for (const [index, value] of bicValues.entries()) {
        const normalized = normalizeBicCandidate(value);
        const issue = bicSyntaxIssue(value);
        if (!issue) {
            findings.push(finding(`bic-syntax-ok-${index + 1}`, "info", "BIC syntax OK", "BIC shape is structurally consistent with ISO 9362. This is not a live existence, reachability, or bank-directory check.", normalized));
        }
        else {
            stats.bicIssueCount += 1;
            findings.push(finding(`bic-syntax-issue-${index + 1}`, "warning", "BIC syntax issue", `${issue} No live existence, reachability, or bank-directory check is performed.`, normalized || value));
        }
    }
    const ibanValues = uniqueElementTexts(document, ["IBAN"]);
    stats.ibanCount = ibanValues.length;
    for (const [index, value] of ibanValues.entries()) {
        const result = analyzeIban(value);
        if (result.verdict === "valid") {
            findings.push(finding(`iban-checksum-ok-${index + 1}`, "info", "IBAN syntax/checksum OK", "IBAN country structure and ISO 13616 MOD-97 checksum pass against the bundled registry-derived data. This is not VOP, name matching, or account-owner confirmation.", result.pretty || result.normalized));
        }
        else {
            stats.ibanIssueCount += 1;
            const failed = result.checks.find((check) => check.status === "fail");
            findings.push(finding(`iban-checksum-issue-${index + 1}`, "warning", "IBAN syntax/checksum issue", `${failed?.detail ?? "IBAN checks need review."} This is not VOP, name matching, or account-owner confirmation.`, result.pretty || result.normalized || value));
        }
    }
    if (stats.bicCount === 0) {
        findings.push(finding("bic-none-found", "info", "No BIC fields found", "No BICFI/BIC elements were detected in this message body or header."));
    }
    if (stats.ibanCount === 0) {
        findings.push(finding("iban-none-found", "info", "No IBAN fields found", "No IBAN elements were detected. That can be expected for many CBPR+ message types."));
    }
    return {
        readiness: computeReadiness(findings),
        detected,
        findings,
        stats,
        meta,
    };
}
export function findingsBySeverity(result) {
    return {
        error: result.findings.filter((item) => item.severity === "error"),
        warning: result.findings.filter((item) => item.severity === "warning"),
        info: result.findings.filter((item) => item.severity === "info"),
    };
}
