#!/usr/bin/env node
// Generated from plugins/payment-intelligence/server/src/index.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Entry point of the Payment Intelligence MCP server (stdio).
 *
 * Exposes the browser suite's ISO 20022 / IBAN / BIC libraries as local,
 * offline tools. `build.mjs` turns this source into the readable, dependency-
 * free `runtime/` folder that the plugin runs with plain `node`.
 */
import "./dom-shim.mjs";
import manifest from "./plugin-info.json" with { type: "json" };
import { TOOLS } from "./definitions.mjs";
import { serveStdio } from "./mcp.mjs";
serveStdio({ name: "payment-intelligence", version: manifest.version }, TOOLS);
