import { cleanText, isLikelyBtcTxHash, json, readJson, type Env } from "../../../types";

type Body = {
  payment_id: string;
  tx_hash: string;
};

/*
  Stores a BTC transaction hash for manual validation.
  Invalid hashes are blocked before database update.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  const txHash = body.tx_hash?.trim();

  if (!body.payment_id || !txHash) {
    return json({ ok: false, error: "payment_id and tx_hash are required." }, { status: 400 });
  }

  if (!isLikelyBtcTxHash(txHash)) {
    return json({ ok: false, error: "BTC transaction hash must be 64 hexadecimal characters." }, { status: 400 });
  }

  if (env.DB) {
    await env.DB.prepare(
      `UPDATE payment_records
       SET btc_tx_hash = ?, provider_reference = ?, status = 'submitted', updated_at = datetime('now')
       WHERE id = ? AND payment_method = 'BTC'`
    ).bind(txHash, txHash, body.payment_id).run();

    await env.DB.prepare(
      `UPDATE checkout_tickets
       SET btc_tx_hash = ?, status = 'PROCESSING', updated_at = datetime('now')
       WHERE payment_record_id = ?`
    ).bind(txHash, body.payment_id).run();
  }

  return json({
    ok: true,
    data: {
      payment_id: body.payment_id,
      tx_hash: txHash,
      status: "PROCESSING"
    }
  });
};
