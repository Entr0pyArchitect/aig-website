-- AIG Major Development Wrap Catalog Migration
-- Updates product catalog, categories, metadata, and quote request support.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS product_category_map (
  product_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_catalog_metadata (
  product_id INTEGER PRIMARY KEY,
  price_label TEXT NOT NULL DEFAULT 'Quoted',
  pricing_model TEXT NOT NULL DEFAULT 'quote' CHECK(pricing_model IN ('fixed', 'quote', 'tba')),
  quote_prompt TEXT,
  compliance_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  support_ticket_id TEXT,
  product_slug TEXT,
  product_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'quote',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'reviewing', 'quoted', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (support_ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests(created_at);

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_category_map;
DELETE FROM product_catalog_metadata;
DELETE FROM product_categories;
DELETE FROM products;

INSERT INTO product_categories (name, description, sort_order)
VALUES
  ('Embedded systems', 'Controllers, PCBs, hardware interfaces, signal tools, and electronics-centered builds.', 10),
  ('Industrial equipment', 'Motor systems, cooling, controls, apparatus planning, and rugged technical support.', 20),
  ('Manufacturing equipment', 'Build-ready hardware planning, sourcing paths, fixtures, control modules, and production support.', 30),
  ('Software solutions', 'Automation, dashboards, APIs, customer workflows, internal tools, and hardware-supporting software.', 40),
  ('Cybersecurity solutions', 'Authorized security audits, scoped penetration testing, defensive tooling, and security-focused software support.', 50);

INSERT INTO products (id, slug, name, description, price_cents, inventory_count, product_type, image_url, active, sort_order)
VALUES
  (201, 'custom-electric-motors', 'Custom Electric Motors', 'Electric motors built or sourced around customer-defined specifications, including voltage, torque, RPM, size constraints, shaft style, mounting needs, duty cycle, and operating environment.', 0, 0, 'hardware', NULL, 1, 10),
  (202, 'control-pcb-nema-stepper-motors', 'Control PCB for NEMA Stepper Motors', 'Control PCB planning for NEMA stepper motor applications, including driver selection, control inputs, power requirements, protection considerations, and integration planning.', 0, 0, 'hardware', NULL, 1, 20),
  (203, 'water-cooling-blocks', 'Water Cooling Blocks', 'Custom or application-specific water cooling block planning for electronics, prototypes, industrial equipment, and thermal management experiments.', 0, 0, 'hardware', NULL, 1, 30),
  (204, 'pcb-design-customer-applications', 'PCB Design for Customer Applications', 'PCB design support for customer applications, prototypes, embedded builds, controller boards, sensor modules, adapters, and product proof-of-concepts.', 0, 0, 'hardware', NULL, 1, 40),
  (205, 'stepper-motor-controller', 'Stepper Motor Controller', 'Stepper motor controller planning and build support for motion projects, machine interfaces, automation concepts, and embedded control systems.', 0, 0, 'hardware', NULL, 1, 50),
  (206, 'software-solutions', 'Software Solutions', 'Software solutions for dashboards, automation, workflow tools, internal utilities, technical interfaces, and hardware-supporting applications.', 0, 0, 'software', NULL, 1, 60),
  (207, 'technical-consulting', 'Technical Consulting', 'Technical consulting for hardware concepts, embedded systems, manufacturing planning, software decisions, architecture reviews, and project direction.', 0, 0, 'service', NULL, 1, 70),
  (208, 'scientific-apparatus', 'Scientific Apparatus', 'Scientific apparatus planning for lab-style prototypes, measurement setups, experimental tooling, fixtures, control systems, and research-support hardware.', 0, 0, 'hardware', NULL, 1, 80),
  (209, 'signal-analyzer', 'Signal Analyzer', 'Embedded signal analysis concept for lawful lab testing, electronics diagnostics, education, and authorized security research. Designed for legitimate analysis workflows only.', 0, 0, 'hardware', NULL, 1, 90),
  (210, 'security-audit', 'Security Audit', 'Quote-based security review for websites, applications, workflows, configurations, and small business technology environments with practical findings and remediation guidance.', 0, 0, 'service', NULL, 1, 100),
  (211, 'authorized-penetration-testing', 'Authorized Penetration Testing', 'Scoped penetration testing for authorized environments, focused on validation, documentation, and responsible remediation planning.', 0, 0, 'service', NULL, 1, 110),
  (212, 'custom-security-software', 'Custom Security Software', 'Custom defensive software, internal security utilities, dashboards, automation, reporting tools, and workflow support for authorized business use.', 0, 0, 'software', NULL, 1, 120);

INSERT INTO product_catalog_metadata (product_id, price_label, pricing_model, quote_prompt, compliance_note)
VALUES
  (201, 'Quoted', 'quote', 'Tell us voltage, torque, RPM, size limits, shaft style, mounting pattern, quantity, duty cycle, and operating environment.', NULL),
  (202, 'Quoted', 'quote', 'Tell us motor size, current/voltage requirements, controller interface, expected load, quantity, and enclosure constraints.', NULL),
  (203, 'Quoted', 'quote', 'Tell us heat source, dimensions, flow path needs, material preference, fittings, coolant, quantity, and mounting requirements.', NULL),
  (204, 'Quoted', 'quote', 'Tell us board purpose, components, size limits, I/O, voltage/current, quantity, timeline, and whether you need schematics, layout, or fabrication files.', NULL),
  (205, 'Quoted', 'quote', 'Tell us axis count, motor type, power requirements, control method, enclosure needs, feedback/sensor requirements, and expected environment.', NULL),
  (206, 'Quoted', 'quote', 'Tell us the workflow, users, must-have features, platform, integrations, timeline, and whether the software supports hardware or internal operations.', NULL),
  (207, 'Quoted', 'quote', 'Tell us the problem, current stage, constraints, timeline, budget range if known, and what decision or deliverable you need help with.', NULL),
  (208, 'Quoted', 'quote', 'Tell us the experiment/application, required measurements, environmental constraints, materials, controls, timeline, and documentation needs.', NULL),
  (209, 'TBA', 'tba', 'Tell us the signal types, lawful test environment, measurement goals, interfaces, bandwidth needs, and project constraints.', 'For lawful testing, owned equipment, lab diagnostics, education, and authorized research only.'),
  (210, 'Quoted', 'quote', 'Tell us the system or website scope, ownership/authorization, goals, timeline, technology stack, and specific security concerns.', 'Authorized systems only. Written scope and permission required before review.'),
  (211, 'Quoted', 'quote', 'Tell us the authorized target scope, testing window, rules of engagement, business goals, contact path, and reporting requirements.', 'Written authorization and rules of engagement are required before any testing.'),
  (212, 'Quoted', 'quote', 'Tell us the workflow, users, environment, data sources, reporting needs, integrations, and security goals.', 'Defensive and authorized-use projects only.');

INSERT INTO product_category_map (product_id, category_id)
SELECT 201, id FROM product_categories WHERE name IN ('Embedded systems', 'Industrial equipment', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 202, id FROM product_categories WHERE name IN ('Embedded systems', 'Industrial equipment', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 203, id FROM product_categories WHERE name IN ('Industrial equipment', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 204, id FROM product_categories WHERE name IN ('Embedded systems', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 205, id FROM product_categories WHERE name IN ('Embedded systems', 'Industrial equipment', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 206, id FROM product_categories WHERE name IN ('Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 207, id FROM product_categories WHERE name IN ('Embedded systems', 'Industrial equipment', 'Manufacturing equipment', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 208, id FROM product_categories WHERE name IN ('Embedded systems', 'Industrial equipment', 'Manufacturing equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 209, id FROM product_categories WHERE name IN ('Embedded systems');
INSERT INTO product_category_map (product_id, category_id)
SELECT 210, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 211, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 212, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
