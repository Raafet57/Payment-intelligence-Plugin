# Changelog

## 0.3.1 (2026-10-22)

- camt.111 answer details: `explain_payment_message` returns what the responder sent back in `case.details`: booking confirmation (amount, value date, account, references), payment status, field amendments, compensation, value date adjustment, debit authorisation and narrative, each tied to the request item it answers.
- Older ISO E&I messages: camt.026 (unable to apply, with its justification codes), camt.027 (claim non-receipt), camt.028 (additional payment information) and camt.087 (request to modify payment, with the fields it asks to change) are explained and join the payment's timeline. A camt.028 joins the case it answers by case id.
- Swift Tracker alerts (trck.003): the alert status (INVA, RJIN, RJCR, WARN), the message it concerns and the payment's UETR, on the payment's timeline. No case state is kept.
- Embedded MT 199: for a camt.110 delivered with an MT 199 copy, `case.embeddedMt` shows the MT fields and lists the camt.110 values the copy leaves out, from the translation report and by comparing values.
- Eight new synthetic samples, checked against the Swift usage-guideline or ISO schemas where one is available (trck.003 is not schema-checked). Not a certified validator of any of these messages.
- trck.005 (Tracker investigation status notification) is not covered yet (schema not public).

## 0.3.0 (2026-10-22)

- Case management (exceptions and investigations): `explain_payment_message` reads camt.110 InvestigationRequest, camt.111 InvestigationResponse, camt.056 cancellation requests and camt.029 resolutions, and returns a `case` field with the case id (the EIR for camt.110/111, Case/Id for camt.056/029), investigation type, follow-up action, status, reason, parties and the underlying payment's UETR and references. Files where the AppHdr and Document are two top-level elements, as Swift delivers them, are read too.
- `analyze_payment_lifecycle` threads case messages with the payment they quote, links a camt.111 to its camt.110 by EIR, so investigations and cancellations show on the payment's timeline, and warns when a request has no answer in the files supplied.
- `decode_reason_code` covers the case status and reason codes used in these flows (for example CNCL, RJCR, PDCR, CLSD, CACR, UTAP, CCNR, DUPL, NOAS, NOOR).
- Four synthetic case samples that follow the sample pacs.008 payment (camt.110.001.01, camt.111.001.02, camt.056.001.08, camt.029.001.09), and an investigations section in the `triage-payment-exception` skill.
- The pacs.008 samples' instruction id is now 13 characters, within the CBPR+ limit of 16.

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
