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
