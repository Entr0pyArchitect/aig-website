-- Add Cybersecurity solutions category and quote-based security service products.
-- Idempotent migration for existing AIG D1 databases.

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO product_categories (name, description, sort_order)
VALUES ('Cybersecurity solutions', 'Authorized security audits, scoped penetration testing, defensive tooling, and security-focused software support.', 50);

INSERT OR REPLACE INTO products (id, slug, name, description, price_cents, inventory_count, product_type, image_url, active, sort_order, updated_at)
VALUES
  (210, 'security-audit', 'Security Audit', 'Quote-based security review for websites, applications, workflows, configurations, and small business technology environments with practical findings and remediation guidance.', 0, 0, 'service', NULL, 1, 100, datetime('now')),
  (211, 'authorized-penetration-testing', 'Authorized Penetration Testing', 'Scoped penetration testing for authorized environments, focused on validation, documentation, and responsible remediation planning.', 0, 0, 'service', NULL, 1, 110, datetime('now')),
  (212, 'custom-security-software', 'Custom Security Software', 'Custom defensive software, internal security utilities, dashboards, automation, reporting tools, and workflow support for authorized business use.', 0, 0, 'software', NULL, 1, 120, datetime('now'));

INSERT OR REPLACE INTO product_catalog_metadata (product_id, price_label, pricing_model, quote_prompt, compliance_note, updated_at)
VALUES
  (210, 'Quoted', 'quote', 'Tell us the system or website scope, ownership/authorization, goals, timeline, technology stack, and specific security concerns.', 'Authorized systems only. Written scope and permission required before review.', datetime('now')),
  (211, 'Quoted', 'quote', 'Tell us the authorized target scope, testing window, rules of engagement, business goals, contact path, and reporting requirements.', 'Written authorization and rules of engagement are required before any testing.', datetime('now')),
  (212, 'Quoted', 'quote', 'Tell us the workflow, users, environment, data sources, reporting needs, integrations, and security goals.', 'Defensive and authorized-use projects only.', datetime('now'));

DELETE FROM product_category_map WHERE product_id IN (210, 211, 212);

INSERT INTO product_category_map (product_id, category_id)
SELECT 210, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');

INSERT INTO product_category_map (product_id, category_id)
SELECT 211, id FROM product_categories WHERE name IN ('Cybersecurity solutions');

INSERT INTO product_category_map (product_id, category_id)
SELECT 212, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
