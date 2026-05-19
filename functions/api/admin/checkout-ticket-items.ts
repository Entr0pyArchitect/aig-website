import { json, requireAdmin, type Env } from "../../types";

/*
  Internal/admin checkout ticket item export.
  Used by the automation server to export structured product-level ticket data.
*/
type LegacyTicketRow = {
  id: string;
  ticket_number: string;
  items_json: string;
  created_at: string;
};

type LegacyItem = {
  product_id?: number;
  product_code?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unit_price_cents?: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: true, data: [] });
  }

  try {
    const rows = await env.DB.prepare(
      `SELECT
         id,
         ticket_id,
         ticket_number,
         product_id,
         product_code,
         product_name,
         description,
         quantity,
         unit_price_cents,
         created_at
       FROM checkout_ticket_items
       ORDER BY created_at DESC, id DESC
       LIMIT 1000`
    ).all();

    return json({ ok: true, data: rows.results || [] });
  } catch {
    /*
      Fallback for older local databases that have checkout_tickets.items_json
      but not the structured checkout_ticket_items table yet.
    */
    const tickets = await env.DB.prepare(
      `SELECT id, ticket_number, items_json, created_at
       FROM checkout_tickets
       ORDER BY created_at DESC
       LIMIT 500`
    ).all<LegacyTicketRow>();

    const data = [];

    for (const ticket of tickets.results || []) {
      if (!ticket.items_json) continue;

      try {
        const items = JSON.parse(ticket.items_json) as LegacyItem[];

        for (const item of items) {
          data.push({
            id: `${ticket.id}:${item.product_id || item.name || "item"}`,
            ticket_id: ticket.id,
            ticket_number: ticket.ticket_number,
            product_id: item.product_id || null,
            product_code: item.product_code || null,
            product_name: item.name || "Legacy item",
            description: item.description || "",
            quantity: Number(item.quantity || 1),
            unit_price_cents: Number(item.unit_price_cents || 0),
            created_at: ticket.created_at
          });
        }
      } catch {
        // Ignore malformed legacy JSON and continue exporting valid rows.
      }
    }

    return json({ ok: true, data });
  }
};
