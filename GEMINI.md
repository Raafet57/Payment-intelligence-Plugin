# Payment Intelligence

This extension adds offline ISO 20022 payment tools (the `payment-intelligence` MCP server) and skills for
explaining, scrubbing and triaging pacs/camt messages, checking SSIs, and validating IBANs and BICs.

- The extension ships no licensed reference data (no SwiftRef, BIC Directory or SSI data). It works on the
  user's own files, such as their SSI file, read locally.
- Pass payment and SSI files to the tools by path (`path`, `ssi_path`) instead of reading them into
  the conversation. To share a payment file, scrub it file-to-file with `scrub_payment_message`.
- Never print full account numbers. The tools mask them; keep them masked in your answers.
- The tools check format and consistency only. They do not confirm that a BIC, IBAN or account exists,
  and there is no live payment tracking.
