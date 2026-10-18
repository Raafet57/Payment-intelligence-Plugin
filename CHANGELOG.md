# Changelog

## 0.1.0 (unreleased)

- Offline MCP tools (explain, scrub, CBPR+ readiness, lifecycle, reason codes, IBAN validate and build, BIC check) and skills (explain a message, scrub before sharing, triage an exception, check identifiers).
- Readable, dependency-free runtime: a small hand-written MCP server plus per-file JavaScript generated from the browser suite's sources, with a vendored `@xmldom/xmldom` 0.9.12.
- The scrubber also masks structured remittance (document numbers, creditor references, invoicer and invoicee names) and free-text `AddtlRmtInf`, `AddtlNtryInf` and `AddtlTxInf`.
- BIC checks are syntax and country code only; no bank directory data is bundled.
- SSI checks: `validate_ssi_file` (rules ported from SSI Control Tower, plus a preferred-correspondent conflict check) and `check_payment_against_ssi` (pacs.008/pacs.009 against the user's own SSI file), with the `check-ssi` skill and synthetic SSI samples.
- `claude plugin eval` suite with mocked tools, plus sample messages.
