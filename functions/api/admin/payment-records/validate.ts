import { json, readJson, requireAdmin, type Env } from "../../../types";

type Body = {
  payment_id: string;
  notes?: string;
};

/*
  Manual validation endpoint.
  Use after BTC transaction review or manual purchase confirmation.
  Moves connected checkout ticket to APPROVED.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const body = await readJson<Body>(request);

  if (!body.payment_id) {
    return json({ ok: false, error: "payment_id is required." }, { status: 400 });
  }

  if (env.DB) {
    await env.DB.prepare(
      `UPDATE payment_records
       SET status = 'validated', notes = COALESCE(?, notes), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(body.notes || null, body.payment_id).run();

    await env.DB.prepare(
      `UPDATE checkout_tickets
       SET status = 'APPROVED', denial_reason = NULL, updated_at = datetime('now')
       WHERE payment_record_id = ?`
    ).bind(body.payment_id).run();
  }

  return json({ ok: true, data: { payment_id: body.payment_id, status: "APPROVED" } });
};
