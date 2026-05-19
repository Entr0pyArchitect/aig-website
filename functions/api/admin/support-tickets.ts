import { json, requireAdmin, type Env } from "../../types";

/*
  Internal automation endpoint.
  Returns support tickets for spreadsheet sync.
*/
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  if (!env.DB) {
    return json({ ok: true, data: [] });
  }

  const rows = await env.DB.prepare(
    `SELECT id, name, email, topic, status, created_at, updated_at
     FROM support_tickets
     ORDER BY created_at DESC
     LIMIT 500`
  ).all();

  return json({ ok: true, data: rows.results || [] });
};
