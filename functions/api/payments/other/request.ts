import { cleanText, isValidEmail, json, makeId, makeSequentialTicketNumber, readJson, normalizeTicketItems, recordTicketItems, safeAmountCents, type Env } from "../../../types";

type Body = {
  payment_method: "CARD" | "APPLE_PAY" | "CASH_APP" | "MANUAL";
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  items?: Array<{ product_id: number; product_code?: string; name: string; description?: string; quantity: number; unit_price_cents?: number }>;
  order_description?: string;
};

/*
  Placeholder/manual payment request route.
  It does not process money. It creates a PENDING ticket only.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  const amountCents = safeAmountCents(body.amount_cents);

  if (!amountCents || amountCents <= 0) {
    return json({ ok: false, error: "A positive approved amount is required." }, { status: 400 });
  }

  const customerName = cleanText(body.customer_name, 160);
  const customerEmail = isValidEmail(body.customer_email);


  if (!customerName || !customerEmail) {
    return json({ ok: false, error: "Valid customer name and email are required." }, { status: 400 });
  }

  const ticketId = makeId("ticket");
  const ticketNumber = await makeSequentialTicketNumber(env);
  const items = normalizeTicketItems(body.items || []);
  const description = cleanText(body.order_description, 1000) || (items.length ? items.map((item) => `${item.quantity}x ${item.name}`).join("; ") : "AIG manual payment request");

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO checkout_tickets
        (id, ticket_number, status, payment_method, customer_name, customer_email,
         amount_cents, currency, items_json, order_description, created_at, updated_at)
       VALUES (?, ?, 'PENDING', ?, ?, ?, ?, 'USD', ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      ticketId,
      ticketNumber,
      body.payment_method,
      customerName,
      customerEmail,
      amountCents,
      JSON.stringify(items),
      description
    ).run();

    await recordTicketItems(env, ticketId, ticketNumber, items);
  }

  const cashAppMessage = "Cash App pending ticket created. Wait for AIG confirmation before sending payment. Include the ticket number or quote reference in the Cash App note.";

  return json({
    ok: true,
    data: {
      ticket_id: ticketId,
      ticket_number: ticketNumber,
      status: "PENDING",
      payment_method: body.payment_method,
      message: body.payment_method === "CASH_APP"
        ? cashAppMessage
        : "Manual payment ticket created. AIG must validate the payment before approval."
    }
  });
};
