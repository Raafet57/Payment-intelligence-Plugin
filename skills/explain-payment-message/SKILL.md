---
name: explain-payment-message
description: Explain an ISO 20022 payment message (pacs.002, pacs.004, pacs.008, pacs.009, camt.052, camt.053, camt.054) in plain language for an operator, analyst or business user. Use when the user shares or points to a pacs/camt XML file and asks what it says, who paid whom, why it was rejected or returned, or wants a summary.
---

# Explain a payment message

1. **Prefer the file path.** If the message is in a file, call `explain_payment_message` with `path` rather than reading the file yourself. If the data looks real (names, IBANs, addresses), don't paste it back into the chat.
2. Call `explain_payment_message` with `xml` only when the user has already pasted the message.
3. Present the result in this order:
   - **One-line verdict** from `operatorSummary.lines`: message type, amount and currency, outcome.
   - **What happened**: use `narrative` for pacs.008, pacs.009 and camt.053. For the other types (`support: "structured"`), describe the key rows of `summaryMarkdown` in prose.
   - **Things to check**: every entry in `insights`, `warn` severity first.
4. If the message contains a status or reason code (for example `RJCT`, `AC01`, `MD07`), call `decode_reason_code` and explain what it means and the usual next step.
5. If `support` is `"unsupported"`, say which message type was detected and that the tool does not cover it yet. Don't guess at the contents.

## Boundaries

- Explain what the message says, not whether the payment settled. These tools have no live tracking, gpi or reachability data.
- Don't invent fields that aren't in the output.
