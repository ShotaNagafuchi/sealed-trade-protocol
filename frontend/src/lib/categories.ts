export const CATEGORIES = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "PATENT_IP", label: "Patent / IP" },
  { value: "EQUITY_STOCK", label: "Equity / Stock" },
  { value: "COMMODITY", label: "Commodity" },
  { value: "DIGITAL_ASSET", label: "Digital Asset" },
  { value: "OTHER", label: "Other" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
