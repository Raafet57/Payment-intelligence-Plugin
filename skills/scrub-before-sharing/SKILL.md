---
name: scrub-before-sharing
description: Pseudonymise ISO 20022 pacs/camt payment files before they are shared with a vendor, a colleague, a support ticket or an AI tool. Use when the user wants to anonymise, mask, redact, sanitise or scrub payment XML, or is about to share real payment data.
---

# Scrub payment data before sharing

The goal is for the **original data never to enter the conversation**.

1. Ask for the file path if you don't have it. **Do not open or read the original file.**
2. Pick an output path next to the original, such as `<name>.scrubbed.xml`. It must not already exist.
3. Call `scrub_payment_message` with `path` and `output_path`. Add `options` only if the user asks:
   - `preserveRemittance: true` keeps remittance text (it is masked by default).
   - `shiftDates: true` with `dateOffsetDays` moves dates.
   - `maskFiOtherIds: true` also masks proprietary FI ids.
4. Report back from the tool result only:
   - where the scrubbed file was written (`writtenTo`);
   - the per-type counts in `stats`;
   - a few `mapping` rows as examples. They hold masked previews, never originals.
5. Remind the user to spot-check the scrubbed file before sharing it. Scrubbing covers known party, account, identifier and reference fields, and free text in unexpected places can survive.

If the user pastes raw XML instead, call the tool with `xml` and return the scrubbed `output`. Suggest the file workflow next time.

## Boundaries

- The output is pseudonymised, not anonymised. If the recipient is outside the organisation, the user's data-protection rules still apply.
- Never overwrite the original. The tool refuses to, so don't try to work around it.
