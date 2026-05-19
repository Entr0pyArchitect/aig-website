import { RetroPanel } from "../components/retro/RetroPanel";

/*
  Public terms and conditions page.
  Includes quote, payment, custom work, and authorized cybersecurity service terms.
*/

export function Terms() {
  return (
    <RetroPanel title="Terms & Conditions">
      <div className="section-intro section-intro--policy"><h1>Terms & Conditions</h1><p>Last updated: May 18, 2026</p></div>
      <div className="content-stack legal-copy">
        <h3>Quote-Based Products and Services</h3>
        <p>Most AIG products and services are quote-based. Pricing, scope, timelines, availability, materials, authorization requirements, and fulfillment details must be confirmed before payment or production begins.</p>

        <h3>Customer Responsibilities</h3>
        <p>Customers are responsible for providing accurate specifications, intended use, quantity, deadlines, technical constraints, shipping information, lawful-use context, and project authorization where applicable.</p>

        <h3>Payments</h3>
        <p>Supported payment methods may include Bitcoin, PayPal, and card checkout through PayPal. Bitcoin payments require manual verification. PayPal and card payments require successful approval and capture before an order can be marked approved.</p>

        <h3>Order Status</h3>
        <p>Checkout records may use PENDING, PROCESSING, DENIED, and APPROVED statuses. APPROVED means payment has been captured or manually validated by AIG. DENIED may indicate a failed, incomplete, cancelled, unauthorized, or invalid payment attempt.</p>

        <h3>Cybersecurity Services</h3>
        <p>Security audits, penetration testing, and security software projects require written authorization, clearly defined scope, rules of engagement, testing windows when needed, and lawful-use confirmation before work begins.</p>

        <h3>NIST-Informed Security Expectations</h3>
        <p>AIG cybersecurity services are informed by NIST Cybersecurity Framework 2.0 concepts including governance, identification of scope and assets, protection planning, detection awareness, response planning, and recovery-oriented recommendations.</p>

        <h3>Refunds and Custom Work</h3>
        <p>Custom work may not be refundable once engineering work begins, materials are ordered, cybersecurity testing begins, or custom deliverables enter production. Refunds and cancellations are reviewed case by case based on project status and committed work.</p>

        <h3>Lawful Use</h3>
        <p>Customers agree to use AIG products and services lawfully and only in authorized environments. AIG may decline work that appears unsafe, unauthorized, deceptive, abusive, or outside an agreed scope.</p>

        <h3>Reference Basis</h3>
        <p>Supported by: NIST Cybersecurity Framework 2.0; NIST Privacy Framework; NIST Special Publication 800-53 Rev. 5 control families related to risk assessment, access control, audit/accountability, incident response, and system protection.</p>
      </div>
    </RetroPanel>
  );
}
