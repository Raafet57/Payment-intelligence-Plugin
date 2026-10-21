# Changelog

## 0.2.0 (2026-10-21)

- Bring your own reference data. New `lookup_reference_data` tool looks up BICs, national clearing codes and LEIs in the user's own files: SWIFTRef BIC Directory and Payments Directory folders (IDENTIFIERS including historical, PARTICIPANTS and RELATIONSHIPS; one common reader, with layouts from the STRUCTURES file), legacy SWIFTRef products (BIC Plus, BIC Directory 2018, Bank Directory Plus, IBAN Plus, SEPA routing, Reach Plus, gpi) and CSV/TSV exports from any provider, with `column_map` for unknown layouts. Large files are streamed, only matching records are returned, and account numbers are masked.
- `check_bic` takes an optional `reference_path` and reports the directory record (name, town, current or expired, successor) and service participation.
- The SSI tools read the SSI rows of a SWIFTRef Payments Directory RELATIONSHIPS file, and take `column_map` for any provider's layout (for example LexisNexis or in-house exports). More common SSI header names are recognised.
- `check_payment_against_ssi` now says, for `AMBIGUOUS_SSI`, whether the payment's correspondent is one of the effective SSIs.
- `PAYMENT_INTELLIGENCE_REFERENCE_PATH` sets a default reference folder or file.

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
