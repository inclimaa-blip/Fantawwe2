-- Add general_manager role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'general_manager';

-- Update RLS policies to allow general_manager access to leagues
DROP POLICY IF EXISTS "Admins can manage leagues" ON leagues;
CREATE POLICY "Admins and GMs can manage leagues" ON leagues
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'general_manager')
    )
  );

-- General managers can view but not modify wrestlers, shows, matches
-- (they can only manage leagues and draft status)
