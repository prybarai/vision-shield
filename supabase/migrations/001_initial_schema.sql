-- Homeowners
CREATE TABLE homeowners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id) ON DELETE CASCADE,
  session_id TEXT,
  location_type TEXT NOT NULL CHECK (location_type IN ('interior', 'exterior')),
  project_category TEXT NOT NULL,
  address TEXT,
  zip_code TEXT NOT NULL,
  style_preference TEXT,
  quality_tier TEXT DEFAULT 'mid' CHECK (quality_tier IN ('budget', 'mid', 'premium')),
  uploaded_image_urls TEXT[],
  generated_image_urls TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'estimated', 'brief_generated', 'lead_submitted')),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  low_estimate INTEGER,
  mid_estimate INTEGER,
  high_estimate INTEGER,
  assumptions JSONB,
  risk_notes JSONB,
  estimate_basis TEXT,
  region_multiplier DECIMAL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials Lists
CREATE TABLE material_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL,
  sourcing_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Briefs
CREATE TABLE project_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  homeowner_goals TEXT,
  contractor_notes TEXT,
  site_verification_questions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  homeowner_id UUID REFERENCES homeowners(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  preferred_timing TEXT,
  budget_range TEXT,
  priority TEXT DEFAULT 'quality' CHECK (priority IN ('budget', 'speed', 'quality')),
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'sent', 'claimed', 'converted', 'closed')),
  prybar_lead_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Scans
CREATE TABLE contractor_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  session_id TEXT,
  contractor_name TEXT,
  contractor_phone TEXT,
  contractor_business_name TEXT,
  contractor_website TEXT,
  contractor_license_number TEXT,
  state TEXT,
  license_status TEXT,
  license_data JSONB,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_flags JSONB,
  questionnaire_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Scans
CREATE TABLE quote_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  session_id TEXT,
  project_id UUID REFERENCES projects(id),
  uploaded_file_url TEXT,
  raw_text TEXT,
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  red_flags JSONB,
  missing_terms JSONB,
  questions_to_ask JSONB,
  plain_english_summary TEXT,
  payment_structure_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispute Letters
CREATE TABLE dispute_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID REFERENCES homeowners(id),
  session_id TEXT,
  situation_description TEXT NOT NULL,
  contractor_info JSONB,
  amount_paid INTEGER,
  letter_demand TEXT,
  letter_ag_complaint TEXT,
  letter_bbb TEXT,
  letter_ftc TEXT,
  documentation_checklist JSONB,
  state TEXT,
  acknowledged_not_legal_advice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  homeowner_id UUID REFERENCES homeowners(id),
  event_name TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE homeowners ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Homeowners can view own record" ON homeowners FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Homeowners can update own record" ON homeowners FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Service role can manage homeowners" ON homeowners USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (
  homeowner_id IN (SELECT id FROM homeowners WHERE auth_user_id = auth.uid())
  OR session_id = current_setting('app.session_id', true)
);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (
  homeowner_id IN (SELECT id FROM homeowners WHERE auth_user_id = auth.uid())
  OR session_id = current_setting('app.session_id', true)
);
CREATE POLICY "Service role can manage projects" ON projects USING (auth.role() = 'service_role');
CREATE POLICY "Public can view shared projects" ON projects FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Service role manages estimates" ON estimates USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages material_lists" ON material_lists USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages project_briefs" ON project_briefs USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages leads" ON leads USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages contractor_scans" ON contractor_scans USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages quote_scans" ON quote_scans USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages dispute_letters" ON dispute_letters USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages analytics_events" ON analytics_events USING (auth.role() = 'service_role');
