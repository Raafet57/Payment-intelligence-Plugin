---
name: triage-payment-exception
description: Triage a rejected, returned, stuck or disputed cross-border payment from its ISO 20022 messages (pacs.008 plus pacs.002 status reports, pacs.004 returns, camt.05x reports) and its case messages (camt.056 cancellation requests, camt.029 resolutions, camt.110 investigation requests, camt.111 investigation responses, the older camt.026, camt.027, camt.028 and camt.087, and Swift Tracker messages trck.003 and trck.005). Use when the user asks why a payment failed, bounced or was returned, wants a payment or case timeline, has an open investigation or cancellation case, or needs to decide on an investigation, recall or repair action.
---

# Triage a payment exception

1. Collect every related file the user has: the original pacs.008 or pacs.009, any pacs.002, pacs.004 and camt.052/053/054 messages, any case messages (camt.056, camt.029, camt.110, camt.111, camt.026, camt.027, camt.028, camt.087), Tracker messages (trck.003, trck.005), and ACK/NACK files. Ask for a folder or list of paths.
2. Call `analyze_payment_lifecycle` with `paths`. It groups files into threads by UETR, EndToEndId and TxId, and builds a timeline with warnings. Case messages join the thread of the payment they quote (its original UETR, end-to-end id or transaction id).
3. For the failing message, call `explain_payment_message` to get the details. Call `decode_reason_code` for every status or reason code in it.
4. Write the triage as:
   - **Timeline**: what was sent, acknowledged, rejected, returned, queried or cancelled, and when.
   - **Root cause**: the decoded reason code plus the field that most likely triggered it. For an account or IBAN issue, call `validate_iban`. For an agent issue, call `check_bic`.
   - **Repair**: the correction to make, and whether to resend, recall or ask for information.
   - **Open questions**: anything the files can't answer, such as intermediary status or funds location.
5. If threads don't link up (warnings about missing identifiers), say so. Don't merge them by guesswork.

## Investigations and cancellation cases

When the files include case messages, add a **Case** section to the triage:

1. For each case message, call `explain_payment_message`. Its `case` field gives the case id, who asked whom, the investigation type, any follow-up action, the status, the reason code, and the underlying payment references.
2. Know how the case is keyed:
   - camt.110 and camt.111 go through Swift's Case Orchestrator (BIC `TRCKCHZZ` in the header), never bank to bank. The case is the EIR (`caseId`); `requestorInvestigationId` is each side's own reference.
   - A camt.111 echoes the request but, under Swift's usage guidelines, not the payment. It links to its camt.110 by EIR, so ask for the camt.110 if the response stands alone.
   - Cancellations (Stop and Recall) are camt.056 answered by camt.029, keyed by `Case/Id`.
   - The older camt.026 (unable to apply), camt.027 (claim non-receipt) and camt.087 (request to modify) went bank to bank and are keyed by `Case/Id`; a camt.028 answers them with the missing or corrected payment details. Say when a case uses these, since Swift Case Management now runs investigations on camt.110 and camt.111.
3. Read the investigation type: UTAP (creditor cannot apply the funds), CCNR or CONR (creditor, or creditor agent for cover, says nothing arrived), RQFI (request for information, with a sub-type such as UTEX, SANC or a compliance code). A camt.110 with `requestedAction` is a follow-up on the same case: RQST is a reminder, RQCL asks to close it, RQOB objects to the answer.
4. Read the answer:
   - camt.111 status CLSD (closed), PDNG (pending, always with a reason) or RJCT (rejected, always with a reason). CACR means it was closed because a cancellation request was sent: look for the camt.056.
   - camt.029 status CNCL (cancelled, expect the funds back in a pacs.004), PDCR (pending) or RJCR (rejected, with a reason such as NOAS, NOOR, LEGL or ARDT).
   - The camt.111 `details` say what the responder found: a booking confirmation (amount, value date, account), a payment status, amendments to payment fields, compensation or a value date adjustment.
   - A trck.003 Tracker alert (INVA, RJIN, RJCR) means a case message was not accepted as sent. Look for the corrected resend after it.
   - A trck.005 case status from Case Orchestrator says where a request went: ASGN (assigned to the responder), DTRP (delivered), ARMD or ERMD (a reminder went out), OBJT (an objection went out). It joins the case by EIR. Treat it as a dated notification in the files, not as the case's current state.
   - Decode every code with `decode_reason_code`. If a code is not in the curated set, say so.
5. An `open-case` warning means a request has no answer in the files supplied. Say the case looks open from these files, not that it is open at the counterparty.
6. Check the underlying references against the payment in the thread: UETR first, then instruction id, end-to-end id, message id and amount. Flag a case that quotes a different amount, or a UETR that matches no payment you were given.
7. Suggest the next step the files support: wait for an answer, send a reminder, look for the pacs.004 after an accepted cancellation, or list the facts from the user's own records that an answer to an incoming investigation would need. Don't draft camt.110, camt.111, camt.056, camt.029, camt.026, camt.027, camt.028 or camt.087 messages or reply text. Preparing, approving and sending case messages happens in the user's own case system.

## Boundaries

- Base the triage on the files supplied only. There is no live tracker, gpi, Case Orchestrator or scheme lookup behind these tools, and they cannot open, update, answer or close a case anywhere.
- Case message support is a field projection for triage. It does not validate these messages against CBPR+, Swift Case Management or any usage-guideline rules.
- When a delivered camt.110 carries an MT 199 copy, the MT copy can leave out values (`case.embeddedMt.notCarried`). Point this out, but don't map an MT 199 reply back into a camt.111.
- The reason code list is a curated subset, not the full ISO External Code Set. If a code isn't found, say so.
