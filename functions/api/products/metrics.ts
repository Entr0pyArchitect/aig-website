import { json, type Env } from "../../types";

/*
  Public product demand metrics.
  Uses approved checkout records only. If there is no real demand data yet,
  the frontend shows a neutral "new product lane" label instead of fake counts.
*/

type RawTicket = {
  items_json?: string | null;
};

type RawItem = {
  product_id?: number;
  product_code?: string;
  name?: string;
  quantity?: number;
};

type MetricRow = {
  product_id: number;
  product_code?: string | null;
  product_name?: string | null;
  approved_count: number;
  approved_quantity: number;
  request_count: number;
  popularity_percent: number;
  label: string;
};

function labelFor(percent: number, quantity: number) {
  if (quantity <= 0 || percent <= 0) return "New product lane";
  if (percent >= 35) return "Frequently requested";
  if (percent >= 15) return "Popular with customers";
  return "Recently requested";
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return json({ ok: true, data: [] });

  const totals = new Map<number, MetricRow>();
  let totalQuantity = 0;

  try {
    const structured = await env.DB.prepare(
      `SELECT product_id, product_code, product_name,
              COUNT(DISTINCT ticket_id) AS approved_count,
              COALESCE(SUM(quantity), 0) AS approved_quantity
       FROM checkout_ticket_items
       WHERE ticket_number IN (
         SELECT ticket_number FROM checkout_tickets WHERE status = 'APPROVED'
       )
       GROUP BY product_id, product_code, product_name`
    ).all<MetricRow>();

    for (const row of structured.results || []) {
      if (!row.product_id) continue;
      const quantity = Number(row.approved_quantity || 0);
      totalQuantity += quantity;
      totals.set(Number(row.product_id), {
        product_id: Number(row.product_id),
        product_code: row.product_code || null,
        product_name: row.product_name || null,
        approved_count: Number(row.approved_count || 0),
        approved_quantity: quantity,
        request_count: 0,
        popularity_percent: 0,
        label: "New product lane"
      });
    }
  } catch {
    const rows = await env.DB.prepare(
      `SELECT items_json FROM checkout_tickets
       WHERE status = 'APPROVED'
       ORDER BY updated_at DESC
       LIMIT 500`
    ).all<RawTicket>();

    for (const ticket of rows.results || []) {
      if (!ticket.items_json) continue;

      try {
        const items = JSON.parse(ticket.items_json) as RawItem[];

        for (const item of items) {
          const productId = Number(item.product_id || 0);
          if (!productId) continue;

          const quantity = Math.max(1, Number(item.quantity || 1));
          totalQuantity += quantity;

          const current = totals.get(productId) || {
            product_id: productId,
            product_code: item.product_code || null,
            product_name: item.name || null,
            approved_count: 0,
            approved_quantity: 0,
            request_count: 0,
            popularity_percent: 0,
            label: "New product lane"
          };

          current.approved_count += 1;
          current.approved_quantity += quantity;
          totals.set(productId, current);
        }
      } catch {
        // Ignore malformed legacy item JSON.
      }
    }
  }

  const data = Array.from(totals.values())
    .map((row) => {
      const percent = totalQuantity > 0
        ? Math.round((row.approved_quantity / totalQuantity) * 100)
        : 0;

      return {
        ...row,
        popularity_percent: percent,
        label: labelFor(percent, row.approved_quantity)
      };
    })
    .sort((a, b) => b.popularity_percent - a.popularity_percent || b.approved_quantity - a.approved_quantity);

  return json({ ok: true, data });
};
