import { cleanText, isValidEmail, json, readJson, type Env } from "../types";

type Body = {
  name: string;
  email: string;
  topic: string;
  message: string;
  product_slug?: string;
  product_name?: string;
};

/*
  Contact/support/quote route.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);

const name = cleanText(body.name, 120);
const email = isValidEmail(body.email);
const topic = cleanText(body.topic || "general", 80);
const message = cleanText(body.message, 4000);
const productSlug = cleanText(body.product_slug, 140);
const productName = cleanText(body.product_name, 160);

if (!name || !email || !message) {
  return json({ ok: false, error: "Valid name, email, and message are required." }, { status: 400 });
}

  const ticketId = crypto.randomUUID();
  let quoteRequestId: string | undefined;

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO support_tickets (id, name, email, topic, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(ticketId, name, email, topic, message, "open").run();

    if (topic === "quote" || productSlug || productName) {
      quoteRequestId = crypto.randomUUID();

      try {
        await env.DB.prepare(
          `INSERT INTO quote_requests
             (id, support_ticket_id, product_slug, product_name, name, email, topic, message, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        ).bind(
          quoteRequestId,
          ticketId,
          productSlug || null,
          productName || null,
          name,
          email,
          topic || "quote",
          message,
          "open"
        ).run();
      } catch {
        quoteRequestId = undefined;
      }
    }
  }

  return json({ ok: true, data: { ticket_id: ticketId, quote_request_id: quoteRequestId } });
};
