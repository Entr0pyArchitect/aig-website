import { json, type Env } from "../../types";

/*
  Read order/payment status.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");

  if (!orderId) {
    return json({ ok: false, error: "Missing order id." }, { status: 400 });
  }

  if (!env.DB) {
    return json({
      ok: true,
      data: {
        id: orderId,
        status: "unavailable",
        note: "Order status is temporarily unavailable."
      }
    });
  }

  const order = await env.DB.prepare(
    `SELECT id, invoice_id, status, total_cents, currency, btc_address, btc_tx_hash, created_at, updated_at
     FROM orders
     WHERE id = ?`
  ).bind(orderId).first();

  if (!order) {
    return json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  return json({ ok: true, data: order });
};
