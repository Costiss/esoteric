-- Services table for esotheric service offerings
CREATE TABLE services (
  id CHAR(26) PRIMARY KEY,
  provider_id CHAR(26) NOT NULL REFERENCES providers(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  price_cents INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  tags TEXT[],
  metadata JSONB,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
