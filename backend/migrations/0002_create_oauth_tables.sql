-- OAuth2 clients table for storing registered OAuth applications
CREATE TABLE oauth_clients (
  id CHAR(26) PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_secret_hash TEXT,
  redirect_uris JSONB NOT NULL,
  allowed_scopes JSONB NOT NULL DEFAULT '[]',
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Refresh tokens table for durable refresh tokens (hashed)
CREATE TABLE refresh_tokens (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL REFERENCES users(id),
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
  token_hash TEXT UNIQUE NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]',
  expires_at timestamptz NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
