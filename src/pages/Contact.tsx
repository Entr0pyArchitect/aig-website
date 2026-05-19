import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";
import { api } from "../lib/api";
import { getProductBySlug } from "../lib/siteData";

/*
  Quote/contact intake form.
*/
export function Contact() {
  const [status, setStatus] = useState("");
  const [searchParams] = useSearchParams();

  const selectedProduct = useMemo(() => getProductBySlug(searchParams.get("product")), [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      topic: String(form.get("topic") || "quote"),
      message: String(form.get("message") || ""),
      product_slug: selectedProduct?.slug,
      product_name: selectedProduct?.name
    };

    setStatus("Transmitting request...");

    const result = await api.sendContactMessage(payload);

    if (result.ok && result.data) {
      const quotePart = result.data.quote_request_id ? ` Quote: ${result.data.quote_request_id}` : "";
      setStatus(`Message received. Ticket: ${result.data.ticket_id}${quotePart}`);
      event.currentTarget.reset();
      return;
    }

    setStatus("Request could not be sent. Please try again later or contact AIG directly.");
    event.currentTarget.reset();
  }

  const defaultMessage = selectedProduct
    ? `I would like a quote for: ${selectedProduct.name}\n\nRecommended details:\n${selectedProduct.quotePrompt || "- Application/use case:\n- Quantity:\n- Timeline:\n- Technical constraints:"}\n\nAdditional notes:`
    : "";

  return (
    <RetroPanel title="Quote / Contact Channel">
      <div className="section-intro section-intro--secondary">
        <h1>Request a quote or start a project conversation.</h1>
        <p>Use this page for product specifications, quote requests, service leads, product feedback, and early customer interest.</p>
      </div>

      {selectedProduct && (
        <div className="quote-context">
          <strong>Quote request selected:</strong>
          <span>{selectedProduct.name}</span>
          <p>{selectedProduct.quotePrompt}</p>
        </div>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>Name / Company<input name="name" type="text" placeholder="Your name or company" required /></label>
        <label>Email<input name="email" type="email" placeholder="you@example.com" required /></label>
        <label>
          Topic
          <select name="topic" defaultValue={selectedProduct ? "quote" : "general"}>
            <option value="quote">Product Quote</option>
            <option value="motors">Electric Motors</option>
            <option value="pcb">PCB / Controller Board</option>
            <option value="cooling">Water Cooling Blocks</option>
            <option value="software">Software Solutions</option>
            <option value="consulting">Consulting</option>
            <option value="scientific">Scientific Apparatus</option>
            <option value="general">General</option>
          </select>
        </label>
        <label>
          Message
          <textarea name="message" placeholder="Tell us what you want to build and any required specifications." defaultValue={defaultMessage} required />
        </label>
        <button className="retro-button" type="submit">Transmit Request</button>
        {status && <p className="form-status">{status}</p>}
      </form>
    </RetroPanel>
  );
}
