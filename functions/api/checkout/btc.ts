import { json, readJson, type Env } from "../../types";

type CheckoutBody = {
  items: { product_id: number; quantity: number }[];
};

const fallbackProducts: Record<number, { name: string; price_cents: number }> = {
  101: { name: "Prototype Builder Kit", price_cents: 7900 },
  102: { name: "Automation Starter Pack", price_cents: 14900 },
  103: { name: "Embedded Systems Consult", price_cents: 9900 },
  104: { name: "Device Dashboard Beta", price_cents: 1900 },
  105: { name: "Documentation Kit", price_cents: 5900 },
  106: { name: "Local Tech Support Block", price_cents: 12500 }
};

function safeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) return 1;
  if (quantity > 10) return 10;
  return quantity;
}

/*
  BTC checkout endpoint.
  MVP behavior:
  - Creates a pending order.
  - Returns BTC payment instructions.
  - Does not hold wallet private keys.
  - Does not auto-confirm blockchain transactions yet.
*/
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<CheckoutBody>(request);

  if (!body.items?.length) {
    return json({ ok: false, error: "Cart is empty." }, { status: 400 });
  }

  const orderId = crypto.randomUUID();
  const invoiceId = `AIG-${Date.now().toString(36).toUpperCase()}`;
  const btcAddress = env.BTC_RECEIVE_ADDRESS;
  if (!btcAddress) {
    return json({ ok: false, error: "Bitcoin checkout is temporarily unavailable." }, { status: 503 });
  }

  const network = env.BTC_NETWORK || "Bitcoin mainnet";
  const confirmationsRequired = Number(env.BTC_CONFIRMATIONS_REQUIRED || "1");

  let totalCents = 0;

  if (env.DB) {
    const ids = body.items.map((item) => Number(item.product_id)).filter(Number.isInteger);
    const placeholders = ids.map(() => "?").join(",");

    const products = await env.DB.prepare(
      `SELECT id, name, price_cents FROM products WHERE id IN (${placeholders}) AND active = 1`
    ).bind(...ids).all<{ id: number; name: string; price_cents: number }>();

    totalCents = (products.results || []).reduce((sum, product) => {
      const item = body.items.find((cartItem) => cartItem.product_id === product.id);
      return sum + product.price_cents * safeQuantity(item?.quantity || 1);
    }, 0);

    await env.DB.prepare(
      `INSERT INTO orders (id, invoice_id, status, total_cents, currency, btc_address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(orderId, invoiceId, "pending", totalCents, "USD", btcAddress).run();

    for (const product of products.results || []) {
      const item = body.items.find((cartItem) => cartItem.product_id === product.id);
      await env.DB.prepare(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
         VALUES (?, ?, ?, ?)`
      ).bind(orderId, product.id, safeQuantity(item?.quantity || 1), product.price_cents).run();
    }
  } else {
    totalCents = body.items.reduce((sum, item) => {
      return sum + (fallbackProducts[item.product_id]?.price_cents || 0) * safeQuantity(item.quantity);
    }, 0);
  }

  return json({
    ok: true,
    data: {
      order_id: orderId,
      invoice_id: invoiceId,
      payment_method: "BTC",
      status: "pending",
      total_cents: totalCents,
      currency: "USD",
      btc_address: btcAddress,
      btc_estimate: null,
      network,
      confirmations_required: confirmationsRequired,
      instructions: [
        "Send BTC to the displayed receive address.",
        "Submit the transaction hash after payment.",
        "AIG will manually verify the transaction before fulfillment.",
        "Do not send private keys, seed phrases, or wallet credentials."
      ]
    }
  });
};
