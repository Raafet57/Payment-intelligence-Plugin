---
description: A payment-vs-SSI question should use check_payment_against_ssi with the file path, report the mismatch and recommend holding the payment.
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

Before we release it, does payments/outbound/pacs009-nova-0042.xml pay Nova through the right correspondent according to our SSI file ssi/master-ssiplus.tsv?
