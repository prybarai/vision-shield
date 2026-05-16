-- Contractor early access signups / pro accounts
CREATE TABLE IF NOT EXISTS contractor_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  -- Business details
  trades TEXT[] DEFAULT '{}',           -- e.g. {'bathroom','kitchen','roofing','general'}
  service_zip_codes TEXT[] DEFAULT '{}', -- ZIP codes they serve
  years_experience INTEGER,
  license_number TEXT,
  website_url TEXT,
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  notes TEXT,
  -- Auth link (optional, for when they create an account)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_contractor_signups_email ON contractor_signups(email);
CREATE INDEX IF NOT EXISTS idx_contractor_signups_status ON contractor_signups(status);
CREATE INDEX IF NOT EXISTS idx_contractor_signups_created ON contractor_signups(created_at DESC);
