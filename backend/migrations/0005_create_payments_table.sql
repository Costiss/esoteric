-- Payments table for multi-provider payment integration
CREATE TABLE payments (
  id CHAR(26) PRIMARY KEY,
  booking_id CHAR(26) NOT NULL REFERENCES bookings(id),
  customer_id CHAR(26) NOT NULL REFERENCES users(id),
  provider_id CHAR(26) NOT NULL REFERENCES providers(id),
  provider_type TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  provider_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method_id TEXT,
  customer_email TEXT,
  metadata JSONB,
  refunded_amount_cents INTEGER DEFAULT 0,
  commission_amount_cents INTEGER DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_provider_id ON payments(provider_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_type ON payments(provider_type);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);

-- Payment status enum values:
-- pending: Payment created, awaiting payment method
-- requires_payment_method: Payment needs a payment method
-- requires_confirmation: Payment needs confirmation
-- requires_action: Payment requires additional action (3D Secure)
-- processing: Payment is being processed
-- succeeded: Payment was successful
-- canceled: Payment was canceled
-- refunded: Payment was refunded

-- Supported provider types: stripe, mercadopago, pagseguro

-- Commission calculation: platform takes percentage of each transaction
-- Default commission rate: 10% (configurable)
