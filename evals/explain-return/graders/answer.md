---
type: llm
---

The message is a pacs.004 payment return of 25,000.00 USD with reason code AC06 (blocked account). Its free text also says "Blocked account". Settlement date, settlement method and agents shown in the message are facts from the message, not inventions.

PASS if the reply (1) says the payment was returned, (2) names AC06 and explains it in plain words (blocked account), and (3) gives at least one concrete next step, such as checking with the beneficiary or the correspondent before resending.
FAIL if it calls the message a rejection or a new credit transfer, leaves out the reason code, or claims live tracking or confirmation of funds that the message does not contain.
