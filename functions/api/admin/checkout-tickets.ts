import { json, requireAdmin, type Env } from "../../types";

/*
  Internal/admin ticket list.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: true, data: [] });
  }

  const rows = await env.DB.prepare(
    `SELECT id, ticket_number, status, payment_method, customer_name, customer_email,
            amount_cents, currency, order_description, payment_record_id,
            paypal_order_id, paypal_capture_id, btc_tx_hash, denial_reason,
            created_at, updated_at
     FROM checkout_tickets
     ORDER BY created_at DESC
     LIMIT 500`
  ).all();

  return json({ ok: true, data: rows.results || [] });
};
