---
name: check-ssi
description: Validate standing settlement instructions (SSIs) and check payments against the user's own SSI file. Use when the user asks to validate, clean up or review an SSI file (SWIFTRef SSI Plus, CSV or Excel export), or asks whether a payment, pacs.008 or pacs.009 uses the right correspondent, account or settlement route for a beneficiary bank.
---

# Check SSIs

Both tools read the user's SSI file locally. **Pass it as `ssi_path` and do not open it yourself.** It holds account numbers, and the tools mask them in every result.

## Validate an SSI file

1. Call `validate_ssi_file` with `ssi_path`. Pass `as_of` only if the user asks about a specific date.
2. Report:
   - the format detected and how many records and active records it has;
   - `summary`, critical and high first, with counts;
   - a handful of `findings` with their line numbers and record keys so the user can find them;
   - `columns_ignored`, if a column the user expects to be checked is listed there.
3. Explain conflicts in plain words: two preferred correspondents for the same owner, currency and asset category means payments cannot be routed unambiguously; overlapping active instructions mean a superseded SSI was never closed.
4. Say what was not checked (`not_checked`): it checks format and consistency, not whether a BIC or account exists.

## Check a payment against the SSI file

1. Call `check_payment_against_ssi` with `ssi_path` and the message as `path` (pacs.008 or pacs.009). Without a message, pass `owner_bic`, `currency`, `asset_category`, `account_holder_bic` and `account`.
2. If the payment is for something other than a commercial payment (pacs.008) or bank-to-bank cash (pacs.009), such as an FX settlement, pass the right `asset_category` (for example FOEX or TREA). Say which one you used.
3. Per transaction, lead with the status:
   - `MATCH`: correspondent and account agree with the preferred SSI.
   - `MATCH_AGENT_ONLY`: correspondent agrees; the account could not be compared.
   - `AGENT_MISMATCH` or `ACCOUNT_MISMATCH`: name the expected correspondent or masked account next to what the payment uses, and recommend holding the payment until it is repaired or confirmed with the beneficiary bank.
   - `NOT_PREFERRED`: the route is valid but not the preferred one.
   - `AMBIGUOUS_SSI`, `NO_EFFECTIVE_SSI`, `NO_SSI`: the SSI file itself needs attention. Suggest running `validate_ssi_file`.
4. State the assumptions the tool reports (which message fields were used).

## Boundaries

- The result is only as good as the user's SSI file. It does not replace confirming changed SSIs with the counterparty through an authenticated channel.
- Never print full account numbers, even if the user pastes them.
