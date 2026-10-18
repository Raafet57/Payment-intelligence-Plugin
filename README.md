# Payment Intelligence: ISO 20022 tools for AI assistants

Offline ISO 20022 tools for payment operations, investigations and migration teams, packaged for Claude Code, OpenAI Codex, GitHub Copilot, VS Code, Gemini CLI, Cursor and any MCP client. It is built on the same libraries as the Payment Intelligence Modules browser suite.

**Nothing leaves your machine.** The plugin runs a local MCP server over stdio. It makes no network calls, sends no telemetry and has no account. It only reads files you name, and writes only the scrubbed copy you ask for.

## What you can ask

- "Explain this pacs.008 / pacs.004 / camt.053."
- "Scrub `payments/batch-0412.xml` before I send it to the vendor."
- "Why was this payment returned? Here are the pacs.008, pacs.002 and pacs.004."
- "Is `DE89 3704 0044 0532 0130 00` a valid IBAN?" or "Build a French IBAN from these bank and account numbers."
- "Is this message CBPR+ ready?"
- "Validate our SSI file `ssi/master.tsv`." or "Does this pacs.009 pay Nova through the correspondent in our SSI file?"

## Components

| Type     | Name                        | What it does                                                                                                                                   |
| -------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP tool | `explain_payment_message`   | Narrative for pacs.008, pacs.009 and camt.053, field projection for pacs.002, pacs.004 and camt.052/054, plus insights.                        |
| MCP tool | `scrub_payment_message`     | Consistent pseudonyms for parties, IBANs, accounts, UETRs and references. File-to-file mode keeps originals out of chat.                       |
| MCP tool | `check_cbpr_readiness`      | AppHdr/Document namespace, schema-profile coverage, UETR, BIC and IBAN hints.                                                                  |
| MCP tool | `analyze_payment_lifecycle` | Groups ACK/NACK, pacs and camt files into threads with a timeline and warnings.                                                                |
| MCP tool | `decode_reason_code`        | Plain-language meaning of status and reason codes (RJCT, AC01, MD07, …).                                                                       |
| MCP tool | `validate_iban`             | Country, length, BBAN structure and MOD-97 checks against a bundled SWIFT IBAN Registry snapshot.                                              |
| MCP tool | `build_iban`                | Builds an IBAN from BBAN fields and computes check digits.                                                                                     |
| MCP tool | `check_bic`                 | ISO 9362 syntax and ISO 3166 country-code checks. No bank directory data is bundled.                                                           |
| MCP tool | `validate_ssi_file`         | Checks an SSI file (SWIFTRef SSI Plus V3, CSV or TSV): formats, required fields, dates, staleness and conflicts. Rules from SSI Control Tower. |
| MCP tool | `check_payment_against_ssi` | Checks a pacs.008 or pacs.009 (or explicit route) against the preferred, effective SSI in the user's own file.                                 |
| Skill    | `explain-payment-message`   | How to present a message to an operator.                                                                                                       |
| Skill    | `scrub-before-sharing`      | File-to-file scrubbing workflow that never reads the original.                                                                                 |
| Skill    | `triage-payment-exception`  | Timeline, root cause, repair and open questions for a failed payment.                                                                          |
| Skill    | `check-payment-identifiers` | IBAN and BIC checks with the right caveats.                                                                                                    |
| Skill    | `check-ssi`                 | Validates SSI files and checks payments against them, never opening the file itself.                                                           |

The SSI tools read your SSI file locally and mask every account number they return.

Only `scrub_payment_message` writes anything. It writes the scrubbed file to the `output_path` you give, refuses to overwrite an existing file, and never touches the original.

## Limits (read before relying on it)

- **Not a certified validator.** CBPR+ checks are readiness hints, not MyStandards usage-rule validation.
- **No BIC directory.** BIC checks are syntax and country code only. Never use them for routing, reachability or compliance decisions.
- **A valid IBAN doesn't mean the account exists.** There is no Verification of Payee or account-holder matching.
- **No live tracking.** Lifecycle analysis covers only the files you supply. There is no gpi, scheme or settlement lookup.
- **Pseudonymised, not anonymised.** Scrubbed output may still count as personal data under GDPR and similar laws. Spot-check it before sharing.
- The reason-code list is a curated subset of the ISO External Code Set.
- **SSI checks are only as good as your SSI file.** They test format and consistency, not whether a BIC or account exists, and do not replace confirming SSI changes with the counterparty.

## Install

Requires Node.js 20.10 or later. Each agent reads its own manifest from this repository.

| Agent                       | Install                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude Code**             | `/plugin marketplace add Raafet57/payment-intelligence-plugin`, then `/plugin install payment-intelligence@payment-intelligence`               |
| **OpenAI Codex** (CLI, IDE) | `codex plugin marketplace add Raafet57/payment-intelligence-plugin`, then `codex plugin add payment-intelligence@payment-intelligence`         |
| **GitHub Copilot CLI**      | `copilot plugin marketplace add Raafet57/payment-intelligence-plugin`, then `copilot plugin install payment-intelligence@payment-intelligence` |
| **VS Code** (agent plugins) | Add the same repository as a plugin marketplace in VS Code, or use the npm package below as an MCP server                                      |
| **Gemini CLI**              | `gemini extensions install https://github.com/Raafet57/payment-intelligence-plugin`                                                            |
| **Cursor**                  | Cursor Marketplace (once listed), or the npm package below as an MCP server                                                                    |
| **Any MCP client**          | Run `npx -y payment-intelligence-mcp@0.1.0` as a stdio MCP server (skills are not included this way)                                           |

Then start a new session and try one of the requests above. To try it without your own data, use the sample messages in [`samples/`](./samples).

## How it is built

`server/runtime/` is plain, readable JavaScript with no dependencies and no install step. Every agent runs it with `node`. Each file is generated from the TypeScript sources of the Payment Intelligence Modules browser suite, so the plugin and the web app share one copy of the payment logic, and each file names the source it came from.

- The libraries were written for the browser. `runtime/dom-shim.mjs` gives them a `DOMParser` in Node, using an unmodified vendored copy of [`@xmldom/xmldom`](./server/runtime/vendor/xmldom) (MIT).
- `runtime/mcp.mjs` is a small hand-written MCP server over stdio. It handles `initialize`, `tools/list` and `tools/call`, and checks every tool call against the tool's input schema.
- [`evals/`](./evals) holds a `claude plugin eval` suite (Claude Code's eval runner). It checks that the skills trigger, that the right tools are called (scrubbing never reads the original file), and that unrelated requests leave the plugin alone.

## License

MIT. See [LICENSE](./LICENSE).
