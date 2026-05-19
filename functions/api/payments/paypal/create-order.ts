import { getPayPalAccessToken, cleanText, isValidEmail, json, makeId, makeSequentialTicketNumber, paypalBaseUrl, readJson, normalizeTicketItems, recordTicketItems, safeAmountCents, type Env } from "../../../types";

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
  Creates a PayPal Orders v2 order and a checkout ticket.
  Payment is not approved until capture succeeds.
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

  try {
    const accessToken = await getPayPalAccessToken(env);
    const origin = new URL(request.url).origin;
    const usd = (amountCents / 100).toFixed(2);
    const requestId = makeId("paypal_req");
    const items = normalizeTicketItems(body.items || []);
    const description = cleanText(body.order_description, 1000) || (items.length ? items.map((item) => `${item.quantity}x ${item.name}`).join("; ") : "Approved AIG quote payment");

    const paypalResponse = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: "AIG approved quote payment",
            amount: {
              currency_code: "USD",
              value: usd
            }
          }
        ],
        application_context: {
          brand_name: "American Innovations Group",
          locale: "en-US",
          landing_page: "LOGIN",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${origin}/checkout?paypal=return`,
          cancel_url: `${origin}/checkout?paypal=cancel`
        }
      })
    });

    const paypalOrder = await paypalResponse.json() as {
      id?: string;
      status?: string;
      links?: Array<{ href: string; rel: string; method: string }>;
    };

    if (!paypalResponse.ok || !paypalOrder.id) {
      return json({ ok: false, error: "Unable to create PayPal order." }, { status: 502 });
    }

    const paymentId = makeId("pay_paypal");
    const ticketId = makeId("ticket");
    const ticketNumber = await makeSequentialTicketNumber(env);
    const approvalUrl = paypalOrder.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href || null;

    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO payment_records
          (id, quote_request_id, support_ticket_id, payment_method, provider_reference, amount_cents,
           currency, status, customer_name, customer_email, paypal_order_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, 'PAYPAL', ?, ?, 'USD', 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        paymentId,
        body.quote_request_id || null,
        body.support_ticket_id || null,
        paypalOrder.id,
        amountCents,
        customerName,
        customerEmail,
        paypalOrder.id,
        cleanText(body.notes, 1000) || null
      ).run();

      await env.DB.prepare(
        `INSERT INTO checkout_tickets
          (id, ticket_number, status, payment_method, customer_name, customer_email,
           amount_cents, currency, items_json, order_description, payment_record_id, paypal_order_id, created_at, updated_at)
         VALUES (?, ?, 'PROCESSING', 'PAYPAL', ?, ?, ?, 'USD', ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        ticketId,
        ticketNumber,
        customerName,
        customerEmail,
        amountCents,
        JSON.stringify(items),
        description,
        paymentId,
        paypalOrder.id
      ).run();

      await recordTicketItems(env, ticketId, ticketNumber, items);
    }

    return json({
      ok: true,
      data: {
        payment_id: paymentId,
        ticket_id: ticketId,
        ticket_number: ticketNumber,
        paypal_order_id: paypalOrder.id,
        approval_url: approvalUrl,
        status: paypalOrder.status || "CREATED",
        ticket_status: "PROCESSING",
        amount_cents: amountCents,
        currency: "USD",
        links: paypalOrder.links || []
      }
    });
  } catch (error) {
    return json({
      ok: false,
      error: "PayPal order creation failed."
    }, { status: 503 });
  }
};
