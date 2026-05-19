import content from "../data/siteContent.json";
import type { Product } from "./types";

/*
  Typed access wrapper for JSON content.
  JSON cannot contain comments, so product/catalog implementation notes live here.
*/

export const siteContent = content;
export const products = content.products as Product[];
export const categories = content.categories;

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getProductBySlug(slug: string | null): Product | undefined {
  if (!slug) return undefined;
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.categories.includes(category));
}
