import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/products/ProductCard";
import { RetroPanel } from "../components/retro/RetroPanel";
import { TerminalBoot } from "../components/retro/TerminalBoot";
import { products, siteContent } from "../lib/siteData";
import { api } from "../lib/api";
import type { ProductPopularity } from "../lib/types";

/*
  Public homepage for quote-first product lanes and customer engagement.
*/
export function Home() {
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

  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (metrics[b.id]?.popularity_percent || 0) - (metrics[a.id]?.popularity_percent || 0))
      .slice(0, 4);
  }, [metrics]);

  return (
    <div className="dashboard-grid">
      <aside className="left-column">
        <RetroPanel title="Customer Path">
          <div className="metric-list">
            <div><strong>SCOPE</strong><span>Requirements first</span></div>
            <div><strong>QUOTE</strong><span>Approval before payment</span></div>
            <div><strong>BUILD</strong><span>Custom solutions</span></div>
          </div>
        </RetroPanel>

        <RetroPanel title="Catalog Network">
          <div className="side-links">
            <Link to="/products">01 / Product Catalog</Link>
            <Link to="/services">02 / Services</Link>
            <Link to="/contact">03 / Quote Intake</Link>
            <Link to="/policies">04 / Policies</Link>
          </div>
        </RetroPanel>
      </aside>

      <section className="center-column">
        <div className="hero-card">
          <span className="datestamp">AIG :: Engineering Art</span>
          <h1>Custom engineering products scoped around real customer specifications.</h1>
          <p>{siteContent.company.summary}</p>
          <p>
            From custom electric motors and PCB work to software, consulting, and cybersecurity solutions,
            AIG focuses on clear scope, practical delivery, and customer requirements before payment or production.
          </p>
          <div className="button-row">
            <Link className="retro-button" to="/products">View Catalog</Link>
            <Link className="retro-button secondary" to="/contact">Request Quote</Link>
            <Link className="retro-button secondary" to="/services">Capabilities</Link>
          </div>
        </div>

        <RetroPanel title="Popular Product Lanes">
          <div className="product-grid">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} metric={metrics[product.id]} />)}
          </div>
        </RetroPanel>

        <RetroPanel title="Terminal Boot"><TerminalBoot /></RetroPanel>
      </section>

      <aside className="right-column">
        <RetroPanel title="Categories">
          {siteContent.categories.map((category) => (
            <div className="mini-card" key={category.name}>
              <strong>{category.name}</strong>
              <span>{category.description}</span>
            </div>
          ))}
        </RetroPanel>
      </aside>
    </div>
  );
}
