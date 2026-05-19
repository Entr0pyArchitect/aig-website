PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK(inventory_count >= 0),
  product_type TEXT NOT NULL CHECK(product_type IN ('hardware', 'software', 'service', 'subscription')),
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  btc_address TEXT,
  btc_tx_hash TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'reviewing', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);



CREATE TABLE IF NOT EXISTS payment_records (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT,
  support_ticket_id TEXT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('BTC', 'PAYPAL', 'MANUAL')),
  provider_reference TEXT,
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'submitted', 'paid', 'validated', 'failed', 'refunded', 'cancelled')),
  customer_name TEXT,
  customer_email TEXT,
  btc_address TEXT,
  btc_tx_hash TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (quote_request_id) REFERENCES quote_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (support_ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS checkout_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING', 'PROCESSING', 'DENIED', 'APPROVED')),
  payment_method TEXT NOT NULL
    CHECK(payment_method IN ('BTC', 'PAYPAL', 'CARD', 'APPLE_PAY', 'CASH_APP', 'MANUAL')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  items_json TEXT NOT NULL,
  order_description TEXT NOT NULL,
  payment_record_id TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  btc_tx_hash TEXT,
  denial_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (payment_record_id) REFERENCES payment_records(id) ON DELETE SET NULL
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

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_product_codes_code ON product_codes(code);
CREATE INDEX IF NOT EXISTS idx_checkout_ticket_items_ticket ON checkout_ticket_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_checkout_ticket_items_product ON checkout_ticket_items(product_id);
CREATE INDEX IF NOT EXISTS idx_checkout_ticket_items_number ON checkout_ticket_items(ticket_number);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_method ON payment_records(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_records_created ON payment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_email ON payment_records(customer_email);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_status ON checkout_tickets(status);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_payment_method ON checkout_tickets(payment_method);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_email ON checkout_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_created ON checkout_tickets(created_at);