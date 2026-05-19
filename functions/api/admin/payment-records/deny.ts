import { json, readJson, requireAdmin, type Env } from "../../../types";

type Body = {
  payment_id: string;
  reason?: string;
};

/*
  Denies a payment and connected checkout ticket.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const unauthorized = requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const body = await readJson<Body>(request);

  if (!body.payment_id) {
    return json({ ok: false, error: "payment_id is required." }, { status: 400 });
  }

  const reason = body.reason || "Payment denied by admin.";

  if (env.DB) {
    await env.DB.prepare(
      `UPDATE payment_records
       SET status = 'failed', notes = COALESCE(?, notes), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(reason, body.payment_id).run();

    await env.DB.prepare(
      `UPDATE checkout_tickets
       SET status = 'DENIED', denial_reason = ?, updated_at = datetime('now')
       WHERE payment_record_id = ?`
    ).bind(reason, body.payment_id).run();
  }

  return json({ ok: true, data: { payment_id: body.payment_id, status: "DENIED", reason } });
};
