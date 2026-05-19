-- AIG Payment System + Server Automation Migration
-- Adds payment records used by BTC, PayPal, admin validation, and spreadsheet automation.

PRAGMA foreign_keys = ON;

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
  id,
  quote_request_id,
  support_ticket_id,
  payment_method,
  provider_reference,
  amount_cents,
  currency,
  status,
  customer_name,
  customer_email,
  btc_address,
  btc_tx_hash,
  paypal_order_id,
  paypal_capture_id,
  notes,
  created_at,
  updated_at
FROM payment_records
WHERE status IN ('paid', 'validated');
