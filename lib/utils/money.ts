export function formatMoney(amountCents: number, currency = "ron"): string {
  const value = amountCents / 100;
  const code = currency.toLowerCase();
  if (code === "ron") return `${Math.round(value)} lei`;
  if (code === "eur") {
    return Number.isInteger(value) ? `€${value}` : `€${value.toFixed(2)}`;
  }
  return `${value} ${code.toUpperCase()}`;
}

export function isSubscriptionProduct(productType: string): boolean {
  return (
    productType === "subscription" ||
    productType === "premium" ||
    productType === "premium_monthly"
  );
}
