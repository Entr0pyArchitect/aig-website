import { Link, NavLink } from "react-router-dom";
import { useCart } from "../cart/CartProvider";
import { siteContent } from "../../lib/siteData";

/*
  Global site shell: header, nav, animated retro surface, footer.
*/
export function Shell({ children }: { children: React.ReactNode }) {
  const { totalQuantity } = useCart();

  return (
    <div className="site-shell">
      <div className="scanline-layer" aria-hidden="true" />
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />

      <div className="page-frame">
        <div className="top-transmission" aria-label="AIG signal feed">
          <div className="signal-track">
            <span>// QUOTE-FIRST ENGINEERING</span>
            <span>// AIG SIGNAL FEED</span>
            <span>// CUSTOM MOTORS</span>
            <span>// PCB DESIGN</span>
            <span>// SOFTWARE SOLUTIONS</span>
            <span>// CYBERSECURITY SOLUTIONS</span>
            <span>// TECHNICAL CONSULTING</span>
            <span>// QUOTE-FIRST ENGINEERING</span>
            <span>// AIG SIGNAL FEED</span>
            <span>// CUSTOM MOTORS</span>
            <span>// PCB DESIGN</span>
            <span>// SOFTWARE SOLUTIONS</span>
            <span>// CYBERSECURITY SOLUTIONS</span>
            <span>// TECHNICAL CONSULTING</span>
          </div>
        </div>

        <header className="hero-frame">
          <Link to="/" className="brand-block" aria-label="AIG home">
            <div className="aig-mark" aria-hidden="true">AIG</div>
            <div className="brand-full">{siteContent.company.name}</div>
          </Link>

          <div className="hero-copy">
            <p className="kicker">{siteContent.company.tagline}</p>
            <p>{siteContent.company.positioning}</p>
            <p className="small-muted">{siteContent.company.locationMode}</p>
          </div>

          <div className="status-panel" aria-label="Customer flow">
            <div className="status-title">Customer Flow</div>
            <ul>
              <li><span>scope:</span> requirements reviewed first</li>
              <li><span>quote:</span> approval before payment</li>
              <li><span>checkout:</span> Bitcoin, PayPal, and card options</li>
              <li><span>support:</span> ticket-based follow-up</li>
            </ul>
          </div>
        </header>

        <nav className="main-nav" aria-label="Primary navigation">
          {siteContent.nav.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.href === "/"}>
              {item.label === "Cart" ? `Cart (${totalQuantity})` : item.label}
            </NavLink>
          ))}
        </nav>

        <main className="main-surface">{children}</main>

        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {siteContent.company.name}</span>
          <span>{siteContent.company.tagline}</span>
          <Link to="/policies">Policies</Link>
        </footer>
      </div>
    </div>
  );
}
