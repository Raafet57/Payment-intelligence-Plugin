---
expect:
  iban: string
---

{
  "input": "DE89 3704 0044 0532 0130 00",
  "normalized": "DE89370400440532013000",
  "pretty": "DE89 3704 0044 0532 0130 00",
  "countryCode": "DE",
  "checks": [
    {
      "id": "country",
      "label": "Country code",
      "status": "pass",
      "detail": "DE · Germany"
    },
    {
      "id": "length",
      "label": "Length",
      "status": "pass",
      "detail": "22 characters as registered."
    },
    {
      "id": "structure",
      "label": "Structure",
      "status": "pass",
      "detail": "Matches the registry mask DE2!n8!n10!n."
    },
    {
      "id": "mod97",
      "label": "ISO 13616 check digits",
      "status": "pass",
      "detail": "MOD-97 of the rearranged numeric form equals 1."
    }
  ],
  "verdict": "valid",
  "country": {
    "bankIdentifier": {
      "example": "37040044",
      "position": "1-8",
      "structure": "8!n"
    },
    "bbanLength": 18,
    "bbanStructure": "8!n10!n",
    "contact": "Bundesverband deutscher Banken",
    "countryCode": "DE",
    "countryName": "Germany",
    "effectiveDate": "2007-07",
    "exampleIbanElectronic": "DE89370400440532013000",
    "exampleIbanPrint": "DE89 3704 0044 0532 0130 00",
    "ibanLength": 22,
    "ibanStructure": "DE2!n8!n10!n",
    "sepa": true
  },
  "bban": [
    {
      "id": "bank-identifier",
      "label": "Bank identifier",
      "position": "1-8",
      "value": "37040044"
    },
    {
      "id": "account-residue",
      "label": "Account number / residue",
      "position": "9-18",
      "value": "0532013000"
    }
  ],
  "registry": {
    "countryCount": 89,
    "latestCountryEffectiveDate": "2024-10",
    "registryVersion": "v101",
    "sourceFile": "IBAN Registry.txt",
    "sourceSha256": "abb80e61a23c109da2100c06ebc5a6dc4782d25f564774ada3d963640991631e"
  }
}
