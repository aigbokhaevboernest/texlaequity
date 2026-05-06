// No conversion. Values are stored as-is in the DB.
// We simply display the raw number with the user's currency symbol.

export const SUPPORTED_CURRENCIES = [“USD”, "EUR","GBP","AUD","CAD","JPY","SGD","AED","BRL","INR","ZAR", "INR","AFN-Afghan Afghani-؋","ALL-Albanian Lek-L","AMD-Armenian Dram-֏","ANG-Netherlands Antillean Guilder-ƒ","AOA-Angolan Kwanza-Kz","ARS-Argentine Peso-$","AWG-Aruban Florin-ƒ","AZN-Azerbaijani Manat-₼",
"BAM-Bosnia-Herzegovina Convertible Mark-KM","BBD-Barbadian Dollar-$","BDT-Bangladeshi Taka-৳","BGN-Bulgarian Lev-лв","BHD-Bahraini Dinar-.د.ب","BIF-Burundian Franc-FBu","BMD-Bermudian Dollar-$","BND-Brunei Dollar-$","BOB-Bolivian Boliviano-Bs","BOV-Bolivian Mvdol-BOV","BSD-Bahamian Dollar-$","BTN-Bhutanese Ngultrum-Nu.","BWP-Botswana Pula-P","BYN-Belarusian Ruble-Br","BZD-Belize Dollar-BZ$",
"CDF-Congolese Franc-FC","CHE-WIR Euro-CHE","CHF-Swiss Franc-CHF","CHW-WIR Franc-CHW","CLF-Chilean Unit of Account (UF)-UF","CLP-Chilean Peso-$","CNY-Chinese Yuan-¥","COP-Colombian Peso-$","COU-Colombian Unit of Value-COU","CRC-Costa Rican Colón-₡","CUC-Cuban Convertible Peso-$","CUP-Cuban Peso-$","CVE-Cape Verdean Escudo-$","CZK-Czech Koruna-Kč",
"DJF-Djiboutian Franc-Fdj","DKK-Danish Krone-kr","DOP-Dominican Peso-RD$","DZD-Algerian Dinar-دج",
"EGP-Egyptian Pound-£","ERN-Eritrean Nakfa-Nfk","ETB-Ethiopian Birr-ብር",
"FJD-Fijian Dollar-$","FKP-Falkland Islands Pound-£","GEL-Georgian Lari-₾","GHS-Ghanaian Cedi-₵","GIP-Gibraltar Pound-£","GMD-Gambian Dalasi-D","GNF-Guinean Franc-FG","GTQ-Guatemalan Quetzal-Q","GYD-Guyanese Dollar-$",
"HKD-Hong Kong Dollar-$","HNL-Honduran Lempira-L","HTG-Haitian Gourde-G","HUF-Hungarian Forint-Ft","IDR-Indonesian Rupiah-Rp","ILS-Israeli New Shekel-₪","IQD-Iraqi Dinar-ع.د","IRR-Iranian Rial-﷼","ISK-Icelandic Króna-kr","JMD-Jamaican Dollar-$","JOD-Jordanian Dinar-د.ا","KES-Kenyan Shilling-KSh","KGS-Kyrgyzstani Som-сом","KHR-Cambodian Riel-៛","KMF-Comorian Franc-CF","KPW-North Korean Won-₩","KRW-South Korean Won-₩","KWD-Kuwaiti Dinar-د.ك","KYD-Cayman Islands Dollar-$","KZT-Kazakhstani Tenge-₸",
"LAK-Lao Kip-₭","LBP-Lebanese Pound-ل.ل","LKR-Sri Lankan Rupee-₨","LRD-Liberian Dollar-$","LSL-Lesotho Loti-L","LYD-Libyan Dinar-ل.د",
"MAD-Moroccan Dirham-د.م","MDL-Moldovan Leu-L","MGA-Malagasy Ariary-Ar","MKD-Macedonian Denar-ден","MMK-Myanmar Kyat-K","MNT-Mongolian Tögrög-₮","MOP-Macanese Pataca-P","MRU-Mauritanian Ouguiya-UM","MUR-Mauritian Rupee-₨","MVR-Maldivian Rufiyaa-ރ.","MWK-Malawian Kwacha-MK","MXN-Mexican Peso-$","MXV-Mexican Unidad de Inversion-MXV","MYR-Malaysian Ringgit-RM","MZN-Mozambican Metical-MT",
"NAD-Namibian Dollar-$","NGN-Nigerian Naira-₦","NIO-Nicaraguan Córdoba-C$","NOK-Norwegian Krone-kr","NPR-Nepalese Rupee-₨","NZD-New Zealand Dollar-$",
"OMR-Omani Rial-ر.ع.",
"PAB-Panamanian Balboa-B/.","PEN-Peruvian Sol-S/","PGK-Papua New Guinean Kina-K","PHP-Philippine Peso-₱","PKR-Pakistani Rupee-₨","PLN-Polish Złoty-zł","PYG-Paraguayan Guaraní-₲",
"QAR-Qatari Riyal-ر.ق",
"RON-Romanian Leu-lei","RSD-Serbian Dinar-дин","RUB-Russian Ruble-₽","RWF-Rwandan Franc-FR",
"SAR-Saudi Riyal-ر.س","SBD-Solomon Islands Dollar-$","SCR-Seychellois Rupee-₨","SDG-Sudanese Pound-£","SEK-Swedish Krona-kr","SHP-Saint Helena Pound-£","SLE-Sierra Leonean Leone-Le","SOS-Somali Shilling-Sh","SRD-Surinamese Dollar-$","SSP-South Sudanese Pound-£","STN-São Tomé and Príncipe Dobra-Db","SVC-Salvadoran Colón-₡","SYP-Syrian Pound-£","SZL-Eswatini Lilangeni-L",
"THB-Thai Baht-฿","TJS-Tajikistani Somoni-ЅМ","TMT-Turkmenistani Manat-m","TND-Tunisian Dinar-د.ت","TOP-Tongan Paʻanga-T$","TRY-Turkish Lira-₺","TTD-Trinidad and Tobago Dollar-TT$","TWD-New Taiwan Dollar-NT$","TZS-Tanzanian Shilling-TSh",
"UAH-Ukrainian Hryvnia-₴","UGX-Ugandan Shilling-USh","USD-United States Dollar-$","USN-US Dollar (Next day)-USN","UYI-Uruguay Peso en Unidades Indexadas-UYI","UYU-Uruguayan Peso-$","UYW-Uruguay Unidad Previsional-UYW","UZS-Uzbekistani Som-so'm",
"VED-Venezuelan Digital Bolívar-Bs.D","VES-Venezuelan Bolívar-Bs.","VND-Vietnamese Đồng-₫","VUV-Vanuatu Vatu-VT",
"WST-Samoan Tala-WS$",
"XAF-CFA Franc BEAC-FCFA","XAG-Silver-oz","XBA-European Composite Unit-EURCO","XBB-European Monetary Unit-EMU","XBD-European Unit of Account 17-EUA","XCD-East Caribbean Dollar-$","XDR-Special Drawing Rights-SDR","XOF-CFA Franc BCEAO-CFA","XPD-Palladium-oz","XPF-CFP Franc-₣","XPT-Platinum-oz","XSU-SUCRE-SUCRE",
"YER-Yemeni Rial-﷼",
"ZMW-Zambian Kwacha-ZK","ZWL-Zimbabwean Dollar-Z$ “Others”]
                                     
export const formatMoney = (amount: number, currency = "USD"): string => {
  const value = Number(amount) || 0;
  const noDecimals = value >= 1000;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    // Fallback for currencies not supported by Intl
    return `${currency} ${value.toFixed(noDecimals ? 0 : 2)}`;
  }
};

export const currencySymbol = (currency = "USD"): string => {
  try {
    return (0).toLocaleString("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, "").trim();
  } catch {
    return currency;
  }
};
