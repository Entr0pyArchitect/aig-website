import { RetroPanel } from "../components/retro/RetroPanel";

/*
  Public privacy policy page.
  Includes NIST-supported references without external links.
*/

export function Privacy() {
  return (
    <RetroPanel title="Privacy Policy">
      <div className="section-intro section-intro--policy"><h1>Privacy Policy</h1><p>Last updated: May 18, 2026</p></div>
      <div className="content-stack legal-copy">
        <p>American Innovations Group collects only the information needed to respond to quote requests, process approved payments, provide support, and operate customer-facing services.</p>

        <h3>NIST-Supported Privacy Approach</h3>
        <p>AIG’s privacy approach is aligned with NIST Privacy Framework principles for identifying data processing activities, governing appropriate use, controlling access, communicating clearly, and protecting customer records.</p>

        <h3>Information We Collect</h3>
        <p>We may collect name, company name, email address, quote details, product selections, order descriptions, payment method selection, ticket numbers, payment status, PayPal order references, and Bitcoin transaction hashes.</p>

        <h3>Information We Do Not Collect</h3>
        <p>We do not collect wallet seed phrases, private keys, PayPal passwords, raw card numbers, or private payment credentials. Customers should never send sensitive secrets through the website, email, or support messages.</p>

        <h3>Payments</h3>
        <p>PayPal and card checkout are processed through PayPal. Bitcoin payments are manually verified using public transaction information. AIG uses payment status records to match approved quote payments to the correct customer order.</p>

        <h3>How We Use Information</h3>
        <p>Information is used to review quotes, communicate with customers, create support tickets, verify payments, generate order records, provide services, prevent fraud, and maintain appropriate business records.</p>

        <h3>Access and Protection</h3>
        <p>Customer records are intended to be accessed only for legitimate business, support, payment, security, and operational purposes. AIG’s policy follows NIST-style access control, auditability, data minimization, and incident response concepts.</p>

        <h3>Retention</h3>
        <p>Quote, payment, ticket, and support records may be retained for accounting, legal, fraud prevention, service delivery, customer support, and operational review. Records that are no longer needed should be reduced or removed when practical.</p>

        <h3>Reference Basis</h3>
        <p>Supported by: NIST Privacy Framework; NIST Cybersecurity Framework 2.0; NIST Special Publication 800-53 Rev. 5 control families including access control, audit/accountability, risk assessment, privacy authorization, incident response, and system protection.</p>
      </div>
    </RetroPanel>
  );
}
