# Changelog

## 0.1.1 (2026-10-21)

- `check_bic`: the country check now reads "GB is a recognised ISO 3166 country code." instead of referring to a bundled demo snapshot. The plugin bundles no BIC directory data.
- The `pacs004-return-ac06.xml` sample now gives "Blocked account" as its additional information, matching the ISO meaning of AC06 (closed account is AC04).
- The Cursor manifest (`.cursor-plugin/plugin.json`) now sets `logo` to the plugin icon for the Cursor Marketplace.

## 0.1.0 (2026-10-21)

- Offline MCP tools (explain, scrub, CBPR+ readiness, lifecycle, reason codes, IBAN validate and build, BIC check) and skills (explain a message, scrub before sharing, triage an exception, check identifiers).
- Readable, dependency-free runtime: a small hand-written MCP server plus per-file JavaScript generated from the browser suite's sources, with a vendored `@xmldom/xmldom` 0.9.12.
- The scrubber also masks structured remittance (document numbers, creditor references, invoicer and invoicee names) and free-text `AddtlRmtInf`, `AddtlNtryInf` and `AddtlTxInf`.
- BIC checks are syntax and country code only; no bank directory data is bundled.
- SSI checks: `validate_ssi_file` (rules ported from SSI Control Tower, plus a preferred-correspondent conflict check) and `check_payment_against_ssi` (pacs.008/pacs.009 against the user's own SSI file), with the `check-ssi` skill and synthetic SSI samples.
- `claude plugin eval` suite with mocked tools, plus sample messages.
