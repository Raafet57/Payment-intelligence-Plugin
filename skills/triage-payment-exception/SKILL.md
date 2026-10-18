---
name: triage-payment-exception
description: Triage a rejected, returned or stuck cross-border payment from its ISO 20022 messages (pacs.008 plus pacs.002 status reports, pacs.004 returns, camt.05x reports). Use when the user asks why a payment failed, bounced or was returned, wants a payment timeline, or needs to draft an investigation or repair action.
---

# Triage a payment exception

1. Collect every related file the user has: the original pacs.008 or pacs.009, any pacs.002, pacs.004 and camt.052/053/054 messages, and ACK/NACK files. Ask for a folder or list of paths.
2. Call `analyze_payment_lifecycle` with `paths`. It groups files into threads by UETR, EndToEndId and TxId, and builds a timeline with warnings.
3. For the failing message, call `explain_payment_message` to get the details. Call `decode_reason_code` for every status or reason code in it.
4. Write the triage as:
   - **Timeline**: what was sent, acknowledged, rejected or returned, and when.
   - **Root cause**: the decoded reason code plus the field that most likely triggered it. For an account or IBAN issue, call `validate_iban`. For an agent issue, call `check_bic`.
   - **Repair**: the correction to make, and whether to resend, recall or ask for information.
   - **Open questions**: anything the files can't answer, such as intermediary status or funds location.
5. If threads don't link up (warnings about missing identifiers), say so. Don't merge them by guesswork.

## Boundaries

- Base the triage on the files supplied only. There is no live tracker, gpi or scheme lookup behind these tools.
- The reason code list is a curated subset, not the full ISO External Code Set. If a code isn't found, say so.
