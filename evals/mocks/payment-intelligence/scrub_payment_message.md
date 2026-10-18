---
expect:
  path: string
  output_path: string
---

{
  "source": "{{input.path}}",
  "kind": "pacs.008",
  "stats": {
    "name": {
      "unique": 2,
      "occurrences": 2
    },
    "address": {
      "unique": 4,
      "occurrences": 4
    },
    "iban": {
      "unique": 2,
      "occurrences": 2
    },
    "account": {
      "unique": 0,
      "occurrences": 0
    },
    "orgId": {
      "unique": 0,
      "occurrences": 0
    },
    "prvtId": {
      "unique": 0,
      "occurrences": 0
    },
    "fiOtherId": {
      "unique": 0,
      "occurrences": 0
    },
    "reference": {
      "unique": 2,
      "occurrences": 2
    },
    "uetr": {
      "unique": 1,
      "occurrences": 1
    },
    "msgId": {
      "unique": 1,
      "occurrences": 1
    },
    "remittance": {
      "unique": 1,
      "occurrences": 1
    },
    "contact": {
      "unique": 1,
      "occurrences": 1
    },
    "date": {
      "unique": 0,
      "occurrences": 0
    }
  },
  "mapping": [
    {
      "type": "msgId",
      "tag": "MsgId",
      "path": "Document/FIToFICstmrCdtTrf/GrpHdr/MsgId",
      "originalMasked": "TX********41 (16 chars)",
      "replacement": "MSGID-000001"
    },
    {
      "type": "reference",
      "tag": "InstrId",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/InstrId",
      "originalMasked": "TX********TR (22 chars)",
      "replacement": "INSTRI-000001"
    },
    {
      "type": "reference",
      "tag": "EndToEndId",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/EndToEndId",
      "originalMasked": "IN********26 (13 chars)",
      "replacement": "ENDTOE-000002"
    },
    {
      "type": "uetr",
      "tag": "UETR",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/PmtId/UETR",
      "originalMasked": "7a********01 (36 chars)",
      "replacement": "db7ec560-3f92-4994-a3e6-0d08c77a91bc"
    },
    {
      "type": "name",
      "tag": "Nm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Dbtr/Nm",
      "originalMasked": "Ok********bH (22 chars)",
      "replacement": "Person A"
    },
    {
      "type": "address",
      "tag": "StrtNm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Dbtr/PstlAdr/StrtNm",
      "originalMasked": "Ma********91 (23 chars)",
      "replacement": "1 Sample Street"
    },
    {
      "type": "address",
      "tag": "TwnNm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Dbtr/PstlAdr/TwnNm",
      "originalMasked": "Fr********in (17 chars)",
      "replacement": "Sample City 2"
    },
    {
      "type": "contact",
      "tag": "EmailAdr",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Dbtr/CtctDtls/EmailAdr",
      "originalMasked": "tr********le (34 chars)",
      "replacement": "person1@example.invalid"
    },
    {
      "type": "iban",
      "tag": "IBAN",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/DbtrAcct/Id/IBAN",
      "originalMasked": "DE********00 (22 chars)",
      "replacement": "DE57000000000000058598"
    },
    {
      "type": "name",
      "tag": "Nm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Cdtr/Nm",
      "originalMasked": "Me********td (20 chars)",
      "replacement": "Person B"
    },
    {
      "type": "address",
      "tag": "StrtNm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Cdtr/PstlAdr/StrtNm",
      "originalMasked": "14********ap (12 chars)",
      "replacement": "3 Sample Street"
    },
    {
      "type": "address",
      "tag": "TwnNm",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/Cdtr/PstlAdr/TwnNm",
      "originalMasked": "L****n",
      "replacement": "Sample City 4"
    },
    {
      "type": "iban",
      "tag": "IBAN",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/CdtrAcct/Id/IBAN",
      "originalMasked": "GB********19 (22 chars)",
      "replacement": "GB45000000000000067899"
    },
    {
      "type": "remittance",
      "tag": "Ustrd",
      "path": "Document/FIToFICstmrCdtTrf/CdtTrfTxInf/RmtInf/Ustrd",
      "originalMasked": "In********26 (38 chars)",
      "replacement": "Remittance text 1"
    }
  ],
  "note": "Mapping shows masked previews only; originals are never returned.",
  "writtenTo": "{{input.output_path}}"
}
