-- Provider profiles table for storing esotheric service provider information
CREATE TABLE providers (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL UNIQUE REFERENCES users(id),
  display_name TEXT NOT NULL,
  bio TEXT,
  working_hours JSONB DEFAULT '{}',
  availability_settings JSONB DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_is_verified ON providers(is_verified);
CREATE INDEX idx_providers_is_active ON providers(is_active);
