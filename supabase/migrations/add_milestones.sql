-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'kickoff', 'training', 'golive', 'review', 'other'
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'in_progress', 'completed'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_date ON milestones(date);

-- Add RLS policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Users can only see milestones for projects they have access to
CREATE POLICY "Users can view milestones for their projects"
  ON milestones FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can insert milestones for their projects
CREATE POLICY "Users can insert milestones for their projects"
  ON milestones FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update milestones for their projects
CREATE POLICY "Users can update milestones for their projects"
  ON milestones FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can delete milestones for their projects
CREATE POLICY "Users can delete milestones for their projects"
  ON milestones FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
