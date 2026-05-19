/*
  Formatting helpers shared across pages/components.
*/
import type { Product } from "./types";

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatProductPrice(product: Product): string {
  if (product.priceLabel) return product.priceLabel;
  if (product.pricingModel === "tba") return "TBA";
  if (product.pricingModel === "quote" || product.priceCents === 0) return "Quoted";
  return formatMoney(product.priceCents);
}

export function formatBtc(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "BTC amount pending";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return String(value);
  return `${numeric.toFixed(8)} BTC`;
}

export function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}
