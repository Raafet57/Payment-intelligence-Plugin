---
name: check-payment-identifiers
description: Validate or build IBANs, check BICs, and look up BICs, national clearing codes (sort codes, ABA, IFSC, ...) and LEIs in the user's own reference files, offline. Use when the user asks whether an IBAN or BIC is valid, which bank a BIC or clearing code belongs to, whether a BIC is still active or what replaced it, which BIC a national ID routes to, which payment services an institution participates in, wants to build an IBAN, needs the check digits, or wants a country's IBAN format.
---

# Check payment identifiers

## IBAN

- To **validate**, call `validate_iban`. Report the `verdict`, then any failed `checks` in plain words (wrong length, bad check digits, unknown country, BBAN format). Show the `pretty` form.
- To **build**, call `build_iban` with `country_code` only. The response lists the template fields. Ask the user for any values you don't have, then call again with `fields`. Return `pretty` and `electronic`.
- To show **a country's format**, call `build_iban` without `fields` and describe `template.fields`.

## BIC

- Call `check_bic`. Report the syntax and country-code results, and whether it is a primary office, test or passive BIC.
- If the user has reference files (they name a folder or file, or `PAYMENT_INTELLIGENCE_REFERENCE_PATH` is set), pass `reference_path`. Then report the directory result: institution name and town, whether the record is current or expired, and the successor BIC if there is one.
- **Always pass on the caveat:** no bank directory is bundled. Without the user's files, a well-formed BIC may not exist, belong to the bank the user expects, or be reachable. With them, a current record still does not prove reachability for a specific payment.

## Look up identifiers in the user's reference data

1. Call `lookup_reference_data` with `ids` (up to 50: BIC8, BIC11, sort codes, ABA, IFSC, CNAPS, LEIs) and `path`: an unzipped SWIFTRef BIC Directory or Payments Directory folder, one of its files, a legacy SWIFTRef product file (BIC Plus, BIC Directory 2018, Bank Directory Plus, IBAN Plus, Reach Plus, gpi), or a CSV/TSV export from any provider. **Do not open these files yourself**: they are licensed and large, and the tool returns only matching records.
2. Per identifier, report `identifiers` (name, town, country, current or expired, `historical` with `successor_id`), then `linked_identifiers` (national IDs that route to this BIC), `participations` (payment services, direct or indirect) and the `relationships` counts.
3. If a CSV's headers are not recognised, the tool says so: ask the user which column holds what and pass `column_map`.
4. Pass on any `notes`, especially when a file is a monthly delta (changes only) or a zip that needs unzipping.

## Boundaries

- A valid IBAN only means the structure and check digits are correct. It doesn't confirm that the account exists or who holds it (that needs Verification of Payee or Confirmation of Payee).
- Registry data comes from a bundled SWIFT IBAN Registry snapshot. `registry` in the result gives its date.
- Directory lookups are only as current as the user's files. Mention the file date when it matters.
