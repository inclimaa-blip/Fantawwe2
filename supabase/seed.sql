-- =============================================
-- FantaWWE Seed Data
-- Run this after running migrations
-- =============================================

-- =============================================
-- WWE WRESTLERS (50 popular wrestlers)
-- =============================================

INSERT INTO wrestlers (name, brand, status) VALUES
-- RAW Roster
('Roman Reigns', 'raw', 'active'),
('Cody Rhodes', 'raw', 'active'),
('Seth Rollins', 'raw', 'active'),
('Drew McIntyre', 'raw', 'active'),
('Damian Priest', 'raw', 'active'),
('Jey Uso', 'raw', 'active'),
('Gunther', 'raw', 'active'),
('Sami Zayn', 'raw', 'active'),
('CM Punk', 'raw', 'active'),
('Rhea Ripley', 'raw', 'active'),
('Becky Lynch', 'raw', 'active'),
('Liv Morgan', 'raw', 'active'),
('Bianca Belair', 'raw', 'active'),
('Iyo Sky', 'raw', 'active'),
('Dominik Mysterio', 'raw', 'active'),
('JD McDonagh', 'raw', 'active'),
('Braun Strowman', 'raw', 'active'),

-- SmackDown Roster
('LA Knight', 'smackdown', 'active'),
('Randy Orton', 'smackdown', 'active'),
('Kevin Owens', 'smackdown', 'active'),
('AJ Styles', 'smackdown', 'active'),
('Carmelo Hayes', 'smackdown', 'active'),
('Solo Sikoa', 'smackdown', 'active'),
('Jacob Fatu', 'smackdown', 'active'),
('Tama Tonga', 'smackdown', 'active'),
('The Miz', 'smackdown', 'active'),
('Santos Escobar', 'smackdown', 'active'),
('Andrade', 'smackdown', 'active'),
('Apollo Crews', 'smackdown', 'active'),
('Charlotte Flair', 'smackdown', 'injured'),
('Bayley', 'smackdown', 'active'),
('Naomi', 'smackdown', 'active'),
('Jade Cargill', 'smackdown', 'active'),
('Nia Jax', 'smackdown', 'active'),
('Tiffany Stratton', 'smackdown', 'active'),

-- NXT Roster
('Trick Williams', 'nxt', 'active'),
('Oba Femi', 'nxt', 'active'),
('Ethan Page', 'nxt', 'active'),
('Je''Von Evans', 'nxt', 'active'),
('Wes Lee', 'nxt', 'active'),
('Axiom', 'nxt', 'active'),
('Nathan Frazer', 'nxt', 'active'),
('Tony D''Angelo', 'nxt', 'active'),
('Roxanne Perez', 'nxt', 'active'),
('Giulia', 'nxt', 'active'),
('Kelani Jordan', 'nxt', 'active'),
('Lola Vice', 'nxt', 'active'),
('Jaida Parker', 'nxt', 'active'),
('Sol Ruca', 'nxt', 'active');

-- =============================================
-- CREATE ADMIN USER
-- Note: You'll need to manually create an admin user in Supabase Auth
-- Then run this update with the correct user ID
-- =============================================

-- Example (replace with actual user ID after creating in Auth):
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-admin-user-id';

-- =============================================
-- EXAMPLE LEAGUE
-- =============================================

-- Insert a sample league (requires a user to be commissioner)
-- Run this after creating a user:
/*
INSERT INTO leagues (name, commissioner_id, current_season, current_quarter, status)
VALUES ('FantaWWE League 2024', 'your-user-id', 1, 1, 'draft');
*/

-- =============================================
-- EXAMPLE SHOW AND MATCHES (for testing)
-- =============================================

/*
-- Create a sample show
INSERT INTO shows (name, event_date, show_type, season, quarter, week)
VALUES ('Monday Night RAW', '2024-01-15', 'raw', 1, 1, 1);

-- Get the show ID and create sample matches
INSERT INTO matches (show_id, rating, duration_minutes, is_title_match, title_level, is_main_event, is_special_stipulation)
VALUES
  ('show-id-here', 4.25, 25, true, 'world', true, false),
  ('show-id-here', 3.5, 15, false, null, false, false),
  ('show-id-here', 3.75, 18, true, 'other', false, false);
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Count wrestlers by brand
SELECT brand, COUNT(*) as count FROM wrestlers GROUP BY brand;

-- List all active wrestlers
SELECT name, brand FROM wrestlers WHERE status = 'active' ORDER BY brand, name;
