-- Initial Diesel migration stub: create users and services tables using ULID CHAR(26)
CREATE TABLE users (
  id CHAR(26) PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id CHAR(26) PRIMARY KEY,
  provider_id CHAR(26) NOT NULL REFERENCES users(id),
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
