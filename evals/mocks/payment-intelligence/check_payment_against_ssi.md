---
expect:
  ssi_path: string
---

{
  "ssi_source": "{{input.ssi_path}}",
  "ssi_format": "SWIFTRef SSI Plus V3",
  "ssi_records": 60,
  "checked": "pacs.009",
  "results": [
    {
      "status": "AGENT_MISMATCH",
      "outcome": "fail",
      "explanation": "The message routes through HOLDDEFFXXX, but the SSI says HOLDGB2LXXX.",
      "actual": {
        "transaction": "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d",
        "owner_bic": "NOVAFRPPXXX",
        "currency": "EUR",
        "asset_category": "CASH",
        "account_holder_bic": "HOLDDEFFXXX",
        "account": "****9003",
        "value_date": "2026-10-16"
      },
      "expected": {
        "line": 4,
        "record_key": "SSI000000003",
        "owner_bic": "NOVAFRPPXXX",
        "owner_name": "Nova Synthetic Treasury Paris",
        "currency": "EUR",
        "asset_category": "CASH",
        "account_holder_bic": "HOLDGB2LXXX",
        "account_holder_name": "Synthetic London Correspondent CASH",
        "account": "ACCT-****-9003",
        "preferred": false,
        "start_date": "2025-01-01"
      },
      "other_effective_ssis": []
    }
  ],
  "assumptions": "pacs.009: owner = creditor FI, correspondent = creditor agent, account = CdtrAcct, asset category CASH unless overridden."
}
