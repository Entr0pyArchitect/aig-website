import { json, requireAdmin, type Env } from "../../types";

/*
  Admin quote request list.
  Protected by ADMIN_SECRET until full auth exists.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!env.DB) return json({ ok: true, data: [] });

  try {
    const quotes = await env.DB.prepare(
      `SELECT id, support_ticket_id, product_slug, product_name, name, email, topic, status, created_at
       FROM quote_requests ORDER BY created_at DESC LIMIT 50`
    ).all();

    return json({ ok: true, data: quotes.results || [] });
  } catch {
    return json({ ok: true, data: [] });
  }
};
