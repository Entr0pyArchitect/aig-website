-- Replace filler catalog items with the first real AIG quote-based products.
-- Safe to run on local or remote D1 after schema.sql is already applied.

DELETE FROM products;

INSERT OR IGNORE INTO products (id, slug, name, description, price_cents, inventory_count, product_type, image_url, active, sort_order)
VALUES
  (201, 'custom-electric-motors', 'Custom Electric Motors', 'Electric motors built or sourced around customer-defined specifications, including voltage, torque, RPM, size constraints, shaft style, mounting needs, and intended operating environment.', 0, 0, 'hardware', NULL, 1, 10),
  (202, 'custom-pcb', 'Custom PCB', 'Custom printed circuit board planning and design support for prototypes, embedded builds, controller boards, sensor modules, and product proof-of-concepts.', 0, 0, 'hardware', NULL, 1, 20);
