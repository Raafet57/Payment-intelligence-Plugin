# Sample messages

Synthetic ISO 20022 messages for trying the plugin. Every name, address and reference is invented. The IBANs and BICs are the standard examples used in public documentation.

| File                                          | Message                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pacs008-serial-credit-transfer.xml`          | Customer credit transfer (pacs.008)                                                                                                               |
| `pacs008-customer-credit-transfer.xml`        | Customer credit transfer with full party details, for trying the scrubber                                                                         |
| `pacs002-reject-md07.xml`                     | Status report rejecting a payment, reason MD07 (pacs.002)                                                                                         |
| `pacs004-return-ac06.xml`                     | Payment return, reason AC06 (pacs.004)                                                                                                            |
| `camt053-multi-entry-statement.xml`           | Bank statement with several entries (camt.053)                                                                                                    |
| `ssi-swiftref-ssiplus-v3.tsv`                 | Synthetic SSI file in the SWIFTRef SSI Plus V3 layout (60 instructions, masked accounts), from SSI Control Tower                                  |
| `ssi-export-with-errors.csv`                  | Synthetic SSI spreadsheet export with planted errors (bad BIC, duplicates, stale confirmations, reversed dates), from SSI Control Tower           |
| `pacs008-gbp-to-atlas-via-correspondent.xml`  | pacs.008 that pays through the correspondent named in the SSI file                                                                                |
| `pacs009-eur-to-nova-wrong-correspondent.xml` | pacs.009 that uses a different correspondent from the SSI file                                                                                    |
| `camt110-investigation-request-utap.xml`      | Investigation request (camt.110.001.01, unable to apply): the creditor's bank cannot apply the pacs.008 sample payment                            |
| `camt111-investigation-response-cacr.xml`     | Investigation response (camt.111.001.02): closed, reason CACR (a cancellation request was sent)                                                   |
| `camt056-cancellation-request-dupl.xml`       | Cancellation request (camt.056.001.08) for the pacs.008 sample payment, reason DUPL                                                               |
| `camt029-cancellation-accepted.xml`           | Resolution of investigation (camt.029.001.09) accepting that cancellation, CNCL                                                                   |
| `camt110-delivered-with-mt199.xml`            | The same camt.110 as Swift delivers it to the responder: header and Document side by side, with an MT 199 copy and translation report in comments |
| `trck003-tracker-alert-inva.xml`              | Swift Tracker alert (trck.003.001.02): a first camt.056 for the payment was not accepted (INVA)                                                   |
| `trck005-case-status-asgn.xml`                | Swift case status (trck.005.001.02): Case Orchestrator assigned the camt.110 to the responder (ASGN)                                              |
| `camt110-investigation-request-ccnr.xml`      | Investigation request (camt.110.001.01, claim non-receipt) for `pacs008-gbp-to-atlas-via-correspondent.xml`                                       |
| `camt111-investigation-response-booking.xml`  | Investigation response (camt.111.001.02): closed with a booking confirmation (credited amount and value date)                                     |
| `camt087-request-to-modify.xml`               | Older request to modify payment (camt.087.001.09) for `pacs009-eur-to-nova-wrong-correspondent.xml`: change the creditor account                  |
| `camt027-claim-non-receipt.xml`               | Older claim non-receipt (camt.027.001.10) for the same pacs.009                                                                                   |
| `camt026-unable-to-apply-in14.xml`            | Older unable to apply (camt.026.001.10), reason IN14 (incorrect creditor account)                                                                 |
| `camt028-additional-information.xml`          | Older additional payment information (camt.028.001.12) answering that camt.026 with the account                                                   |

Three case stories, each on a sample payment. Pass a payment and its case files to `analyze_payment_lifecycle` to see them on one timeline.

- **Unable to apply, then cancellation** (`pacs008-serial-credit-transfer.xml`): `camt110-investigation-request-utap.xml` as the creditor's bank sends it, `camt110-delivered-with-mt199.xml` as the debtor's bank receives it, `trck005-case-status-asgn.xml`, `trck003-tracker-alert-inva.xml`, `camt111-investigation-response-cacr.xml`, `camt056-cancellation-request-dupl.xml` and `camt029-cancellation-accepted.xml`.
- **Claim non-receipt** (`pacs008-gbp-to-atlas-via-correspondent.xml`): `camt110-investigation-request-ccnr.xml` and `camt111-investigation-response-booking.xml`.
- **Older bank-to-bank messages** (`pacs009-eur-to-nova-wrong-correspondent.xml`): `camt087-request-to-modify.xml`, `camt027-claim-non-receipt.xml`, `camt026-unable-to-apply-in14.xml` and `camt028-additional-information.xml`.

The camt.110, camt.111, camt.056 and camt.029 samples are addressed the way Swift Case Management expects: through the Case Orchestrator (`TRCKCHZZXXX`, Swift's own service address), with the camt.110 and camt.111 under the matching `swift.case` business service. Their business application header carries the creation time. A camt.111 does not repeat the payment and joins it through the camt.110's EIR.

How the samples were checked, with xmllint:

- camt.110 and camt.111 Documents against the SwiftCase SR2025 usage-guideline schemas (UTAP and CCNR/CONR), and against the base ISO schemas.
- camt.056 and camt.029 against the CBPR+ SR2026 usage-guideline schemas.
- camt.026, camt.027, camt.028 and camt.087 against the base ISO schemas (camt.026.001.10, camt.027.001.10, camt.028.001.12, camt.087.001.09).
- trck.003 and trck.005 are Swift-only messages with no schema to check against here. They follow Swift's trck.003.001.02 usage guideline and the Swift schema structure published in the open-source Prowide ISO 20022 library.
- The delivered camt.110 has two top-level elements, as Swift delivers it, so it is not one well-formed XML document. `explain_payment_message` and `analyze_payment_lifecycle` read it; `scrub_payment_message` does not.
