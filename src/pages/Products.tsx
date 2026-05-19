import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/products/ProductCard";
import { RetroPanel } from "../components/retro/RetroPanel";
import { api } from "../lib/api";
import { categories, products } from "../lib/siteData";
import type { Product, ProductPopularity } from "../lib/types";

/*
  Product catalog with animated, toggleable category groups.
  Backend metrics are optional; the page remains functional if metrics are unavailable.
*/

type ProductGroup = {
  title: string;
  subtitle: string;
  matcher: (product: Product) => boolean;
};

const productGroups: ProductGroup[] = [
  {
    title: "Hardware +",
    subtitle: "Embedded systems, industrial equipment, manufacturing support, apparatus, and controllers.",
    matcher: (product) =>
      product.type === "hardware" ||
      product.categories.some((category) =>
        ["Embedded systems", "Industrial equipment", "Manufacturing equipment"].includes(category)
      )
  },
  {
    title: "Software +",
    subtitle: "Custom software, automation, dashboards, internal utilities, launch support, and technical tooling.",
    matcher: (product) =>
      product.type === "software" ||
      product.categories.includes("Software solutions")
  },
  {
    title: "Consultation +",
    subtitle: "Technical direction, planning, documentation, training, and quote-based advisory work.",
    matcher: (product) =>
      product.type === "service" ||
      product.name.toLowerCase().includes("consult") ||
      product.name.toLowerCase().includes("training") ||
      product.name.toLowerCase().includes("tutoring")
  },
  {
    title: "Cybersecurity Solutions +",
    subtitle: "Authorized audits, testing, hardening, secure software review, tutoring, templates, and defensive support.",
    matcher: (product) => product.categories.includes("Cybersecurity solutions")
  }
];

export function Products() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [metrics, setMetrics] = useState<Record<number, ProductPopularity>>({});

  useEffect(() => {
    api.productMetrics().then((result) => {
      if (!result.ok || !result.data) return;

      const next: Record<number, ProductPopularity> = {};
      for (const metric of result.data) {
        next[metric.product_id] = metric;
      }
      setMetrics(next);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((product) => product.categories.includes(activeCategory));
  }, [activeCategory]);

  return (
    <RetroPanel title="Product Catalog">
      <div className="section-intro section-intro--catalog">
        <h1>Quote-based product catalog.</h1>
        <p>
          Products are organized by category lanes. Open a category, review the tags,
          then open the product page or add the item to the planning cart.
        </p>
      </div>

      <div className="category-filter" aria-label="Product category filter">
        <button
          type="button"
          className={activeCategory === "All" ? "active" : ""}
          onClick={() => setActiveCategory("All")}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            type="button"
            key={category.name}
            className={activeCategory === category.name ? "active" : ""}
            onClick={() => setActiveCategory(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="product-accordion">
        {productGroups.map((group, index) => {
          const groupProducts = filteredProducts.filter(group.matcher);
          if (groupProducts.length === 0) return null;

          return (
            <details className="catalog-dropdown" open={index === 0 || activeCategory !== "All"} key={group.title}>
              <summary>
                <span>{group.title}</span>
                <em>{groupProducts.length} product lanes</em>
              </summary>
              <p>{group.subtitle}</p>

              <div className="product-grid">
                {groupProducts.map((product) => (
                  <ProductCard key={`${group.title}-${product.id}`} product={product} metric={metrics[product.id]} />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </RetroPanel>
  );
}
