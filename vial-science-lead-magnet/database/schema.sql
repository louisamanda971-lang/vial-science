CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  country VARCHAR(100) NOT NULL,
  guide_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_consent_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS leads_marketing_active_idx
  ON leads (marketing_consent, unsubscribed_at);
