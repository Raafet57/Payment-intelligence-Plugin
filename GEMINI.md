# Payment Intelligence

This extension adds offline ISO 20022 payment tools (the `payment-intelligence` MCP server) and skills for
explaining, scrubbing and triaging pacs/camt messages, checking SSIs, and validating IBANs and BICs.

- The extension ships no licensed reference data (no SwiftRef, BIC Directory or SSI data). It works on the
  user's own files, read locally: SWIFTRef BIC Directory and Payments Directory folders, legacy SWIFTRef
  products (BIC Plus, IBAN Plus, SSI Plus, ...) and CSV/TSV exports from any other provider or in-house system.
- Pass payment, SSI and reference files to the tools by path (`path`, `ssi_path`, `reference_path`)
  instead of reading them into the conversation. To share a payment file, scrub it file-to-file with
  `scrub_payment_message`. Use `lookup_reference_data` to look up BICs, national IDs and LEIs.
- Never print full account numbers. The tools mask them; keep them masked in your answers.
- Without the user's reference files, the tools check format and consistency only. A directory record does
  not prove reachability for a specific payment, and there is no live payment tracking.
