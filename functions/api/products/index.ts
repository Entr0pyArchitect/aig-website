import { json, type Env } from "../../types";

/*
  Products API.
  Uses extended catalog metadata when migration 004 has been applied.
*/
const fallbackProducts = [
  {
    id: 201,
    product_code: "HW-MOTOR",
    slug: "custom-electric-motors",
    name: "Custom Electric Motors",
    description: "Electric motors built or sourced around customer-defined specifications.",
    price_cents: 0,
    price_label: "Quoted",
    pricing_model: "quote",
    inventory_count: 0,
    product_type: "hardware",
    categories: "Embedded systems|Industrial equipment|Manufacturing equipment",
    image_url: null
  }
];

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return json({ ok: true, data: fallbackProducts });

  try {
    const result = await env.DB.prepare(
      `SELECT
         p.id, pc.code AS product_code, p.slug, p.name, p.description, p.price_cents, p.inventory_count,
         p.product_type, p.image_url, m.price_label, m.pricing_model, m.quote_prompt,
         m.compliance_note, group_concat(c.name, '|') AS categories
       FROM products p
       LEFT JOIN product_codes pc ON pc.product_id = p.id
       LEFT JOIN product_catalog_metadata m ON m.product_id = p.id
       LEFT JOIN product_category_map pcm ON pcm.product_id = p.id
       LEFT JOIN product_categories c ON c.id = pcm.category_id
       WHERE p.active = 1
       GROUP BY p.id
       ORDER BY p.sort_order ASC, p.id ASC`
    ).all();

    return json({ ok: true, data: result.results || [] });
  } catch {
    const fallback = await env.DB.prepare(
      `SELECT p.id, pc.code AS product_code, p.slug, p.name, p.description, p.price_cents, p.inventory_count, p.product_type, p.image_url
       FROM products p
       LEFT JOIN product_codes pc ON pc.product_id = p.id
       WHERE p.active = 1 ORDER BY p.sort_order ASC, p.id ASC`
    ).all();

    return json({ ok: true, data: fallback.results || [] });
  }
};
