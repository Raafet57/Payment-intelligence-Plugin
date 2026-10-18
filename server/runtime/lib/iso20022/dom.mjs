// Generated from src/lib/iso20022/dom.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/** Parse XML using the platform DOMParser and surface parser errors as structured failures. */
export function parseXml(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return { ok: false, error: { message: "Input is empty." } };
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "application/xml");
    // jsdom + browsers expose <parsererror> elements when parsing fails.
    const parserError = doc.getElementsByTagName("parsererror")[0];
    if (parserError) {
        return {
            ok: false,
            error: {
                message: "XML could not be parsed.",
                detail: collapseWhitespace(parserError.textContent ?? ""),
            },
        };
    }
    if (!doc.documentElement) {
        return { ok: false, error: { message: "XML has no root element." } };
    }
    return { ok: true, doc };
}
export function serialize(doc) {
    return new XMLSerializer().serializeToString(doc);
}
export function getLocalName(node) {
    return node.localName ?? stripPrefix(node.nodeName);
}
function stripPrefix(name) {
    const idx = name.indexOf(":");
    return idx === -1 ? name : name.slice(idx + 1);
}
/** Iterate every Element under and including `root`, depth-first. */
export function walkElements(root, visit) {
    const stack = [{ el: root, ancestors: [] }];
    while (stack.length > 0) {
        const { el, ancestors } = stack.pop();
        visit(el, ancestors);
        const childAncestors = ancestors.concat(getLocalName(el));
        const children = el.children;
        // Iterate children in reverse so traversal order is left-to-right when popping.
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children.item(i);
            if (child)
                stack.push({ el: child, ancestors: childAncestors });
        }
    }
}
export function getChildrenByLocalName(parent, localName) {
    const out = [];
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        if (child && getLocalName(child) === localName)
            out.push(child);
    }
    return out;
}
export function getFirstChildByLocalName(parent, localName) {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        if (child && getLocalName(child) === localName)
            return child;
    }
    return null;
}
/** Return descendant elements with the given local name (depth-first, including self). */
export function findDescendantsByLocalName(root, localName) {
    const out = [];
    walkElements(root, (el) => {
        if (getLocalName(el) === localName)
            out.push(el);
    });
    return out;
}
/**
 * Replace the entire text content of `el` with the supplied string while preserving
 * the element identity (and therefore its namespaceURI, prefix and attributes).
 */
export function setTextContent(el, text) {
    // Remove all children, then set a single text node. Avoids stripping attributes.
    while (el.firstChild)
        el.removeChild(el.firstChild);
    if (text.length > 0) {
        el.appendChild(el.ownerDocument.createTextNode(text));
    }
}
/**
 * Create a sibling-style Element that inherits the namespace and (if any) prefix from a
 * template element. This is used when we need to add new leaves under a wrapper that uses
 * a default namespace or a prefixed namespace.
 */
export function createSiblingElement(template, localName, text) {
    const ns = template.namespaceURI;
    const prefix = template.prefix;
    const qualifiedName = prefix ? `${prefix}:${localName}` : localName;
    const doc = template.ownerDocument;
    const created = ns ? doc.createElementNS(ns, qualifiedName) : doc.createElement(qualifiedName);
    if (text !== undefined && text.length > 0) {
        created.appendChild(doc.createTextNode(text));
    }
    return created;
}
export function buildPath(ancestors, el) {
    return ancestors.concat(getLocalName(el)).join("/");
}
function collapseWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
