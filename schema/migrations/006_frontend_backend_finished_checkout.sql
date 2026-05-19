-- AIG Frontend & Backend Finished Checkout Migration
-- Adds customer-facing checkout tickets with PENDING / PROCESSING / DENIED / APPROVED states.

PRAGMA foreign_keys = ON;

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
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_checkout_tickets_status ON checkout_tickets(status);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_payment_method ON checkout_tickets(payment_method);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_email ON checkout_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_checkout_tickets_created ON checkout_tickets(created_at);

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

CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_method ON payment_records(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_records_created ON payment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_email ON payment_records(customer_email);

DROP VIEW IF EXISTS validated_purchases;

CREATE VIEW validated_purchases AS
SELECT
  p.id,
  p.quote_request_id,
  p.support_ticket_id,
  p.payment_method,
  p.provider_reference,
  p.amount_cents,
  p.currency,
  p.status,
  p.customer_name,
  p.customer_email,
  p.btc_address,
  p.btc_tx_hash,
  p.paypal_order_id,
  p.paypal_capture_id,
  p.notes,
  p.created_at,
  p.updated_at,
  t.ticket_number,
  t.status AS ticket_status,
  t.order_description
FROM payment_records p
LEFT JOIN checkout_tickets t
  ON t.payment_record_id = p.id
  OR t.paypal_order_id = p.paypal_order_id
  OR t.btc_tx_hash = p.btc_tx_hash
WHERE p.status IN ('paid', 'validated');
