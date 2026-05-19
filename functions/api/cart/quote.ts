import { json, readJson, type Env } from "../../types";

type Body = {
  items: { product_id: number; quantity: number }[];
};

const fallbackPrices: Record<number, number> = {
  101: 7900,
  102: 14900,
  103: 9900,
  104: 1900,
  105: 5900,
  106: 12500
};

function safeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) return 1;
  if (quantity > 10) return 10;
  return quantity;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<Body>(request);

  if (!body.items?.length) {
    return json({ ok: true, data: { total_cents: 0, currency: "USD" } });
  }

  if (!env.DB) {
    const total = body.items.reduce((sum, item) => {
      return sum + (fallbackPrices[item.product_id] || 0) * safeQuantity(item.quantity);
    }, 0);

    return json({ ok: true, data: { total_cents: total, currency: "USD" } });
  }

  const ids = body.items.map((item) => Number(item.product_id)).filter((id) => Number.isInteger(id) && id > 0).slice(0, 50);

  if (!ids.length) {
    return json({ ok: true, data: { total_cents: 0, currency: "USD" } });
  }

  const placeholders = ids.map(() => "?").join(",");

  const result = await env.DB.prepare(
    `SELECT id, price_cents FROM products WHERE id IN (${placeholders}) AND active = 1`
  ).bind(...ids).all<{ id: number; price_cents: number }>();

  const total = (result.results || []).reduce((sum, product) => {
    const item = body.items.find((cartItem) => cartItem.product_id === product.id);
    return sum + product.price_cents * safeQuantity(item?.quantity || 1);
  }, 0);

  return json({ ok: true, data: { total_cents: total, currency: "USD" } });
};
