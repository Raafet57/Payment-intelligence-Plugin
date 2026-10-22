# Payment Intelligence: ISO 20022 tools for AI assistants

Offline ISO 20022 tools for payment operations, investigations and migration teams, packaged for Claude Code, OpenAI Codex, GitHub Copilot, VS Code, Gemini CLI, Cursor and any MCP client. It is built on the same libraries as the Payment Intelligence Modules browser suite.

**Nothing leaves your machine.** The plugin runs a local MCP server over stdio. It makes no network calls, sends no telemetry and has no account. It only reads files you name, and writes only the scrubbed copy you ask for.

**We don't provide reference data. The plugin works on your own.** No SwiftRef, BIC Directory or SSI data is shipped, sold or downloaded. Your institution already licenses that data; the tools read the files you point them at, on your machine: your own reference files, your own SSI file and your own payment messages. It is provider-agnostic:

- **SWIFTRef, current format:** unzipped BIC Directory and Payments Directory folders (IDENTIFIERS including historical, PARTICIPANTS and RELATIONSHIPS files; layouts are read from the STRUCTURES file in the same download).
- **SWIFTRef, legacy products:** BIC Plus, BIC Directory 2018, Bank Directory Plus, IBAN Plus, SEPA routing, Reach Plus, gpi, and SSI Plus.
- **Any other provider or in-house system:** CSV/TSV exports. Common column names are recognised automatically, `column_map` covers any other layout, and any column it cannot map is listed in the result, so there is no lock-in to one data vendor.

The only data built in is public format rules: the SWIFT IBAN Registry structures, ISO country and currency codes, and a short list of ISO status and reason codes.

## What you can ask

- "Explain this pacs.008 / pacs.004 / camt.053."
- "Scrub `payments/batch-0412.xml` before I send it to the vendor."
- "Why was this payment returned? Here are the pacs.008, pacs.002 and pacs.004."
- "Here is the camt.110 we received and the original pacs.008. What are they asking, and has it been answered?"
- "What did the responder confirm in this camt.111?" or "What do these Tracker notifications say about our case?"
- "Is `DE89 3704 0044 0532 0130 00` a valid IBAN?" or "Build a French IBAN from these bank and account numbers."
- "Is this message CBPR+ ready?"
- "Validate our SSI file `ssi/master.tsv`." or "Does this pacs.009 pay Nova through the correspondent in our SSI file?"
- "Look up `DEUTDEFF` in our BIC Directory at `~/swiftref/2026-02`." or "Which BIC does sort code 400501 route to?"
- "Check this pacs.009 against the SSIs in our Payments Directory RELATIONSHIPS file."

## Components

| Type     | Name                        | What it does                                                                                                                                                                                                                                |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP tool | `explain_payment_message`   | Narrative for pacs.008, pacs.009 and camt.053, field projection for pacs.002, pacs.004, camt.052/054 and case messages (camt.110/111, camt.056/029, the older camt.026/027/028/087, trck.003 and trck.005 Tracker messages), plus insights. |
| MCP tool | `scrub_payment_message`     | Consistent pseudonyms for parties, IBANs, accounts, UETRs and references. File-to-file mode keeps originals out of chat.                                                                                                                    |
| MCP tool | `check_cbpr_readiness`      | AppHdr/Document namespace, schema-profile coverage, UETR, BIC and IBAN hints.                                                                                                                                                               |
| MCP tool | `analyze_payment_lifecycle` | Groups ACK/NACK, pacs and camt files into threads with a timeline and warnings. Investigations and cancellations join the payment they quote.                                                                                               |
| MCP tool | `decode_reason_code`        | Plain-language meaning of status and reason codes (RJCT, AC01, MD07, …).                                                                                                                                                                    |
| MCP tool | `validate_iban`             | Country, length, BBAN structure and MOD-97 checks against a bundled SWIFT IBAN Registry snapshot.                                                                                                                                           |
| MCP tool | `build_iban`                | Builds an IBAN from BBAN fields and computes check digits.                                                                                                                                                                                  |
| MCP tool | `check_bic`                 | ISO 9362 syntax and ISO 3166 country-code checks. With your reference files, also looks the BIC up: name, location, current or expired.                                                                                                     |
| MCP tool | `lookup_reference_data`     | Looks up BICs, national clearing codes and LEIs in your own reference files: records, successors, linked national IDs, service participation.                                                                                               |
| MCP tool | `validate_ssi_file`         | Checks an SSI file (SWIFTRef SSI Plus V3, Payments Directory RELATIONSHIPS, CSV or TSV): formats, required fields, dates, staleness, conflicts.                                                                                             |
| MCP tool | `check_payment_against_ssi` | Checks a pacs.008 or pacs.009 (or explicit route) against the preferred, effective SSI in the user's own file.                                                                                                                              |
| Skill    | `explain-payment-message`   | How to present a message to an operator.                                                                                                                                                                                                    |
| Skill    | `scrub-before-sharing`      | File-to-file scrubbing workflow that never reads the original.                                                                                                                                                                              |
| Skill    | `triage-payment-exception`  | Timeline, root cause, repair and open questions for a failed payment, including its investigation and cancellation cases.                                                                                                                   |
| Skill    | `check-payment-identifiers` | IBAN and BIC checks with the right caveats.                                                                                                                                                                                                 |
| Skill    | `check-ssi`                 | Validates SSI files and checks payments against them, never opening the file itself.                                                                                                                                                        |

The SSI and reference tools read your files locally, return only the records that match your request, and mask every account number they return.

To avoid naming your reference folder in every request, set `PAYMENT_INTELLIGENCE_REFERENCE_PATH` to it in the shell you start your agent from (for example `export PAYMENT_INTELLIGENCE_REFERENCE_PATH=~/swiftref/latest`).

Only `scrub_payment_message` writes anything. It writes the scrubbed file to the `output_path` you give, refuses to overwrite an existing file, and never touches the original.

## Limits (read before relying on it)

- **CBPR+ checks are readiness hints.** They are not MyStandards usage-rule validation.
- **No BIC directory is bundled.** Without your reference files, BIC checks are syntax and country code only. With them, a current directory record still does not prove the institution can be reached for a given payment: service participation, routing and bilateral relationships are separate checks. Never use either alone for routing or compliance decisions.
- **Use full reference files.** Monthly delta files list only changes, so a lookup in a delta file alone is incomplete. The tools say when a file is a delta. IBAN Plus is used to link national IDs to BICs; IBANs themselves are still validated against the public IBAN Registry structures only.
- **A valid IBAN doesn't mean the account exists.** There is no Verification of Payee or account-holder matching.
- **No live tracking.** Lifecycle analysis covers only the files you supply. There is no gpi, scheme or settlement lookup.
- **Case messages are read, not managed.** camt.110, camt.111, camt.056, camt.029, the older camt.026, camt.027, camt.028 and camt.087, and Swift Tracker messages (trck.003 alerts, trck.005 case status) are explained and threaded from your files. The plugin is not connected to Swift Case Management, keeps no case state, and does not draft, answer or close a case. It projects their fields for triage and does not validate them against usage-guideline rules; MT 199 copies are read, not translated.
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
| **Any MCP client**          | Run `npx -y payment-intelligence-mcp@0.3.2` as a stdio MCP server (skills are not included this way)                                           |

Then start a new session and try one of the requests above. To try it without your own data, use the sample messages in [`samples/`](./samples).

## How it is built

`server/runtime/` is plain, readable JavaScript with no dependencies and no install step. Every agent runs it with `node`. Each file is generated from the TypeScript sources of the Payment Intelligence Modules browser suite, so the plugin and the web app share one copy of the payment logic, and each file names the source it came from.

- The libraries were written for the browser. `runtime/dom-shim.mjs` gives them a `DOMParser` in Node, using an unmodified vendored copy of [`@xmldom/xmldom`](./server/runtime/vendor/xmldom) (MIT).
- `runtime/mcp.mjs` is a small hand-written MCP server over stdio. It handles `initialize`, `tools/list` and `tools/call`, and checks every tool call against the tool's input schema.
- [`evals/`](./evals) holds a `claude plugin eval` suite (Claude Code's eval runner). It checks that the skills trigger, that the right tools are called (scrubbing never reads the original file), and that unrelated requests leave the plugin alone.

## License

MIT. See [LICENSE](./LICENSE).
