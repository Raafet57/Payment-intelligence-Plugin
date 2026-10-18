// Generated from src/lib/cbpr/parse.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
export const CBPR_XML_SIZE_LIMIT_CHARS = 1_000_000;
/** Parse XML using the browser DOMParser and reject constructs this tool does not need. */
export function parseCbprXml(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        return {
            ok: false,
            id: "empty-input",
            title: "No XML to inspect",
            detail: "Paste a CBPR+ XML message to run local readiness checks.",
        };
    }
    if (input.length > CBPR_XML_SIZE_LIMIT_CHARS) {
        return {
            ok: false,
            id: "size-limit",
            title: "XML is too large for this browser-side checker",
            detail: `Input is ${input.length.toLocaleString()} characters; the local safety limit is ${CBPR_XML_SIZE_LIMIT_CHARS.toLocaleString()} characters.`,
        };
    }
    if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(trimmed)) {
        return {
            ok: false,
            id: "unsafe-xml",
            title: "DTD/entity declarations are not accepted",
            detail: "This checker only needs ordinary ISO 20022 elements. Remove DOCTYPE or ENTITY declarations before running local readiness checks.",
        };
    }
    const parsed = new DOMParser().parseFromString(trimmed, "application/xml");
    const parseError = findFirstElement(parsed, ["parsererror"]);
    if (parseError) {
        return {
            ok: false,
            id: "malformed-xml",
            title: "XML is not well formed",
            detail: collapseWhitespace(parseError.textContent ?? "The browser XML parser reported an error."),
        };
    }
    return { ok: true, document: parsed };
}
export function localNameOf(element) {
    return element.localName || element.nodeName.replace(/^.*:/, "");
}
export function findFirstElement(root, localNames) {
    const wanted = new Set(localNames.map((name) => name.toLowerCase()));
    if (root instanceof Element && wanted.has(localNameOf(root).toLowerCase())) {
        return root;
    }
    for (const element of Array.from(root.getElementsByTagName("*"))) {
        if (wanted.has(localNameOf(element).toLowerCase()))
            return element;
    }
    return undefined;
}
export function findElements(root, localNames) {
    const wanted = new Set(localNames.map((name) => name.toLowerCase()));
    const matches = [];
    if (root instanceof Element && wanted.has(localNameOf(root).toLowerCase())) {
        matches.push(root);
    }
    for (const element of Array.from(root.getElementsByTagName("*"))) {
        if (wanted.has(localNameOf(element).toLowerCase()))
            matches.push(element);
    }
    return matches;
}
export function firstText(root, localNames) {
    if (!root)
        return undefined;
    const element = findFirstElement(root, localNames);
    const value = collapseWhitespace(element?.textContent ?? "");
    return value || undefined;
}
export function childElement(root, localName) {
    if (!root)
        return undefined;
    for (const child of Array.from(root.children)) {
        if (localNameOf(child).toLowerCase() === localName.toLowerCase())
            return child;
    }
    return undefined;
}
export function uniqueElementTexts(root, localNames) {
    const seen = new Set();
    const values = [];
    for (const element of findElements(root, localNames)) {
        const value = collapseWhitespace(element.textContent ?? "");
        if (!value || seen.has(value))
            continue;
        seen.add(value);
        values.push(value);
    }
    return values;
}
function collapseWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
