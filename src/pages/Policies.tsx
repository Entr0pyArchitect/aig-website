import { useState } from "react";
import { RetroPanel } from "../components/retro/RetroPanel";

/*
  Public policy center with toggleable customer-facing sections.
  This page avoids internal implementation details and focuses on privacy, payment, and service expectations.
*/

type PolicyTab = "privacy" | "terms";

export function Policies() {
  const [activeTab, setActiveTab] = useState<PolicyTab>("privacy");

  return (
    <RetroPanel title="Policies">
      <div className="section-intro section-intro--policy">
        <h1>Policies and customer terms.</h1>
        <p>Review how American Innovations Group handles customer information, quote-based work, payments, and custom project expectations.</p>
      </div>

      <div className="policy-tabs" role="tablist" aria-label="Policy sections">
        <button className={activeTab === "privacy" ? "active" : ""} type="button" onClick={() => setActiveTab("privacy")} role="tab" aria-selected={activeTab === "privacy"}>Privacy Policy</button>
        <button className={activeTab === "terms" ? "active" : ""} type="button" onClick={() => setActiveTab("terms")} role="tab" aria-selected={activeTab === "terms"}>Terms & Conditions</button>
      </div>

      {activeTab === "privacy" && (
        <section className="policy-panel" role="tabpanel">
          <h2>Privacy Policy</h2>
          <p>AIG uses a privacy-by-design approach based on the NIST Privacy Framework and NIST Cybersecurity Framework. The goal is to collect only what is needed, explain why it is needed, protect customer records, and avoid handling unnecessary payment credentials.</p>

          <div className="policy-accordion">
            <details open>
              <summary>Data We Collect</summary>
              <p>We may collect customer name, company name, email address, product interest, quote details, project requirements, order descriptions, payment method selection, ticket number, payment status, PayPal order references, and Bitcoin transaction hashes.</p>
            </details>
            <details>
              <summary>Data We Do Not Collect</summary>
              <p>AIG does not collect seed phrases, private keys, PayPal passwords, raw card numbers, or private payment credentials. Card and PayPal payment entry is handled through PayPal. Bitcoin validation uses public transaction information provided by the customer.</p>
            </details>
            <details>
              <summary>NIST-Based Privacy Practices</summary>
              <p>Our privacy process is organized around NIST Privacy Framework concepts: identify what information is collected, govern how it is used, control access to records, communicate customer expectations clearly, and protect information from unnecessary exposure.</p>
            </details>
            <details>
              <summary>Reference Basis</summary>
              <p>Supported by: NIST Privacy Framework; NIST Cybersecurity Framework 2.0; NIST Special Publication 800-53 Rev. 5 privacy and security control families including access control, audit/accountability, risk assessment, system and communications protection, and incident response.</p>
            </details>
          </div>
        </section>
      )}

      {activeTab === "terms" && (
        <section className="policy-panel" role="tabpanel">
          <h2>Terms & Conditions</h2>
          <p>These terms apply to quote requests, custom hardware/software work, cybersecurity services, technical consulting, support requests, and approved payments submitted through AIG.</p>

          <div className="policy-accordion">
            <details open>
              <summary>Quote-Based Work</summary>
              <p>Most AIG products and services are quote-based. Pricing, scope, timelines, technical requirements, authorization requirements, materials, and fulfillment details must be confirmed before work begins.</p>
            </details>
            <details>
              <summary>Payments and Order Status</summary>
              <p>Supported payment methods may include Bitcoin, PayPal, and card checkout through PayPal. Order records may use PENDING, PROCESSING, DENIED, and APPROVED status. APPROVED means the payment was captured, verified, or manually validated by AIG.</p>
            </details>
            <details>
              <summary>Cybersecurity Work</summary>
              <p>Security audits, penetration testing, and security software projects require written authorization, defined scope, rules of engagement, and lawful-use context before any work begins. AIG may decline requests that are unsafe, unauthorized, or outside an agreed scope.</p>
            </details>
            <details>
              <summary>Reference Basis</summary>
              <p>Terms for cybersecurity and privacy work are informed by NIST Cybersecurity Framework 2.0 risk management concepts and NIST Privacy Framework principles for responsible data processing and communication.</p>
            </details>
          </div>
        </section>
      )}
    </RetroPanel>
  );
}
