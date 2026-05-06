// No conversion. Values are stored as-is in the DB.
// We simply display the raw number with the user's currency symbol.

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
