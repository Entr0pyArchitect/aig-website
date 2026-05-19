import { json, requireAdmin, type Env } from "../../types";

/*
  Admin order list.
  Protect this with ADMIN_SECRET until a full auth provider is added.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: true, data: [] });
  }

  const orders = await env.DB.prepare(
    `SELECT id, invoice_id, status, total_cents, currency, btc_address, btc_tx_hash, created_at, updated_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT 50`
  ).all();

  return json({ ok: true, data: orders.results || [] });
};
