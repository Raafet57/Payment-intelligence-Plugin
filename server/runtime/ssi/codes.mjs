// Generated from plugins/payment-intelligence/server/src/ssi/codes.ts by plugins/payment-intelligence/server/build.mjs.
// Edit the source, not this file.
/**
 * Code lists for SSI validation. Asset categories, holder types and flags follow
 * SSI Control Tower's catalogue (app/services/ssi_validation_catalogue.py), which
 * follows the SWIFTRef SSI Plus / SSI Directory documentation. Currencies are the
 * active ISO 4217 alphabetic codes.
 */
/** SWIFTRef SSI asset categories (relationship code family). */
export const ASSET_CATEGORIES = {
    ANYY: "Any asset category",
    WHLS: "Wholesale",
    CASH: "Bank-to-bank cash",
    COLL: "Collections",
    COMM: "Commodities",
    COPA: "Commercial payments",
    DERI: "Derivatives",
    DOCC: "Documentary credits",
    FOEX: "Foreign exchange",
    FUTU: "Futures",
    GUAR: "Guarantees",
    LETT: "Letters of credit",
    LOAN: "Loans",
    MMKT: "Money market",
    NDLF: "Non-deliverable forwards",
    OPTI: "Options",
    SECU: "Securities",
    TFIN: "Trade finance",
    TREA: "Treasury",
};
/** Display names found in exported SSI spreadsheets, mapped to SWIFTRef codes. */
export const ASSET_ALIASES = {
    any: "ANYY",
    cash: "CASH",
    "bank-to-bank cash": "CASH",
    "bank to bank cash": "CASH",
    collections: "COLL",
    commodities: "COMM",
    "commercial payments": "COPA",
    payments: "COPA",
    derivatives: "DERI",
    derivative: "DERI",
    "documentary credits": "DOCC",
    "foreign exchange": "FOEX",
    fx: "FOEX",
    futures: "FUTU",
    guarantees: "GUAR",
    "letters of credit": "LETT",
    loans: "LOAN",
    "money market": "MMKT",
    options: "OPTI",
    securities: "SECU",
    security: "SECU",
    equity: "SECU",
    equities: "SECU",
    "fixed income": "SECU",
    "trade finance": "TFIN",
    treasury: "TREA",
};
export const HOLDER_TYPES = new Set(["", "B", "C", "BANK", "CORRESPONDENT"]);
export const PREFERRED_FLAGS = new Set(["", "Y", "P", "TRUE", "1", "N", "FALSE", "0"]);
export const PREFERRED_TRUE = new Set(["Y", "P", "TRUE", "1"]);
/** Active ISO 4217 alphabetic currency codes, including funds and precious-metal codes. */
export const CURRENCY_CODES = new Set(("AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN " +
    "BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN " +
    "ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD " +
    "JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT " +
    "MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG " +
    "QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT " +
    "TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VED VES VND VUV WST XAF XAG XAU XBA " +
    "XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XUA YER ZAR ZMW ZWG").split(" "));
