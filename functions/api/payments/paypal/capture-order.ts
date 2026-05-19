import { cleanText, getPayPalAccessToken, json, paypalBaseUrl, readJson, type Env } from "../../../types";

type Body = {
  payment_id?: string;
  paypal_order_id: string;
};

/*
  Captures an approved PayPal order.
  Only a completed capture moves the ticket to APPROVED.
  Failed/unapproved capture marks the ticket DENIED and payment record failed.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);

  const paypalOrderId = cleanText(body.paypal_order_id, 80);


  if (!/^[A-Z0-9]{8,32}$/i.test(paypalOrderId)) {
    return json({ ok: false, error: "Valid paypal_order_id is required." }, { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken(env);
    const response = await fetch(`${paypalBaseUrl(env)}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    const capture = await response.json() as {
      id?: string;
      status?: string;
      purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string }> } }>;
    };

    if (!response.ok) {
      if (env.DB) {
        await env.DB.prepare(
          `UPDATE payment_records
           SET status = 'failed', notes = COALESCE(notes, ?) , updated_at = datetime('now')
           WHERE paypal_order_id = ?`
        ).bind("PayPal capture failed or order was not approved.", paypalOrderId).run();

        await env.DB.prepare(
          `UPDATE checkout_tickets
           SET status = 'DENIED', denial_reason = ?, updated_at = datetime('now')
           WHERE paypal_order_id = ?`
        ).bind("PayPal capture failed.", paypalOrderId).run();
      }

      return json({ ok: false, error: "PayPal capture failed." }, { status: 502 });
    }

    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    const rawStatus = capture.status || "UNKNOWN";
    const approved = rawStatus === "COMPLETED";

    if (env.DB) {
      await env.DB.prepare(
        `UPDATE payment_records
         SET status = ?, paypal_capture_id = ?, provider_reference = ?, updated_at = datetime('now')
         WHERE paypal_order_id = ?`
      ).bind(
        approved ? "paid" : "failed",
        captureId,
        captureId || paypalOrderId,
        paypalOrderId
      ).run();

      await env.DB.prepare(
        `UPDATE checkout_tickets
         SET status = ?, paypal_capture_id = ?, denial_reason = ?, updated_at = datetime('now')
         WHERE paypal_order_id = ?`
      ).bind(
        approved ? "APPROVED" : "DENIED",
        captureId,
        approved ? null : `PayPal returned ${rawStatus}`,
        paypalOrderId
      ).run();
    }

    return json({
      ok: approved,
      data: {
        paypal_order_id: paypalOrderId,
        paypal_capture_id: captureId,
        status: approved ? "APPROVED" : "DENIED",
        raw_status: rawStatus
      },
      error: approved ? undefined : `PayPal returned ${rawStatus}`
    }, { status: approved ? 200 : 402 });
  } catch (error) {
    return json({
      ok: false,
      error: "PayPal capture failed."
    }, { status: 503 });
  }
};
