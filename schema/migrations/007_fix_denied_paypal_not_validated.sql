-- Fix old local/remote test rows where a denied PayPal checkout ticket
-- was correctly marked DENIED but the payment record was not marked failed.

PRAGMA foreign_keys = ON;

UPDATE payment_records
SET status = 'failed',
    notes = COALESCE(notes, 'PayPal capture failed or order was not approved.'),
    updated_at = datetime('now')
WHERE payment_method = 'PAYPAL'
  AND paypal_order_id IN (
    SELECT paypal_order_id
    FROM checkout_tickets
    WHERE status = 'DENIED'
      AND paypal_order_id IS NOT NULL
  );

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
WHERE p.status IN ('paid', 'validated')
  AND COALESCE(t.status, 'APPROVED') = 'APPROVED';
