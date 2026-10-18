---
expect:
  ssi_path: string
---

{
  "source": "{{input.ssi_path}}",
  "format": "CSV",
  "as_of": "2026-10-18",
  "records": 25,
  "active_records": 24,
  "records_with_issues": 12,
  "columns_recognised": [
    "recordKey",
    "ownerBic",
    "ownerName",
    "ownerCountry",
    "ownerId",
    "market",
    "currency",
    "assetCategory",
    "accountHolderBic",
    "account",
    "startDate",
    "stopDate",
    "status",
    "lastConfirmed"
  ],
  "columns_ignored": [
    "Account Name",
    "Fund Code",
    "Base Currency",
    "Country",
    "PSET BIC",
    "Depository",
    "Global Custodian BIC",
    "Intermediary BIC",
    "Securities Account",
    "Cash Account",
    "Payment System",
    "Settlement Method",
    "Owner Email",
    "Owner Team",
    "Source System",
    "Source Trust Level",
    "Approval Status",
    "Risk Rating"
  ],
  "summary": [
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "count": 9,
      "message": "Active instruction intervals overlap within the same operational group."
    },
    {
      "rule_id": "SSI.STALE.12M",
      "severity": "high",
      "count": 4,
      "message": "Last confirmation is older than 365 days."
    },
    {
      "rule_id": "ssi.account_holder_bic.format",
      "severity": "high",
      "count": 1,
      "message": "Account-holder BIC is missing or malformed."
    },
    {
      "rule_id": "ssi.lifecycle.date_range",
      "severity": "high",
      "count": 1,
      "message": "Instruction stop date must not be earlier than start date."
    }
  ],
  "findings": [
    {
      "rule_id": "SSI.STALE.12M",
      "severity": "high",
      "line": 2,
      "record_key": "SSI-001",
      "field": "lastConfirmed",
      "value": "2024-01-10",
      "message": "Last confirmation is older than 365 days.",
      "fix": "Reconfirm the SSI with the counterparty and record the evidence."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 2,
      "record_key": "SSI-001",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.account_holder_bic.format",
      "severity": "high",
      "line": 3,
      "record_key": "SSI-002",
      "field": "accountHolderBic",
      "value": "BADBIC",
      "message": "Account-holder BIC is missing or malformed.",
      "fix": "Provide a valid 8 or 11 character BIC."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 4,
      "record_key": "SSI-003",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 5,
      "record_key": "SSI-004",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 6,
      "record_key": "SSI-005",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "SSI.STALE.12M",
      "severity": "high",
      "line": 7,
      "record_key": "SSI-006",
      "field": "lastConfirmed",
      "value": "2024-03-01",
      "message": "Last confirmation is older than 365 days.",
      "fix": "Reconfirm the SSI with the counterparty and record the evidence."
    },
    {
      "rule_id": "SSI.STALE.12M",
      "severity": "high",
      "line": 8,
      "record_key": "SSI-007",
      "field": "lastConfirmed",
      "value": "2024-04-01",
      "message": "Last confirmation is older than 365 days.",
      "fix": "Reconfirm the SSI with the counterparty and record the evidence."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 8,
      "record_key": "SSI-007",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "SSI.STALE.12M",
      "severity": "high",
      "line": 9,
      "record_key": "SSI-008",
      "field": "lastConfirmed",
      "value": "2024-05-01",
      "message": "Last confirmation is older than 365 days.",
      "fix": "Reconfirm the SSI with the counterparty and record the evidence."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 9,
      "record_key": "SSI-008",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.lifecycle.date_range",
      "severity": "high",
      "line": 14,
      "record_key": "SSI-013",
      "field": "stopDate",
      "value": "2026-01-01",
      "message": "Instruction stop date must not be earlier than start date.",
      "fix": "Correct the instruction lifecycle dates."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 20,
      "record_key": "SSI-019",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 21,
      "record_key": "SSI-020",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    },
    {
      "rule_id": "ssi.conflict.active_interval_overlap",
      "severity": "high",
      "line": 24,
      "record_key": "SSI-023",
      "field": "startDate",
      "message": "Active instruction intervals overlap within the same operational group.",
      "fix": "Adjust lifecycle dates or close the superseded instruction."
    }
  ],
  "findings_truncated": 0,
  "not_checked": "Rules ported from SSI Control Tower, minus its lineage, provider-conflict, entity-risk, licensing and export gates. Format and consistency only: this does not confirm that an institution, BIC or account exists. Account numbers are masked in all output."
}
