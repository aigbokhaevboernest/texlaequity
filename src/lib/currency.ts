// Display-side currency conversion. Values are stored in USD in the DB;
// we convert at render time so each user sees their preferred currency.
//
// Rates are approximate and intended for display only. Update periodically
// or wire to a live FX feed if exact values are required.
export const FX_RATES_PER_USD: Record<string, number> = {
USD: 1,
EUR: 0.92,
GBP: 0.79,
AUD: 1.52,
CAD: 1.36,
JPY: 156,
SGD: 1.34,
AED: 3.67,
NGN: 1600,
BRL: 5.05,
INR: 83.4,
};
export const SUPPORTED_CURRENCIES = Object.keys(FX_RATES_PER_USD);
export const convertFromUSD = (usd: number, currency: string): number => {
const rate = FX_RATES_PER_USD[currency] ?? 1;
return Number(usd) * rate;
};
export const formatMoney = (usd: number, currency = “USD”): string => {
const code = FX_RATES_PER_USD[currency] ? currency : “USD”;
const value = convertFromUSD(usd, code);
// JPY/NGN/INR look better without decimals at large values
const noDecimals = [“JPY”, “NGN”, “INR”].includes(code) || Math.abs(value) >= 1000;
try {
return new Intl.NumberFormat(“en-US”, {
style: “currency”,
currency: code,
maximumFractionDigits: noDecimals ? 0 : 2,
minimumFractionDigits: 0,
}).format(value);
} catch {
return ${code} ${value.toFixed(noDecimals ? 0 : 2)};
}
};
Do I need to add currencies here?
