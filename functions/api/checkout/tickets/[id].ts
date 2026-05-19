import { json, type Env } from "../../../types";

/*
  Public ticket lookup by ticket id or ticket number.
  Keep the response scoped to customer-safe status data.
*/
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id || "");

  if (!id) {
    return json({ ok: false, error: "Ticket id is required." }, { status: 400 });
  }

  if (!env.DB) {
    return json({ ok: false, error: "Ticket lookup is temporarily unavailable." }, { status: 503 });
  }

  const ticket = await env.DB.prepare(
    `SELECT id, ticket_number, status, payment_method, amount_cents, currency,
            order_description, created_at, updated_at
     FROM checkout_tickets
     WHERE id = ? OR ticket_number = ?
     LIMIT 1`
  ).bind(id, id).first();

  if (!ticket) {
    return json({ ok: false, error: "Ticket not found." }, { status: 404 });
  }

  return json({ ok: true, data: ticket });
};
