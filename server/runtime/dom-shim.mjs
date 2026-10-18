// Generated from plugins/payment-intelligence/server/src/dom-shim.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Minimal browser-DOM shim so the browser-only `src/lib` modules run in Node.
 *
 * The libraries call `new DOMParser()`, `new XMLSerializer()`, `instanceof
 * Element`, `element.children` and `element.firstElementChild`, and detect
 * parse failures by looking for a `<parsererror>` element (browser / jsdom
 * behaviour). `@xmldom/xmldom` covers the parser and serializer but throws on
 * malformed input and has no `children` / `firstElementChild`, so this module
 * fills exactly those gaps and nothing more.
 *
 * xmldom never fetches external entities or DTDs, so parsing stays local.
 */
import { DOMParser as XmldomParser, Document as XmldomDocument, Element as XmldomElement, Node as XmldomNode, XMLSerializer as XmldomSerializer, } from "./vendor/xmldom/index.js";
const ELEMENT_NODE = 1;
function elementChildren(node) {
    const out = [];
    const nodes = node.childNodes;
    for (let i = 0; i < nodes.length; i++) {
        const child = nodes[i];
        if (child && child.nodeType === ELEMENT_NODE)
            out.push(child);
    }
    return out;
}
/** Array snapshot with the `item()` method callers expect from HTMLCollection. */
function asCollection(items) {
    return Object.assign(items, { item: (i) => items[i] ?? null });
}
function defineGetter(proto, name, get) {
    if (Object.getOwnPropertyDescriptor(proto, name))
        return;
    Object.defineProperty(proto, name, { configurable: true, get });
}
for (const proto of [XmldomElement.prototype, XmldomDocument.prototype]) {
    defineGetter(proto, "children", function () {
        return asCollection(elementChildren(this));
    });
    defineGetter(proto, "firstElementChild", function () {
        return elementChildren(this)[0] ?? null;
    });
}
class ShimDOMParser {
    parseFromString(text, mimeType) {
        let firstError;
        const parser = new XmldomParser({
            onError: (level, message) => {
                if (level !== "warning" && firstError === undefined)
                    firstError = message;
                if (level === "fatalError")
                    throw new Error(message);
            },
        });
        let doc;
        try {
            doc = parser.parseFromString(text, mimeType);
        }
        catch (err) {
            firstError ??= err instanceof Error ? err.message : String(err);
        }
        if (firstError === undefined && doc?.documentElement)
            return doc;
        // Mirror browsers: return a document whose root is <parsererror>.
        return new XmldomParser().parseFromString(`<parsererror>${escapeXml(firstError ?? "XML could not be parsed.")}</parsererror>`, "application/xml");
    }
}
function escapeXml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const g = globalThis;
g.DOMParser ??= ShimDOMParser;
g.XMLSerializer ??= XmldomSerializer;
g.Element ??= XmldomElement;
g.Node ??= XmldomNode;
g.Document ??= XmldomDocument;
g.XMLDocument ??= XmldomDocument;
