import { json, type Env } from "../../types";

/*
  Product detail API.
*/
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ ok: false, error: "Invalid product id." }, { status: 400 });
  if (!env.DB) return json({ ok: false, error: "Product lookup is temporarily unavailable." }, { status: 503 });

  const product = await env.DB.prepare(
    `SELECT id, slug, name, description, price_cents, inventory_count, product_type, image_url
     FROM products WHERE id = ? AND active = 1`
  ).bind(id).first();

  if (!product) return json({ ok: false, error: "Product not found." }, { status: 404 });
  return json({ ok: true, data: product });
};
