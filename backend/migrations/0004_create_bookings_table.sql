-- Bookings table for appointment lifecycle management
CREATE TABLE bookings (
  id CHAR(26) PRIMARY KEY,
  service_id CHAR(26) NOT NULL REFERENCES services(id),
  customer_id CHAR(26) NOT NULL REFERENCES users(id),
  provider_id CHAR(26) NOT NULL REFERENCES providers(id),
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  price_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  client_notes TEXT,
  provider_notes TEXT,
  cancellation_reason TEXT,
  cancelled_by CHAR(26),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_ts ON bookings(start_ts);
CREATE INDEX idx_bookings_provider_status ON bookings(provider_id, status);

-- Booking status enum values:
-- requested: Initial state when customer requests booking
-- confirmed: Provider has confirmed the booking
-- in_progress: Booking is currently happening
-- completed: Booking has been completed
-- cancelled: Booking was cancelled

-- Prevent double-booking: unique constraint on provider + overlapping time slots
-- This is enforced at application level with SELECT FOR UPDATE
