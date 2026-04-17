ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS scope_summary TEXT,
  ADD COLUMN IF NOT EXISTS brief_summary TEXT,
  ADD COLUMN IF NOT EXISTS brief_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[],
  ADD COLUMN IF NOT EXISTS estimate_low INTEGER,
  ADD COLUMN IF NOT EXISTS estimate_mid INTEGER,
  ADD COLUMN IF NOT EXISTS estimate_high INTEGER,
  ADD COLUMN IF NOT EXISTS assigned_contractor TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS prybar_routed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outbound_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_routing_error TEXT;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'routed_to_prybar', 'outbound', 'converted', 'closed'));

CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_zip_code ON leads(zip_code);
