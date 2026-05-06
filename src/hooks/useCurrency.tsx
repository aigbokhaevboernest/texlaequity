import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Currency symbols (display only — no FX conversion)
const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥",
  SGD: "S$", AED: "AED ", BRL: "R$", "ZAR": "R", "INR": "₹", "AFN": "؋", "ALL": "L", "AMD": "֏", "ANG": "ƒ", "AOA": "Kz", "ARS": "$", "AWG": "ƒ", "AZN": "₼",
"BAM": "KM", "BBD": "$", "BDT": "৳", "BGN": "лв", "BHD": ".د.ب", "BIF": "FBu", "BMD": "$", "BND": "$", "BOB": "Bs", "BOV": "BOV", "BSD": "$", "BTN": "Nu.", "BWP": "P", "BYN": "Br", "BZD": "BZ$",
"CDF": "FC", "CHE": "CHE", "CHF": "CHF", "CHW": "CHW", "CLF": "UF", "CLP": "$", "CNY": "¥", "COP": "$", "COU": "COU", "CRC": "₡", "CUC": "$", "CUP": "$", "CVE": "$", "CZK": "Kč",
"DJF": "Fdj", "DKK": "kr", "DOP": "RD$", "DZD": "دج",
"EGP": "£", "ERN": "Nfk", "ETB": "ብር",
"FJD": "$", "FKP": "£", "GEL": "₾", "GHS": "₵", "GIP": "£", "GMD": "D", "GNF": "FG", "GTQ": "Q", "GYD": "$",
"HKD": "$", "HNL": "L", "HTG": "G", "HUF": "Ft", "IDR": "Rp", "ILS": "₪", "IQD": "ع.د", "IRR": "﷼", "ISK": "kr", "JMD": "$", "JOD": "د.ا", "KES": "KSh", "KGS": "сом", "KHR": "៛", "KMF": "CF", "KPW": "₩", "KRW": "₩", "KWD": "د.ك", "KYD": "$", "KZT": "₸",
"LAK": "₭", "LBP": "ل.ل", "LKR": "₨", "LRD": "$", "LSL": "L", "LYD": "ل.د",
"MAD": "د.م", "MDL": "L", "MGA": "Ar", "MKD": "ден", "MMK": "K", "MNT": "₮", "MOP": "P", "MRU": "UM", "MUR": "₨", "MVR": "ރ.", "MWK": "MK", "MXN": "$", "MXV": "MXV", "MYR": "RM", "MZN": "MT",
"NAD": "$", "NGN": "₦", "NIO": "C$", "NOK": "kr", "NPR": "₨", "NZD": "$",
"OMR": "ر.ع.",
"PAB": "B/.", "PEN": "S/", "PGK": "K", "PHP": "₱", "PKR": "₨", "PLN": "zł", "PYG": "₲",
"QAR": "ر.ق",
"RON": "lei", "RSD": "дин", "RUB": "₽", "RWF": "FR",
"SAR": "ر.س", "SBD": "$", "SCR": "₨", "SDG": "£", "SEK": "kr", "SHP": "£", "SLE": "Le", "SOS": "Sh", "SRD": "$", "SSP": "£", "STN": "Db", "SVC": "₡", "SYP": "£", "SZL": "L",
"THB": "฿", "TJS": "ЅМ", "TMT": "m", "TND": "د.ت", "TOP": "T$", "TRY": "₺", "TTD": "TT$", "TWD": "NT$", "TZS": "TSh",
"UAH": "₴", "UGX": "USh", "USD": "$", "USN": "USN", "UYI": "UYI", "UYU": "$", "UYW": "UYW", "UZS": "so'm",
"VED": "Bs.D", "VES": "Bs.", "VND": "₫", "VUV": "VT",
"WST": "WS$",
"XAF": "FCFA", "XAG": "oz", "XBA": "EURCO", "XBB": "EMU", "XBD": "EUA", "XCD": "$", "XDR": "SDR", "XOF": "CFA", "XPD": "oz", "XPF": "₣", "XPT": "oz", "XSU": "SUCRE",
"YER": "﷼","ZMW": "ZK", "ZWL": "Z$",
};

/**
 * Returns the user's registration currency (profiles.currency) and a
 * `format(amount)` helper that displays the raw stored number with that
 * currency's symbol — NO conversion is performed.
 */
export function useCurrency() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<string>("USD");

  useEffect(() => {
    if (!user) { setCurrency("USD"); return; }
    let active = true;
    supabase.from("profiles").select("currency").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (active && data?.currency) setCurrency(data.currency); });

    const channel = supabase
      .channel(`profile-currency-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { currency?: string })?.currency;
          if (next) setCurrency(next);
        })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [user?.id]);

  const format = useCallback((amount: number) => {
    const n = Number(amount ?? 0);
    const sym = SYMBOLS[currency] ?? "";
    const noDecimals = ["JPY", "NGN", "INR"].includes(currency) || Math.abs(n) >= 1000;
    const formatted = n.toLocaleString("en-US", {
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: 0,
    });
    return sym ? `${sym}${formatted}` : `${currency} ${formatted}`;
  }, [currency]);

  return { currency, format };
}
