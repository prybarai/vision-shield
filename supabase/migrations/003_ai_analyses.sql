-- AI Analyses table for the new AI-powered flow
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  ai_analysis TEXT NOT NULL,
  materials_list JSONB,
  cost_estimate JSONB,
  diy_vs_pro TEXT,
  skill_level TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new project_type column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT FALSE;

-- Update projects status enum to include AI statuses
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'estimated', 'brief_generated', 'lead_submitted', 'ai_analyzed', 'ai_processing'));

-- Enable RLS on ai_analyses
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_analyses
CREATE POLICY "Service role manages ai_analyses" ON ai_analyses USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own ai_analyses" ON ai_analyses FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE 
    homeowner_id IN (SELECT id FROM homeowners WHERE auth_user_id = auth.uid())
    OR session_id = current_setting('app.session_id', true)
  )
);

-- Index for faster queries
CREATE INDEX idx_ai_analyses_project_id ON ai_analyses(project_id);
CREATE INDEX idx_ai_analyses_created_at ON ai_analyses(created_at DESC);