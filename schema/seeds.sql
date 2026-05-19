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

CREATE TABLE IF NOT EXISTS product_codes (
  product_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_sequence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkout_ticket_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  product_id INTEGER,
  product_code TEXT,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(unit_price_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES checkout_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
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

DELETE FROM checkout_ticket_items;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_category_map;
DELETE FROM product_catalog_metadata;
DELETE FROM product_codes;
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


-- Expanded cybersecurity catalog rows
INSERT OR IGNORE INTO product_categories (name, description, sort_order)
VALUES ('Cybersecurity solutions', 'Authorized security audits, scoped penetration testing, defensive tooling, and security-focused software support.', 50);

INSERT OR REPLACE INTO products (id, slug, name, description, price_cents, inventory_count, product_type, image_url, active, sort_order, updated_at)
VALUES
  (210, 'cybersecurity-consultation-strategy', 'Cybersecurity Consultation and Strategy', 'General cybersecurity consulting for individuals, students, creators, small businesses, and technical teams that need direction, planning, or security guidance.', 0, 0, 'service', NULL, 1, 110, datetime('now')),
  (211, 'penetration-testing-security-audit', 'Penetration Testing and Security Audit', 'Authorized security testing for systems, websites, applications, networks, and business environments before attackers can exploit weaknesses.', 0, 0, 'service', NULL, 1, 111, datetime('now')),
  (212, 'vulnerability-assessment', 'Vulnerability Assessment', 'Lower-cost review focused on identifying, prioritizing, and explaining vulnerabilities without deep exploitation.', 0, 0, 'service', NULL, 1, 112, datetime('now')),
  (213, 'digital-forensics-incident-response', 'Digital Forensics and Incident Response', 'Investigation and triage support for suspicious activity, compromised accounts, unusual device behavior, exposed credentials, and security incidents.', 0, 0, 'service', NULL, 1, 113, datetime('now')),
  (214, 'windows-linux-hardening', 'Windows and Linux Hardening', 'Security hardening for Windows 11 systems, Linux desktops, Kali lab systems, servers, and development machines.', 0, 0, 'service', NULL, 1, 114, datetime('now')),
  (215, 'network-wifi-security-review', 'Network and Wi-Fi Security Review', 'Review of routers, Wi-Fi configuration, segmentation, exposed services, firewall posture, guest networks, and small-business or home-lab topology.', 0, 0, 'service', NULL, 1, 115, datetime('now')),
  (216, 'secure-software-github-review', 'Secure Software and GitHub Security Review', 'Security-focused review of codebases, GitHub repositories, scripts, websites, and project workflows.', 0, 0, 'service', NULL, 1, 116, datetime('now')),
  (217, 'git-hygiene-secret-prevention', 'Git Hygiene and Secret Prevention Setup', 'Focused setup for preventing accidental leaks of API keys, tokens, private files, credentials, and sensitive data in Git repositories.', 0, 0, 'service', NULL, 1, 117, datetime('now')),
  (218, 'cloud-account-identity-security-review', 'Cloud, Account, and Identity Security Review', 'Review of MFA, recovery options, access permissions, admin roles, email security, cloud sharing, and account-security basics.', 0, 0, 'service', NULL, 1, 118, datetime('now')),
  (219, 'purple-team-lab-design', 'Purple-Team Lab Design and Training Environment Setup', 'Design support for safe red-team/blue-team labs used for learning, testing, detection engineering, and cybersecurity education.', 0, 0, 'service', NULL, 1, 119, datetime('now')),
  (220, 'detection-engineering-starter-package', 'Detection Engineering Starter Package', 'Starter package for basic detection logic, logging workflows, and defensive monitoring structure.', 0, 0, 'service', NULL, 1, 120, datetime('now')),
  (221, 'security-documentation-policy-development', 'Security Documentation and Policy Development', 'Professional security documents for individuals, students, startups, and small businesses building security maturity.', 0, 0, 'service', NULL, 1, 121, datetime('now')),
  (222, 'security-awareness-training', 'Security Awareness Training', 'Practical cybersecurity training for non-technical users, students, employees, and small teams.', 0, 0, 'service', NULL, 1, 122, datetime('now')),
  (223, 'cybersecurity-tutoring-students', 'Cybersecurity Tutoring for Students', 'One-on-one or small-group tutoring for cybersecurity concepts, labs, assignments, portfolios, Linux, networking, Python, and ethical hacking basics.', 0, 0, 'service', NULL, 1, 123, datetime('now')),
  (224, 'osint-scam-documentation-reporting', 'OSINT, Scam Documentation, and Reporting Support', 'Support for documenting scams, suspicious online behavior, public-source findings, and report-ready evidence packets.', 0, 0, 'service', NULL, 1, 124, datetime('now')),
  (225, 'opsec-checklist-template', 'OPSEC Checklist Template', 'Structured operational-security checklist for identity separation, alias tracking, account hygiene, device security, browser hygiene, metadata awareness, and social media safety.', 2900, 0, 'software', NULL, 1, 125, datetime('now')),
  (226, 'security-audit-template', 'Security Audit Template', 'Professional template for documenting assets, risks, vulnerabilities, controls, findings, impact, likelihood, remediation status, and follow-up actions.', 4900, 0, 'software', NULL, 1, 126, datetime('now')),
  (227, 'penetration-test-scope-report-template', 'Penetration Test Scope and Report Template', 'Documentation package including authorization, scope, rules of engagement, methodology, findings format, risk ratings, remediation tracking, and final report structure.', 7900, 0, 'software', NULL, 1, 127, datetime('now')),
  (228, 'small-business-cyber-defense-starter-kit', 'Small Business Cyber Defense Starter Kit', 'Bundled checklist and implementation package for small businesses that need practical security without enterprise complexity.', 14900, 0, 'software', NULL, 1, 128, datetime('now')),
  (229, 'windows-linux-hardening-playbook', 'Windows and Linux Hardening Playbook', 'Step-by-step defensive hardening guide for Windows 11 and Linux systems.', 9900, 0, 'software', NULL, 1, 129, datetime('now')),
  (230, 'github-security-hygiene-kit', 'GitHub Security Hygiene Kit', 'Security kit for developers and students publishing code online, including gitignore, secret scanning, pre-commit checks, and release-readiness notes.', 7900, 0, 'software', NULL, 1, 130, datetime('now')),
  (231, 'purple-team-lab-blueprint', 'Purple-Team Lab Blueprint', 'Safe lab-design blueprint for ethical hacking, blue-team monitoring, CTF training, and cybersecurity portfolio development.', 14900, 0, 'software', NULL, 1, 131, datetime('now')),
  (232, 'incident-response-binder', 'Incident Response Binder', 'Practical incident response packet for individuals and small businesses with intake forms, timelines, evidence checklists, recovery steps, and post-incident review.', 9900, 0, 'software', NULL, 1, 132, datetime('now')),
  (233, 'cybersecurity-student-roadmap-pack', 'Cybersecurity Student Roadmap Pack', 'Student-focused roadmap for learning cybersecurity, building labs, documenting projects, improving GitHub, preparing for CTFs, and developing a portfolio.', 9900, 0, 'software', NULL, 1, 133, datetime('now')),
  (234, 'secure-software-launch-checklist', 'Secure Software Launch Checklist', 'Pre-release security checklist for websites, small apps, APIs, scripts, and public GitHub projects.', 7900, 0, 'software', NULL, 1, 134, datetime('now'));

INSERT OR REPLACE INTO product_catalog_metadata (product_id, price_label, pricing_model, quote_prompt, compliance_note, updated_at)
VALUES
  (210, 'Quoted', 'quote', 'Tell us the environment, goals, current concerns, user count, account/platform scope, timeline, and what decisions you need help making.', 'Authorized advisory work only. No unauthorized access, credential theft, or harmful activity.', datetime('now')),
  (211, 'Quoted', 'quote', 'Tell us the authorized scope, testing window, rules of engagement, target type, business goals, reporting needs, and approval contact.', 'Written authorization and rules of engagement are required before any testing.', datetime('now')),
  (212, '$500+', 'quote', 'Tell us the systems, websites, devices, or accounts to review, ownership/authorization, and reporting expectations.', 'Authorized systems only. Exploitation depth must be agreed in writing.', datetime('now')),
  (213, 'Quoted', 'quote', 'Tell us what happened, affected accounts/devices, timeline, available evidence, urgency, and legal/evidence-handling needs.', 'Legal-sensitive matters may require certified forensic or legal professionals.', datetime('now')),
  (214, '$250+', 'quote', 'Tell us the operating systems, device count, user roles, current risks, and whether the work is personal, lab, or business-focused.', 'Hardening recommendations depend on ownership, business needs, and backup readiness.', datetime('now')),
  (215, '$300+', 'quote', 'Tell us the network size, router/Wi-Fi setup, ownership, business goals, and whether segmentation or monitoring is needed.', 'Authorized networks only. No testing against third-party networks.', datetime('now')),
  (216, '$250+', 'quote', 'Tell us repository size, language stack, deployment path, whether secrets were exposed, and your release timeline.', 'Repository access must be authorized by the owner or maintainer.', datetime('now')),
  (217, '$150+', 'quote', 'Tell us the repository platform, number of repos, current secret-scanning status, and whether cleanup guidance is needed.', 'Do not send secrets for review. Rotate exposed secrets before remediation work.', datetime('now')),
  (218, '$150+', 'quote', 'Tell us the platforms, user count, admin roles, MFA status, and business/personal account goals.', 'Customers must own or administer the reviewed accounts.', datetime('now')),
  (219, '$300+', 'quote', 'Tell us the student/business purpose, hardware, virtualization setup, network layout, and safe testing boundaries.', 'Training labs must be isolated and authorized.', datetime('now')),
  (220, '$750+', 'quote', 'Tell us the environment, log sources, defensive goals, lab/business context, and reporting needs.', 'Defensive monitoring only. Data sources must be authorized.', datetime('now')),
  (221, '$150+', 'quote', 'Tell us the documents needed, organization type, audience, policy requirements, and timeline.', 'Policy templates are guidance documents and are not legal advice.', datetime('now')),
  (222, '$150+', 'quote', 'Tell us the audience, group size, preferred topics, technical level, and delivery format.', 'Training is educational and defensive only.', datetime('now')),
  (223, 'Quoted', 'quote', 'Tell us the class/topic, current skill level, goals, timeline, and whether the support is for labs, portfolio, CTF, or capstone planning.', 'Tutoring is educational and ethical. It does not include cheating, bypassing school systems, or unauthorized activity.', datetime('now')),
  (224, '$150+', 'quote', 'Tell us what happened, what public evidence exists, what platforms are involved, and what report output is needed.', 'No doxxing, harassment, stalking, unauthorized access, or illegal surveillance.', datetime('now')),
  (225, '$29+', 'fixed', 'Tell us if you need a customized version for personal, student, creator, or business use.', 'Template guidance only. Does not guarantee anonymity or legal protection.', datetime('now')),
  (226, '$49+', 'fixed', 'Tell us if you need a customized branded version.', 'Template only. Professional judgment is required for real audits.', datetime('now')),
  (227, '$79+', 'fixed', 'Tell us if you need a custom branded version for a class, portfolio, or small consulting workflow.', 'Template does not authorize testing. Written permission is still required.', datetime('now')),
  (228, '$149+', 'fixed', 'Tell us if you need implementation support or a customized version.', 'Digital kit is guidance; implementation support is quoted separately.', datetime('now')),
  (229, '$99+', 'fixed', 'Tell us if you need a custom environment version.', 'Guidance must be adapted to your environment and backup plan.', datetime('now')),
  (230, '$79+', 'fixed', 'Tell us if you want a walkthrough or repository setup.', 'Do not include secrets in support requests.', datetime('now')),
  (231, '$149+', 'fixed', 'Tell us if you need a custom lab design.', 'Labs should be isolated and used only for authorized learning.', datetime('now')),
  (232, '$99+', 'fixed', 'Tell us if you need a customized business binder.', 'Not a substitute for legal counsel or certified forensic services.', datetime('now')),
  (233, '$99+', 'fixed', 'Tell us if you need a custom student plan.', 'Educational support only. Does not include dishonest academic assistance.', datetime('now')),
  (234, '$79+', 'fixed', 'Tell us if you need a custom launch review.', 'Checklist guidance only; production review may require a quoted service.', datetime('now'));

INSERT OR REPLACE INTO product_codes (product_id, code, updated_at)
VALUES
  (210, 'CYB-CONSULT', datetime('now')),
  (211, 'CYB-PENTEST', datetime('now')),
  (212, 'CYB-VA', datetime('now')),
  (213, 'CYB-DFIR', datetime('now')),
  (214, 'CYB-HARDEN', datetime('now')),
  (215, 'CYB-NET', datetime('now')),
  (216, 'CYB-GH', datetime('now')),
  (217, 'CYB-GIT', datetime('now')),
  (218, 'CYB-ID', datetime('now')),
  (219, 'CYB-LAB', datetime('now')),
  (220, 'CYB-DETECT', datetime('now')),
  (221, 'CYB-DOC', datetime('now')),
  (222, 'CYB-AWARE', datetime('now')),
  (223, 'CYB-TUTOR', datetime('now')),
  (224, 'CYB-OSINT', datetime('now')),
  (225, 'CYB-OPSEC-KIT', datetime('now')),
  (226, 'CYB-AUDIT-TPL', datetime('now')),
  (227, 'CYB-PENTEST-TPL', datetime('now')),
  (228, 'CYB-SMB-KIT', datetime('now')),
  (229, 'CYB-HARDEN-PLAY', datetime('now')),
  (230, 'CYB-GH-KIT', datetime('now')),
  (231, 'CYB-LAB-BLUE', datetime('now')),
  (232, 'CYB-IR-BINDER', datetime('now')),
  (233, 'CYB-STUDENT-ROAD', datetime('now')),
  (234, 'CYB-LAUNCH', datetime('now'));

DELETE FROM product_category_map WHERE product_id BETWEEN 210 AND 234;

INSERT INTO product_category_map (product_id, category_id)
SELECT 210, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 211, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 212, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 213, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 214, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 215, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Industrial equipment');
INSERT INTO product_category_map (product_id, category_id)
SELECT 216, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 217, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 218, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 219, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 220, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 221, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 222, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 223, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 224, id FROM product_categories WHERE name IN ('Cybersecurity solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 225, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 226, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 227, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 228, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 229, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 230, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 231, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 232, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 233, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');
INSERT INTO product_category_map (product_id, category_id)
SELECT 234, id FROM product_categories WHERE name IN ('Cybersecurity solutions', 'Software solutions');

INSERT OR REPLACE INTO product_codes (product_id, code, updated_at)
VALUES
  (201, 'HW-MOTOR', datetime('now')),
  (202, 'HW-NEMA-PCB', datetime('now')),
  (203, 'HW-COOL', datetime('now')),
  (204, 'HW-PCB-DESIGN', datetime('now')),
  (205, 'HW-STEPPER', datetime('now')),
  (206, 'SW-SOLUTIONS', datetime('now')),
  (207, 'CONSULT-TECH', datetime('now')),
  (208, 'HW-SCI-APP', datetime('now')),
  (209, 'HW-SIGNAL', datetime('now'));
