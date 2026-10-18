---
name: check-payment-identifiers
description: Validate or build IBANs and check BIC syntax offline. Use when the user asks whether an IBAN or BIC is valid, wants to build an IBAN from bank and account numbers, needs the check digits, or wants a country's IBAN format.
---

# Check payment identifiers

## IBAN

- To **validate**, call `validate_iban`. Report the `verdict`, then any failed `checks` in plain words (wrong length, bad check digits, unknown country, BBAN format). Show the `pretty` form.
- To **build**, call `build_iban` with `country_code` only. The response lists the template fields. Ask the user for any values you don't have, then call again with `fields`. Return `pretty` and `electronic`.
- To show **a country's format**, call `build_iban` without `fields` and describe `template.fields`.

## BIC

- Call `check_bic`. Report the syntax and country-code results, and whether it is a primary office, test or passive BIC.
- **Always pass on the caveat:** no bank directory is bundled. A well-formed BIC may not exist, belong to the bank the user expects, or be reachable.

## Boundaries

- A valid IBAN only means the structure and check digits are correct. It doesn't confirm that the account exists or who holds it (that needs Verification of Payee or Confirmation of Payee).
- Registry data comes from a bundled SWIFT IBAN Registry snapshot. `registry` in the result gives its date.
