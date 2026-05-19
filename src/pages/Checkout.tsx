import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";
import { useCart } from "../components/cart/CartProvider";
import { PayPalSmartButtons } from "../components/payments/PayPalSmartButtons";
import { api } from "../lib/api";
import { formatMoney, formatProductPrice } from "../lib/format";
import type {
  BtcPaymentInvoice,
  CheckoutItemPayload,
  PaymentMethodId,
  PaymentMethodOption,
  PayPalOrderResult,
  TicketStatus
} from "../lib/types";

/*
  Checkout page.
  This file controls frontend presentation and payment selection flow only.
  Backend logic for records, payment validation, and ticket creation remains unchanged.
*/

const DEFAULT_METHODS: PaymentMethodOption[] = [
  {
    id: "BTC",
    label: "Bitcoin",
    enabled: false,
    processor: "manual_btc",
    status: "loading",
    note: "Loading Bitcoin payment status..."
  },
  {
    id: "PAYPAL",
    label: "PayPal",
    enabled: false,
    processor: "paypal_orders_v2",
    status: "loading",
    note: "Loading secure PayPal checkout status..."
  },
  {
    id: "CARD",
    label: "Credit / Debit Card",
    enabled: false,
    processor: "paypal_card_fields_or_paypal_checkout",
    status: "planned",
    note: "Credit and debit cards are processed securely through PayPal checkout. AIG does not collect or store card numbers."
  },
  {
    id: "APPLE_PAY",
    label: "Apple Pay",
    enabled: false,
    processor: "paypal_apple_pay_pending",
    status: "planned",
    note: "Apple Pay is intended to flow through PayPal once device, domain, and wallet eligibility are fully configured."
  },
  {
    id: "CASH_APP",
    label: "Cash App",
    enabled: true,
    processor: "manual_validation",
    status: "manual_validation_required",
    note: "Creates a pending Cash App ticket for manual validation. Wait for AIG confirmation before sending payment."
  }
];

const paymentImageMap: Record<PaymentMethodId, string> = {
  BTC: "/assets/images/payment/bitcoin.png",
  PAYPAL: "/assets/images/payment/paypal.png",
  CARD: "/assets/images/payment/card.svg",
  APPLE_PAY: "/assets/images/payment/paypal.png",
  CASH_APP: "/assets/images/payment/cashapp.jpg",
  MANUAL: "/assets/images/payment/manual.svg"
};

function methodBadge(method: PaymentMethodOption) {
  if (method.enabled && method.status === "ready") return "Ready";
  if (method.enabled) return "Available";
  if (method.id === "APPLE_PAY" || method.id === "CASH_APP") return "Planned";
  return "Config Needed";
}

function checkoutButtonLabel(method: PaymentMethodOption | undefined) {
  if (!method) return "Proceed to Secure Checkout";
  if (method.id === "BTC") return "Create Bitcoin Invoice";
  if (method.id === "PAYPAL") return "Open Secure PayPal Checkout";
  if (method.id === "CARD") return "Open Card Checkout via PayPal";
  if (method.id === "APPLE_PAY") return "Create Apple Pay Setup Ticket";
  if (method.id === "CASH_APP") return "Create Cash App Pending Ticket";
  return `Continue With ${method.label}`;
}

export function Checkout() {
  const { items, totalCents } = useCart();
  const [methods, setMethods] = useState<PaymentMethodOption[]>(DEFAULT_METHODS);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("BTC");
  const [status, setStatus] = useState("");
  const [btcInvoice, setBtcInvoice] = useState<BtcPaymentInvoice | null>(null);
  const [paypalOrder, setPayPalOrder] = useState<PayPalOrderResult | null>(null);
  const [manualTicket, setManualTicket] = useState<{ ticket_number: string; status: string; payment_method: string } | null>(null);
  const [txHash, setTxHash] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [handledPayPalReturn, setHandledPayPalReturn] = useState(false);

  const manualPayPalLink = import.meta.env.VITE_PAYPAL_PAYMENT_LINK || "https://www.paypal.com/ncp/payment/3XBBELN7YCEDS";
  const cashAppPaymentLink = import.meta.env.VITE_CASH_APP_PAYMENT_LINK || "https://cash.app/$americaninnovationgp";
  const cashAppQrImage = "/assets/images/payment/cashapp_qr.png";

  useEffect(() => {
    api.paymentMethods().then((result) => {
      if (result.ok && result.data) setMethods(result.data);
    });
  }, []);

  useEffect(() => {
    if (handledPayPalReturn) return;

    const params = new URLSearchParams(window.location.search);
    const paypalState = params.get("paypal");
    const orderToken = params.get("token") || params.get("orderID") || params.get("orderId");

    if (paypalState === "cancel") {
      setHandledPayPalReturn(true);
      setStatus("PayPal checkout was cancelled. The ticket remains PROCESSING until completed or denied.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (paypalState === "return" && orderToken) {
      setHandledPayPalReturn(true);
      setStatus("PayPal approval returned. Capturing payment...");

      api.capturePayPalOrder(orderToken).then((result) => {
        if (!result.ok) {
          setStatus(result.error || "PayPal capture failed after approval return. Check the admin ticket before retrying.");
          return;
        }

        setStatus(`PayPal capture complete. Ticket status: ${result.data?.status || "APPROVED"}.`);
      }).finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [handledPayPalReturn]);

  const checkoutItems = useMemo<CheckoutItemPayload[]>(() => items.map((item) => ({
    product_id: item.product.id,
    product_code: item.product.productCode || `P${String(item.product.id).padStart(3, "0")}`,
    name: item.product.name,
    description: item.product.description,
    quantity: item.quantity,
    unit_price_cents: item.product.priceCents
  })), [items]);

  const orderDescription = useMemo(() => {
    if (items.length === 0) return "Approved AIG quote payment";
    return items.map((item) => `${item.quantity}x ${item.product.name}: ${item.product.description}`).join("\n");
  }, [items]);

  const visibleMethods = useMemo(
    () => methods.filter((method) => method.id !== "APPLE_PAY"),
    [methods]
  );
  const selected = visibleMethods.find((method) => method.id === selectedMethod) || visibleMethods[0] || methods[0];
  const approvedAmountHint = totalCents > 0 ? (totalCents / 100).toFixed(2) : "";

  function readCustomerForm(event: FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    const amountDollars = Number(form.get("amount_dollars"));
    return {
      customer_name: String(form.get("customer_name") || "").trim(),
      customer_email: String(form.get("customer_email") || "").trim(),
      amount_cents: Math.round(amountDollars * 100)
    };
  }

  function validateCheckoutInput(input: { customer_name: string; customer_email: string; amount_cents: number }) {
    if (!acceptedTerms) return "Accept the Terms & Conditions and Privacy Policy before checkout.";
    if (!input.customer_name || !input.customer_email) return "Customer name and email are required.";
    if (!Number.isInteger(input.amount_cents) || input.amount_cents <= 0) return "Enter the approved quote amount before payment.";
    if (checkoutItems.length === 0) return "Add at least one product to the cart before checkout.";
    if (selectedMethod === "PAYPAL" && !selected?.enabled) return "PayPal is not configured yet. Use the manual PayPal quote link only as a temporary backup.";
    if (selectedMethod === "CARD" && !selected?.enabled) return "Card checkout through PayPal is not configured yet.";
    if (selectedMethod === "BTC" && !selected?.enabled) return "Bitcoin is not configured yet. Add a BTC receive address before accepting BTC payments.";
    return "";
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setBtcInvoice(null);
    setPayPalOrder(null);
    setManualTicket(null);

    const input = readCustomerForm(event);
    const validationError = validateCheckoutInput(input);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    const payload = {
      ...input,
      items: checkoutItems,
      order_description: orderDescription,
      notes: `Checkout payment method: ${selectedMethod}`
    };

    if (selectedMethod === "BTC") {
      setStatus("Creating Bitcoin invoice...");
      const result = await api.createBtcInvoice(payload);
      if (!result.ok || !result.data) {
        setStatus(result.error || "Bitcoin invoice creation failed.");
        return;
      }
      setBtcInvoice(result.data);
      setStatus(`Ticket ${result.data.ticket_number} created. Status: PENDING.`);
      return;
    }

    if (selectedMethod === "PAYPAL" || selectedMethod === "CARD") {
      setStatus(selectedMethod === "CARD" ? "Creating secure card checkout through PayPal..." : "Creating PayPal checkout...");
      const result = await api.createPayPalOrder(payload);
      if (!result.ok || !result.data) {
        setStatus(result.error || "PayPal order creation failed. Confirm credentials are configured.");
        return;
      }
      setPayPalOrder(result.data);
      setStatus(`Ticket ${result.data.ticket_number} created. Use the secure PayPal panel to approve and capture.`);
      return;
    }

    setStatus("Creating manual pending ticket...");
    const result = await api.createManualTicket({
      payment_method: selectedMethod,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      amount_cents: input.amount_cents,
      items: checkoutItems,
      order_description: orderDescription
    });
    if (!result.ok || !result.data) {
      setStatus(result.error || "Unable to create manual ticket.");
      return;
    }
    setManualTicket({ ticket_number: result.data.ticket_number, status: result.data.status, payment_method: result.data.payment_method });
    setStatus(`Ticket ${result.data.ticket_number} created. Status: PENDING.`);
  }

  async function submitTxHash() {
    if (!btcInvoice) return;
    const result = await api.submitBtcTransaction(btcInvoice.payment_id, txHash);
    if (!result.ok) {
      setStatus(result.error || "Invalid transaction hash. Transaction blocked.");
      return;
    }
    setStatus(`Bitcoin transaction submitted. Ticket ${btcInvoice.ticket_number} status: PROCESSING. Admin validation required.`);
  }


  return (
    <RetroPanel title="Secure Checkout Terminal">
      <div className="section-intro checkout-hero">
        <p className="eyebrow">AIG // PAYMENT GATEWAY</p>
        <h1>Approved quote checkout.</h1>
        <p>
          Choose your payment method, enter the approved quote amount, and create a tracked AIG order ticket.
          Orders and payments move through PENDING, PROCESSING, DENIED, or APPROVED status.
        </p>
      </div>

      <div className="checkout-status-rail" aria-label="Checkout status flow">
        <span>PENDING</span><span>PROCESSING</span><span>DENIED</span><span>APPROVED</span>
      </div>

      <div className="checkout-layout">
        <section className="invoice-box">
          <h3>1. Review order</h3>
          {items.length === 0 ? (
            <div className="empty-state compact">
              <p>No cart items found. Add quote-based products before checkout.</p>
              <Link className="retro-button secondary" to="/products">Browse Catalog</Link>
            </div>
          ) : (
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.product.id}>
                  <strong>{item.quantity}x {item.product.name}</strong>
                  <span>{formatProductPrice(item.product)}</span>
                  <p>{item.product.description}</p>
                </div>
              ))}
            </div>
          )}
          <div className="invoice-line">
            <span>Cart total</span>
            <strong>{totalCents > 0 ? formatMoney(totalCents) : "Approved quote amount required"}</strong>
          </div>
        </section>

        <section className="invoice-box">
          <h3>2. Choose payment lane</h3>
          <div className="payment-method-grid">
            {visibleMethods.map((method) => (
              <button
                type="button"
                key={method.id}
                className={`payment-method-card ${selectedMethod === method.id ? "active" : ""} ${!method.enabled ? "limited" : ""}`}
                onClick={() => setSelectedMethod(method.id)}
                aria-pressed={selectedMethod === method.id}
              >
                <img src={paymentImageMap[method.id]} alt={`${method.label} logo`} className="payment-method-logo" />
                <strong>{method.label}</strong>
                <span>{methodBadge(method)}</span>
              </button>
            ))}
          </div>
          {selected && (
            <div className="method-detail-card">
              <strong>{selected.label}</strong>
              <p>{selected.note}</p>
              {selectedMethod === "PAYPAL" && (
                <p className="small-muted">PayPal may present eligible wallet, card, Pay Later, and Apple Pay options based on device and account availability.</p>
              )}
              {selectedMethod === "CARD" && (
                <p className="small-muted">Card checkout is routed through PayPal; AIG never stores card numbers.</p>
              )}
              {selectedMethod === "CASH_APP" && (
                <p className="small-muted">Cash App is manual validation only. Create the ticket first, wait for AIG confirmation, then include the ticket number or quote reference in the payment note.</p>
              )}
            </div>
          )}
        </section>

        {selectedMethod === "PAYPAL" && manualPayPalLink && (
          <section className="invoice-box span-2">
            <h3>Manual PayPal backup link</h3>
            <p>Use this backup only for approved quotes if the live embedded PayPal checkout is unavailable. Include your ticket number, invoice number, or quote reference in the PayPal note.</p>
            <a className="retro-button secondary" href={manualPayPalLink} target="_blank" rel="noreferrer">
              Open Manual Quote Payment Link
            </a>
          </section>
        )}

        {selectedMethod === "CASH_APP" && (
          <section className="invoice-box span-2 cashapp-manual-panel">
            <div className="cashapp-manual-copy">
              <h3>Cash App manual validation</h3>
              <p>Create the pending ticket first. Do not send payment until AIG confirms the quote, ticket number, and amount. When payment is approved, include the ticket number or quote reference in the Cash App note.</p>
              <a className="retro-button secondary" href={cashAppPaymentLink} target="_blank" rel="noreferrer">
                Open Cash App Payment Link
              </a>
            </div>
            <div className="cashapp-qr-frame">
              <img src={cashAppQrImage} alt="Cash App QR code for American Innovations Group" />
              <span>$americaninnovationgp</span>
            </div>
          </section>
        )}

        <form className="invoice-box contact-form span-2" onSubmit={submitCheckout}>
          <h3>3. Customer + approved amount</h3>
          <label>Customer / Company Name<input name="customer_name" type="text" placeholder="Customer name" required /></label>
          <label>Customer Email<input name="customer_email" type="email" placeholder="customer@example.com" required /></label>
          <label>Approved Quote Amount USD<input name="amount_dollars" type="number" min="1" step="0.01" placeholder={approvedAmountHint || "250.00"} defaultValue={approvedAmountHint} required /></label>
          <label className="terms-check">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
            <span>I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
          </label>
          <button className="retro-button" type="submit">{checkoutButtonLabel(selected)}</button>
        </form>

        {btcInvoice && (
          <section className="invoice-box span-2">
            <h3>Bitcoin payment ticket</h3>
            <div className="invoice-line"><span>Ticket</span><strong>{btcInvoice.ticket_number}</strong></div>
            <div className="invoice-line"><span>Status</span><strong>{btcInvoice.status}</strong></div>
            <div className="invoice-line"><span>Amount</span><strong>{formatMoney(btcInvoice.amount_cents)}</strong></div>
            <code>{btcInvoice.btc_address}</code>
            <label className="tx-input">Bitcoin Transaction Hash<input value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="64-character transaction hash" /></label>
            <button className="retro-button" type="button" onClick={submitTxHash}>Submit Bitcoin Transaction Hash</button>
          </section>
        )}

        {paypalOrder && (
          <section className="invoice-box span-2 paypal-checkout-panel">
            <div className="paypal-ticket-header">
              <div>
                <h3>PayPal checkout ready</h3>
                <p className="small-muted">Use PayPal for PayPal balance, eligible cards, and supported wallet options. AIG does not collect or store card numbers.</p>
              </div>
              <span className="paypal-secure-badge">Secure checkout</span>
            </div>

            <div className="paypal-ticket-grid">
              <div className="invoice-line"><span>Ticket</span><strong>{paypalOrder.ticket_number}</strong></div>
              <div className="invoice-line"><span>Status</span><strong>{paypalOrder.ticket_status}</strong></div>
              <div className="invoice-line"><span>Amount</span><strong>{formatMoney(paypalOrder.amount_cents)}</strong></div>
            </div>

            {paypalOrder.approval_url && (
              <div className="paypal-primary-action">
                <div>
                  <strong>Recommended path</strong>
                  <p>Open PayPal's hosted checkout for the most reliable desktop and mobile approval flow. After approval, PayPal returns here and AIG confirms the order through the secure checkout system.</p>
                </div>
                <a className="retro-button" href={paypalOrder.approval_url} target="_blank" rel="noreferrer">
                  Open Hosted PayPal Checkout
                </a>
              </div>
            )}

            <details className="paypal-embedded-details" open>
              <summary>Embedded PayPal buttons</summary>
              <p className="small-muted">If the buttons below are visible, you can approve the same order directly from this page. If your browser blocks them, use hosted checkout above.</p>
              <PayPalSmartButtons
                orderId={paypalOrder.paypal_order_id}
                ticketNumber={paypalOrder.ticket_number}
                onStatus={setStatus}
                onApproved={(approvedStatus: TicketStatus) => {
                  setPayPalOrder((current) => current ? { ...current, ticket_status: approvedStatus } : current);
                }}
              />
            </details>
          </section>
        )}

        {manualTicket && (
          <section className="invoice-box span-2">
            <h3>{manualTicket.payment_method === "CASH_APP" ? "Cash App pending ticket" : "Manual payment ticket"}</h3>
            <div className="invoice-line"><span>Ticket</span><strong>{manualTicket.ticket_number}</strong></div>
            <div className="invoice-line"><span>Status</span><strong>{manualTicket.status}</strong></div>
            {manualTicket.payment_method === "CASH_APP" ? (
              <div className="cashapp-next-steps">
                <p className="warning-note">Your Cash App ticket is pending. Wait for AIG confirmation before sending payment. Include ticket {manualTicket.ticket_number} in the Cash App note.</p>
                <a className="retro-button secondary" href={cashAppPaymentLink} target="_blank" rel="noreferrer">
                  Open Cash App Payment Link
                </a>
              </div>
            ) : (
              <p className="warning-note">This payment method is manual validation only. The order is recorded but not approved until AIG confirms payment.</p>
            )}
          </section>
        )}
      </div>
      {status && <p className="form-status">{status}</p>}
    </RetroPanel>
  );
}
