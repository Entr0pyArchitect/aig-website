-- Development reset migration.
-- Clears test order/cart data first so products can be replaced safely.

PRAGMA foreign_keys = ON;

DELETE FROM order_items;
DELETE FROM orders;

DELETE FROM products;

INSERT INTO products (
  id,
  slug,
  name,
  description,
  price_cents,
  inventory_count,
  product_type,
  image_url,
  active,
  sort_order
)
VALUES
  (
    201,
    'custom-electric-motors',
    'Custom Electric Motors',
    'Electric motors built or sourced around customer-defined specifications, including voltage, torque, RPM, size constraints, shaft style, mounting needs, and intended operating environment.',
    0,
    0,
    'hardware',
    NULL,
    1,
    10
  ),
  (
    202,
    'custom-pcb',
    'Custom PCB',
    'Custom printed circuit board planning and design support for prototypes, embedded builds, controller boards, sensor modules, and product proof-of-concepts.',
    0,
    0,
    'hardware',
    NULL,
    1,
    20
  );