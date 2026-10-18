// Generated from plugins/payment-intelligence/server/src/mcp.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Minimal MCP server over stdio: newline-delimited JSON-RPC 2.0 with the
 * `initialize`, `ping`, `tools/list` and `tools/call` methods. Written by hand
 * so the plugin ships readable code with no runtime dependencies.
 */
import { createInterface } from "node:readline";
import { validateArgs } from "./definitions.mjs";
import { ToolInputError } from "./tools.mjs";
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const PARSE_ERROR = -32700;
export function createHandler(info, tools) {
    const byName = new Map(tools.map((t) => [t.name, t]));
    function callTool(params) {
        const definition = byName.get(String(params.name));
        if (!definition) {
            return { error: { code: INVALID_PARAMS, message: `Unknown tool: ${String(params.name)}` } };
        }
        const args = params.arguments ?? {};
        try {
            validateArgs(definition.inputSchema, args);
            const output = definition.handler(args);
            return { result: { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] } };
        }
        catch (err) {
            const message = err instanceof ToolInputError
                ? err.message
                : `Internal error in ${definition.name}: ${err instanceof Error ? err.message : String(err)}`;
            if (!(err instanceof ToolInputError))
                console.error(err);
            return { result: { isError: true, content: [{ type: "text", text: message }] } };
        }
    }
    /** Returns the reply for a request, or undefined for a notification. */
    return function handle(request) {
        const params = request.params ?? {};
        switch (request.method) {
            case "initialize": {
                const requested = String(params.protocolVersion ?? "");
                return {
                    result: {
                        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
                            ? requested
                            : SUPPORTED_PROTOCOL_VERSIONS[0],
                        capabilities: { tools: {} },
                        serverInfo: info,
                    },
                };
            }
            case "ping":
                return { result: {} };
            case "tools/list":
                return {
                    result: {
                        tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({
                            name,
                            title,
                            description,
                            inputSchema,
                            annotations,
                        })),
                    },
                };
            case "tools/call":
                return callTool(params);
            default:
                if (request.id === undefined)
                    return undefined; // notifications need no reply
                return {
                    error: { code: METHOD_NOT_FOUND, message: `Method not found: ${request.method}` },
                };
        }
    };
}
export function serveStdio(info, tools) {
    const handle = createHandler(info, tools);
    const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
    createInterface({ input: process.stdin }).on("line", (line) => {
        if (!line.trim())
            return;
        let request;
        try {
            request = JSON.parse(line);
        }
        catch {
            send({ jsonrpc: "2.0", id: null, error: { code: PARSE_ERROR, message: "Parse error" } });
            return;
        }
        const reply = handle(request);
        if (reply && request.id !== undefined)
            send({ jsonrpc: "2.0", id: request.id, ...reply });
    });
}
