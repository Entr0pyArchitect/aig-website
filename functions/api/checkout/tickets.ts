import { cleanText, isValidEmail, json, makeId, makeSequentialTicketNumber, normalizeTicketItems, readJson, safeAmountCents, type Env } from "../../types";

type TicketItem = {
  product_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price_cents?: number;
};

type Body = {
  payment_method: "BTC" | "PAYPAL" | "CARD" | "APPLE_PAY" | "CASH_APP" | "MANUAL";
  customer_name: string;
  customer_email: string;
  amount_cents: number;
  items: TicketItem[];
  order_description?: string;
};

/*
  Creates a checkout ticket without claiming payment approval.
  Used for manual/planned payment methods and as a fallback ticket generator.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  const amountCents = safeAmountCents(body.amount_cents);

const customerName = cleanText(body.customer_name, 160);
const customerEmail = isValidEmail(body.customer_email);

if (!customerName || !customerEmail) {
  return json({ ok: false, error: "Valid customer name and email are required." }, { status: 400 });
}

  if (!amountCents || amountCents <= 0) {
    return json({ ok: false, error: "A positive approved amount is required before checkout." }, { status: 400 });
  }

  const items = normalizeTicketItems(body.items);

  if (!items.length) {
    return json({ ok: false, error: "At least one cart item is required." }, { status: 400 });
  }

  const id = makeId("ticket");
  const ticketNumber = await makeSequentialTicketNumber(env);
  const description = body.order_description || items.map((item) => `${item.quantity}x ${item.name}`).join("; ");

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO checkout_tickets
        (id, ticket_number, status, payment_method, customer_name, customer_email,
         amount_cents, currency, items_json, order_description, created_at, updated_at)
       VALUES (?, ?, 'PENDING', ?, ?, ?, ?, 'USD', ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      id,
      ticketNumber,
      body.payment_method,
      customerName,
      customerEmail,
      amountCents,
      JSON.stringify(items),
      description
    ).run();
  }

  return json({
    ok: true,
    data: {
      id,
      ticket_number: ticketNumber,
      status: "PENDING",
      payment_method: body.payment_method,
      amount_cents: amountCents,
      currency: "USD",
      order_description: description
    }
  });
};
