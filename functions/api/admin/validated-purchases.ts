import { json, requireAdmin, type Env } from "../../types";

/*
  Internal automation endpoint.
  Returns only truly approved/validated purchases for spreadsheet sync.

  Important:
  DENIED tickets and failed payment records must not appear in validated_purchases.csv.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: true, data: [] });
  }

  const rows = await env.DB.prepare(
    `SELECT
       p.id,
       p.quote_request_id,
       p.support_ticket_id,
       p.payment_method,
       p.provider_reference,
       p.amount_cents,
       p.currency,
       p.status,
       p.customer_name,
       p.customer_email,
       p.btc_address,
       p.btc_tx_hash,
       p.paypal_order_id,
       p.paypal_capture_id,
       p.notes,
       p.created_at,
       p.updated_at,
       t.ticket_number,
       t.status AS ticket_status,
       t.order_description
     FROM payment_records p
     LEFT JOIN checkout_tickets t
       ON t.payment_record_id = p.id
       OR t.paypal_order_id = p.paypal_order_id
       OR t.btc_tx_hash = p.btc_tx_hash
     WHERE
       p.status IN ('paid', 'validated')
       AND COALESCE(t.status, 'APPROVED') = 'APPROVED'
     ORDER BY p.updated_at DESC
     LIMIT 500`
  ).all();

  return json({ ok: true, data: rows.results || [] });
};
