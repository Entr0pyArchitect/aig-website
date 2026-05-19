import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product, ProductPopularity } from "../../lib/types";
import { formatProductPrice, toTitleCase } from "../../lib/format";
import { useCart } from "../cart/CartProvider";

/*
  Quote-first product card.
  Includes category tags, popularity signal, product details link, and an animated add-to-cart confirmation.
  Public product codes are shown here; internal database IDs are intentionally hidden.
*/
export function ProductCard({ product, metric }: { product: Product; metric?: ProductPopularity }) {
  const { addItem } = useCart();
  const [pulse, setPulse] = useState(false);
  const isQuoteProduct = product.pricingModel === "quote" || product.pricingModel === "tba" || product.priceCents === 0;

  useEffect(() => {
    if (!pulse) return;

    const timer = window.setTimeout(() => setPulse(false), 1200);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  function handleAddToCart() {
    addItem(product);
    setPulse(true);
  }

  return (
    <article className={`product-card ${pulse ? "cart-pulse" : ""}`}>
      <div className="product-card-header">
        <span>{product.productCode || "AIG-CATALOG"}</span>
        <span>{toTitleCase(product.type)}</span>
        <span>{product.status}</span>
      </div>

      <h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3>
      <p>{product.description}</p>

      <div className="category-pills compact">
        {product.categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>

      {metric && metric.popularity_percent > 0 ? (
        <div className="popularity-badge">
          {metric.label} · {metric.popularity_percent}% of recent approved demand
        </div>
      ) : (
        <div className="popularity-badge muted">New or quote-based product lane</div>
      )}

      <ul className="feature-list">
        {product.features.slice(0, 4).map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      {product.complianceNote && (
        <p className="compliance-note">{product.complianceNote}</p>
      )}

      <div className="product-actions">
        <strong>{formatProductPrice(product)}</strong>

        <button type="button" className="retro-button secondary" onClick={handleAddToCart}>
          {pulse ? "Added ✓" : "Add to cart"}
        </button>

        <Link className="retro-button secondary" to={`/products/${product.slug}`}>
          View Details
        </Link>

        {isQuoteProduct ? (
          <Link
            className="retro-button"
            to={`/contact?product=${encodeURIComponent(product.slug)}`}
          >
            {product.quoteCta || "Request Quote"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
