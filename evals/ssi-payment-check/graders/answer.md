---
type: llm
---

PASS if the reply says the payment does NOT match the SSI file, names the correspondent the SSI expects (HOLDGB2LXXX) alongside the one the payment uses (HOLDDEFFXXX), and recommends holding or repairing the payment (or confirming with the beneficiary bank) before release.
FAIL if it says the payment matches, omits either correspondent, or tells the user to release it as is.
