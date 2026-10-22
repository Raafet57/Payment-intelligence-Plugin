# Sample messages

Synthetic ISO 20022 messages for trying the plugin. Every name, address and reference is invented. The IBANs and BICs are the standard examples used in public documentation.

| File                                          | Message                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pacs008-serial-credit-transfer.xml`          | Customer credit transfer (pacs.008)                                                                                                     |
| `pacs008-customer-credit-transfer.xml`        | Customer credit transfer with full party details, for trying the scrubber                                                               |
| `pacs002-reject-md07.xml`                     | Status report rejecting a payment, reason MD07 (pacs.002)                                                                               |
| `pacs004-return-ac06.xml`                     | Payment return, reason AC06 (pacs.004)                                                                                                  |
| `camt053-multi-entry-statement.xml`           | Bank statement with several entries (camt.053)                                                                                          |
| `ssi-swiftref-ssiplus-v3.tsv`                 | Synthetic SSI file in the SWIFTRef SSI Plus V3 layout (60 instructions, masked accounts), from SSI Control Tower                        |
| `ssi-export-with-errors.csv`                  | Synthetic SSI spreadsheet export with planted errors (bad BIC, duplicates, stale confirmations, reversed dates), from SSI Control Tower |
| `pacs008-gbp-to-atlas-via-correspondent.xml`  | pacs.008 that pays through the correspondent named in the SSI file                                                                      |
| `pacs009-eur-to-nova-wrong-correspondent.xml` | pacs.009 that uses a different correspondent from the SSI file                                                                          |
| `camt110-investigation-request-utap.xml`      | Investigation request (camt.110.001.01, unable to apply): the creditor's bank cannot apply the pacs.008 sample payment                  |
| `camt111-investigation-response-cacr.xml`     | Investigation response (camt.111.001.02): closed, reason CACR (a cancellation request was sent)                                         |
| `camt056-cancellation-request-dupl.xml`       | Cancellation request (camt.056.001.08) for the pacs.008 sample payment, reason DUPL                                                     |
| `camt029-cancellation-accepted.xml`           | Resolution of investigation (camt.029.001.09) accepting that cancellation, CNCL                                                         |

The four case messages follow the pacs.008 in `pacs008-serial-credit-transfer.xml`. Pass all five to `analyze_payment_lifecycle` to see the investigation and the cancellation on the payment's timeline. They are addressed the way Swift Case Management expects: through the Case Orchestrator (`TRCKCHZZXXX`, Swift's own service address), with the camt.110 and camt.111 under the `swift.case.utap` business service. Each case sample's Document was checked against the matching Swift usage-guideline schema (SwiftCase SR2025 UTAP for camt.110/111, CBPR+ SR2026 for camt.056/029). The camt.110 and camt.111 come wrapped with their business application header, which carries the creation time; the camt.111 does not repeat the payment and joins it through the camt.110's EIR.
