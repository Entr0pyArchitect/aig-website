import { cleanText, isValidEmail, json, makeId, makeSequentialTicketNumber, readJson, normalizeTicketItems, recordTicketItems, safeAmountCents, type Env } from "../../../types";

type TicketItem = {
  product_id: number;
  product_code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price_cents?: number;
};

type Body = {
  quote_request_id?: string;
  support_ticket_id?: string;
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  notes?: string;
  items?: TicketItem[];
  order_description?: string;
};

/*
  Creates a BTC invoice record and a checkout ticket.
  BTC cannot be automatically approved here. It moves to PROCESSING after tx hash submission
  and APPROVED only after admin validation.
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

  const btcAddress = env.BTC_RECEIVE_ADDRESS;
  if (!btcAddress) {
    return json({ ok: false, error: "Bitcoin checkout is temporarily unavailable." }, { status: 503 });
  }

  const paymentId = makeId("pay_btc");
  const ticketId = makeId("ticket");
  const ticketNumber = await makeSequentialTicketNumber(env);
  const network = env.BTC_NETWORK || "Bitcoin mainnet";
  const confirmations = Number(env.BTC_CONFIRMATIONS_REQUIRED || "1");
  const items = normalizeTicketItems(body.items || []);
  const description = cleanText(body.order_description, 1000) || (items.length ? items.map((item) => `${item.quantity}x ${item.name}`).join("; ") : "Approved AIG quote payment");

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO payment_records
        (id, quote_request_id, support_ticket_id, payment_method, amount_cents, currency, status,
         customer_name, customer_email, btc_address, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'BTC', ?, 'USD', 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      paymentId,
      body.quote_request_id || null,
      body.support_ticket_id || null,
      amountCents,
      customerName,
      customerEmail,
      btcAddress,
      cleanText(body.notes, 1000) || null
    ).run();

    await env.DB.prepare(
      `INSERT INTO checkout_tickets
        (id, ticket_number, status, payment_method, customer_name, customer_email,
         amount_cents, currency, items_json, order_description, payment_record_id, created_at, updated_at)
       VALUES (?, ?, 'PENDING', 'BTC', ?, ?, ?, 'USD', ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      ticketId,
      ticketNumber,
      customerName,
      customerEmail,
      amountCents,
      JSON.stringify(items),
      description,
      paymentId
    ).run();
  }

  return json({
    ok: true,
    data: {
      id: paymentId,
      payment_id: paymentId,
      ticket_id: ticketId,
      ticket_number: ticketNumber,
      payment_method: "BTC",
      status: "PENDING",
      amount_cents: amountCents,
      currency: "USD",
      btc_address: btcAddress,
      network,
      confirmations_required: confirmations,
      order_description: description,
      instructions: [
        "Send BTC to the displayed receiving address.",
        "Submit the transaction hash after payment.",
        "AIG will manually verify the payment before fulfillment.",
        "Never send wallet private keys, seed phrases, or wallet files."
      ]
    }
  });
};
