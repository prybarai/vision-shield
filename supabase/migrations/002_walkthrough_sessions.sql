CREATE TABLE walkthrough_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  script_id TEXT NOT NULL,
  script_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  state_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX walkthrough_sessions_trade_idx ON walkthrough_sessions(trade);
CREATE INDEX walkthrough_sessions_updated_at_idx ON walkthrough_sessions(updated_at DESC);

ALTER TABLE walkthrough_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages walkthrough sessions" ON walkthrough_sessions USING (auth.role() = 'service_role');
