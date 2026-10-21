# Privacy policy: Payment Intelligence plugin

_Last updated: 2026-10-18_

The Payment Intelligence plugin runs entirely on your own computer.

## What it collects

Nothing. The plugin has no account, no analytics, no telemetry and no crash reporting. It never sends payment data, file contents, file names or usage information to its author or anyone else.

## Network access

None. The bundled MCP server (`server/runtime/`) makes no network requests. Its built-in public format data (the IBAN registry snapshot, the ISO country list used for BIC checks, the CBPR+ schema manifest and the reason-code list) is bundled inside the plugin.

## Reference data

The plugin provides no licensed reference data (no SwiftRef, BIC Directory or SSI data). It reads reference files you already hold, such as your SSI file or your BIC Directory and Payments Directory downloads, only when you point a tool at them (or set `PAYMENT_INTELLIGENCE_REFERENCE_PATH`). It returns only the records that match your request, never copies a file, and never sends anything anywhere.

## Files

- The tools read only the files you or your AI assistant name in a tool call: payment messages up to 2 MB each, SSI files up to 200 MB.
- Only `scrub_payment_message` writes anything: the scrubbed copy, to the `output_path` you give. It refuses to overwrite an existing file and never changes the original.

## Your AI assistant

Tool results return to your AI assistant (for example Claude or Codex) like any other tool output, and its provider handles them under the terms of your plan with that provider. The SSI tools mask every account number before returning results. To keep raw payment data out of the conversation, use the scrubber's file-to-file mode (`path` plus `output_path`). It returns only masked statistics.

## Contact

Questions: open an issue at https://github.com/Raafet57/payment-intelligence-plugin/issues.
