-- ============================================================
-- Naili Leads Table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now(),

  -- Homeowner info
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL,
  address         text,
  zip_code        text NOT NULL,

  -- Project link
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  project_type    text,
  scope_summary   text,
  photo_urls      jsonb DEFAULT '[]'::jsonb,

  -- Estimate data (enriched from project)
  estimate_low    numeric,
  estimate_mid    numeric,
  estimate_high   numeric,
  budget_range    text,
  brief_summary   text,

  -- Preferences
  preferred_timing text DEFAULT 'within_month',
  priority        text DEFAULT 'quality',
  notes           text,

  -- Lead management
  status          text DEFAULT 'new' NOT NULL,
  source          text DEFAULT 'naili_get_quotes',

  -- Prybar routing
  prybar_routed_at timestamptz,
  prybar_lead_id  text
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_zip ON leads(zip_code);
CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Enable RLS (but allow service role full access)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything (API routes use service role)
CREATE POLICY "Service role full access" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
