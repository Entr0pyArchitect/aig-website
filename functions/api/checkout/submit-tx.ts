import { cleanText, json, readJson, type Env } from "../../types";

type Body = {
  order_id: string;
  tx_hash: string;
};

/*
  Submit BTC transaction hash for manual review.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  const txHash = body.tx_hash?.trim();

  if (!body.order_id || !txHash) {
    return json({ ok: false, error: "Order ID and transaction hash are required." }, { status: 400 });
  }

  if (!/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return json({ ok: false, error: "BTC transaction hash must be 64 hexadecimal characters." }, { status: 400 });
  }

  if (env.DB) {
    await env.DB.prepare(
      `UPDATE orders
       SET btc_tx_hash = ?, status = 'processing', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(txHash, body.order_id).run();
  }

  return json({
    ok: true,
    data: {
      order_id: body.order_id,
      tx_hash: txHash,
      status: "processing"
    }
  });
};
