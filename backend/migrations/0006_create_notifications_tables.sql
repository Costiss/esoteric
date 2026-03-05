-- Push notification tokens for Firebase Cloud Messaging
CREATE TABLE push_tokens (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'ios',
  device_id TEXT,
  app_version TEXT,
  is_active BOOL NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_is_active ON push_tokens(is_active);

-- Support tickets for customer support
CREATE TABLE support_tickets (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) REFERENCES users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  email TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Support ticket messages
CREATE TABLE support_messages (
  id CHAR(26) PRIMARY KEY,
  ticket_id CHAR(26) NOT NULL REFERENCES support_tickets(id),
  user_id CHAR(26) REFERENCES users(id),
  message TEXT NOT NULL,
  is_from_customer BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
