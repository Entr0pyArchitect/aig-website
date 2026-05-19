import { Link, useParams } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";
import { useCart } from "../components/cart/CartProvider";
import { formatProductPrice, toTitleCase } from "../lib/format";
import { getProductBySlug } from "../lib/siteData";

/*
  Dedicated product page for quote-first product detail, add-to-cart, and quote request flow.
  Internal database IDs are intentionally not displayed publicly.
*/
export function ProductDetail() {
  const { slug } = useParams();
  const product = getProductBySlug(slug || null);
  const { addItem } = useCart();

  if (!product) {
    return (
      <RetroPanel title="Product Not Found">
        <div className="empty-state">
          <h1>Product lane unavailable.</h1>
          <p>The requested product could not be found.</p>
          <Link className="retro-button" to="/products">Back to Catalog</Link>
        </div>
      </RetroPanel>
    );
  }

  const code = product.productCode || "AIG-CATALOG";

  return (
    <RetroPanel title="Product Detail">
      <div className="product-detail-shell">
        <div className="section-intro">
          <p className="eyebrow">{code} // {toTitleCase(product.type)}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
        </div>

        <aside className="product-detail-panel">
          <div className="invoice-line"><span>Product Code</span><strong>{code}</strong></div>
          <div className="invoice-line"><span>Pricing</span><strong>{formatProductPrice(product)}</strong></div>
          <div className="invoice-line"><span>Status</span><strong>{product.status}</strong></div>
        </aside>
      </div>

      <div className="category-pills">
        {product.categories.map((category) => <span key={category}>{category}</span>)}
      </div>

      <div className="product-detail-grid">
        <section className="soft-card">
          <h3>Capabilities</h3>
          <ul className="feature-list">
            {product.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </section>

        <section className="soft-card">
          <h3>Quote Requirements</h3>
          <p>{product.quotePrompt || "Send the product scope, target use case, quantity, timeline, and technical constraints."}</p>
          {product.complianceNote && <p className="compliance-note">{product.complianceNote}</p>}
        </section>
      </div>

      <div className="product-actions detail-actions">
        <button className="retro-button secondary" type="button" onClick={() => addItem(product)}>
          Add to Planning Cart
        </button>
        <Link className="retro-button" to={`/contact?product=${encodeURIComponent(product.slug)}`}>
          {product.quoteCta || "Request Quote"}
        </Link>
        <Link className="retro-button secondary" to="/products">Back to Catalog</Link>
      </div>
    </RetroPanel>
  );
}
