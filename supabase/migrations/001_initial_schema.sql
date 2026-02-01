-- =============================================
-- FantaWWE Database Schema
-- Initial Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

-- User roles
CREATE TYPE user_role AS ENUM ('player', 'admin');

-- League status
CREATE TYPE league_status AS ENUM ('draft', 'active', 'extension', 'trade_window', 'completed');

-- WWE Brands
CREATE TYPE wwe_brand AS ENUM ('raw', 'smackdown', 'nxt');

-- Wrestler status
CREATE TYPE wrestler_status AS ENUM ('active', 'injured', 'released');

-- Show types
CREATE TYPE show_type AS ENUM ('raw', 'smackdown', 'nxt', 'ple');

-- Title levels
CREATE TYPE title_level AS ENUM ('world', 'other');

-- Victory types
CREATE TYPE victory_type AS ENUM ('pin', 'submission', 'ko', 'dq', 'countout', 'no_contest');

-- Lineup position
CREATE TYPE lineup_position AS ENUM ('starter', 'reserve');

-- Trade status
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'rejected', 'vetoed');

-- =============================================
-- TABLES
-- =============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'player' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Leagues
CREATE TABLE leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  commissioner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  current_season INT DEFAULT 1 NOT NULL,
  current_quarter INT DEFAULT 1 NOT NULL,
  status league_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. League Members (many-to-many relationship)
CREATE TABLE league_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(league_id, user_id)
);

-- 4. Wrestlers
CREATE TABLE wrestlers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  brand wwe_brand NOT NULL,
  status wrestler_status DEFAULT 'active' NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Rosters
CREATE TABLE rosters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  season INT NOT NULL,
  quarter INT NOT NULL,
  budget_remaining DECIMAL DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(league_id, user_id, season, quarter)
);

-- 6. Roster Wrestlers (wrestlers in a roster)
CREATE TABLE roster_wrestlers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  acquisition_cost DECIMAL NOT NULL,
  is_keeper BOOLEAN DEFAULT FALSE NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(roster_id, wrestler_id)
);

-- 7. Lineups (weekly lineup)
CREATE TABLE lineups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE NOT NULL,
  week INT NOT NULL,
  season INT NOT NULL,
  quarter INT NOT NULL,
  captain_wrestler_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(roster_id, week, season, quarter)
);

-- 8. Lineup Wrestlers
CREATE TABLE lineup_wrestlers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lineup_id UUID REFERENCES lineups(id) ON DELETE CASCADE NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  position lineup_position NOT NULL,
  priority_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(lineup_id, wrestler_id)
);

-- 9. Shows (WWE events)
CREATE TABLE shows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  show_type show_type NOT NULL,
  season INT NOT NULL,
  quarter INT NOT NULL,
  week INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Matches
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  rating DECIMAL NOT NULL CHECK (rating >= 0 AND rating <= 10),
  duration_minutes INT NOT NULL CHECK (duration_minutes >= 0),
  is_title_match BOOLEAN DEFAULT FALSE NOT NULL,
  title_level title_level,
  is_main_event BOOLEAN DEFAULT FALSE NOT NULL,
  is_special_stipulation BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Match Participants
CREATE TABLE match_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  is_winner BOOLEAN DEFAULT FALSE NOT NULL,
  victory_type victory_type,
  has_debut_bonus BOOLEAN DEFAULT FALSE NOT NULL,
  has_title_defense_bonus BOOLEAN DEFAULT FALSE NOT NULL,
  has_botch_malus BOOLEAN DEFAULT FALSE NOT NULL,
  has_short_match_malus BOOLEAN DEFAULT FALSE NOT NULL,
  has_squash_loss_malus BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, wrestler_id)
);

-- 12. Points
CREATE TABLE points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lineup_id UUID REFERENCES lineups(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  base_points DECIMAL NOT NULL,
  victory_bonus DECIMAL DEFAULT 0 NOT NULL,
  context_bonus DECIMAL DEFAULT 0 NOT NULL,
  duration_bonus DECIMAL DEFAULT 0 NOT NULL,
  narrative_bonus DECIMAL DEFAULT 0 NOT NULL,
  malus DECIMAL DEFAULT 0 NOT NULL,
  captain_multiplier DECIMAL DEFAULT 1.0 NOT NULL,
  total_points DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(lineup_id, match_id, wrestler_id)
);

-- 13. Draft Bids
CREATE TABLE draft_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  season INT NOT NULL,
  quarter INT NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bid_amount DECIMAL NOT NULL CHECK (bid_amount >= 1),
  is_winning_bid BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Trades
CREATE TABLE trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status trade_status DEFAULT 'pending' NOT NULL,
  proposed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- 15. Trade Wrestlers
CREATE TABLE trade_wrestlers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  wrestler_id UUID REFERENCES wrestlers(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_rosters_league ON rosters(league_id);
CREATE INDEX idx_rosters_user ON rosters(user_id);
CREATE INDEX idx_roster_wrestlers_roster ON roster_wrestlers(roster_id);
CREATE INDEX idx_roster_wrestlers_wrestler ON roster_wrestlers(wrestler_id);
CREATE INDEX idx_lineups_roster ON lineups(roster_id);
CREATE INDEX idx_lineup_wrestlers_lineup ON lineup_wrestlers(lineup_id);
CREATE INDEX idx_shows_date ON shows(event_date);
CREATE INDEX idx_matches_show ON matches(show_id);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_wrestler ON match_participants(wrestler_id);
CREATE INDEX idx_points_lineup ON points(lineup_id);
CREATE INDEX idx_points_match ON points(match_id);
CREATE INDEX idx_draft_bids_league ON draft_bids(league_id);
CREATE INDEX idx_draft_bids_wrestler ON draft_bids(wrestler_id);
CREATE INDEX idx_trades_league ON trades(league_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_wrestlers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Leagues
CREATE POLICY "Leagues are viewable by members" ON leagues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = leagues.id
      AND league_members.user_id = auth.uid()
    )
    OR commissioner_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create leagues" ON leagues
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Commissioners can update leagues" ON leagues
  FOR UPDATE USING (commissioner_id = auth.uid());

-- League Members
CREATE POLICY "League members viewable by league members" ON league_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = league_members.league_id
      AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join leagues" ON league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wrestlers (public read)
CREATE POLICY "Wrestlers are viewable by everyone" ON wrestlers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage wrestlers" ON wrestlers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Rosters
CREATE POLICY "Rosters viewable by league members" ON rosters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = rosters.league_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own rosters" ON rosters
  FOR ALL USING (user_id = auth.uid());

-- Roster Wrestlers
CREATE POLICY "Roster wrestlers viewable by league members" ON roster_wrestlers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rosters
      JOIN league_members ON league_members.league_id = rosters.league_id
      WHERE rosters.id = roster_wrestlers.roster_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own roster wrestlers" ON roster_wrestlers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rosters
      WHERE rosters.id = roster_wrestlers.roster_id
      AND rosters.user_id = auth.uid()
    )
  );

-- Lineups
CREATE POLICY "Lineups viewable by league members" ON lineups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rosters
      JOIN league_members ON league_members.league_id = rosters.league_id
      WHERE rosters.id = lineups.roster_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own lineups" ON lineups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rosters
      WHERE rosters.id = lineups.roster_id
      AND rosters.user_id = auth.uid()
    )
  );

-- Lineup Wrestlers
CREATE POLICY "Lineup wrestlers viewable by league members" ON lineup_wrestlers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lineups
      JOIN rosters ON rosters.id = lineups.roster_id
      JOIN league_members ON league_members.league_id = rosters.league_id
      WHERE lineups.id = lineup_wrestlers.lineup_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own lineup wrestlers" ON lineup_wrestlers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lineups
      JOIN rosters ON rosters.id = lineups.roster_id
      WHERE lineups.id = lineup_wrestlers.lineup_id
      AND rosters.user_id = auth.uid()
    )
  );

-- Shows (public read)
CREATE POLICY "Shows are viewable by everyone" ON shows
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage shows" ON shows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Matches (public read)
CREATE POLICY "Matches are viewable by everyone" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage matches" ON matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Match Participants (public read)
CREATE POLICY "Match participants are viewable by everyone" ON match_participants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage match participants" ON match_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Points
CREATE POLICY "Points viewable by league members" ON points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lineups
      JOIN rosters ON rosters.id = lineups.roster_id
      JOIN league_members ON league_members.league_id = rosters.league_id
      WHERE lineups.id = points.lineup_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage points" ON points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Draft Bids
CREATE POLICY "Draft bids viewable by league members" ON draft_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = draft_bids.league_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can place own bids" ON draft_bids
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trades
CREATE POLICY "Trades viewable by participants" ON trades
  FOR SELECT USING (
    proposer_id = auth.uid() OR receiver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = trades.league_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trades" ON trades
  FOR INSERT WITH CHECK (proposer_id = auth.uid());

CREATE POLICY "Participants can update trades" ON trades
  FOR UPDATE USING (proposer_id = auth.uid() OR receiver_id = auth.uid());

-- Trade Wrestlers
CREATE POLICY "Trade wrestlers viewable by trade participants" ON trade_wrestlers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_wrestlers.trade_id
      AND (trades.proposer_id = auth.uid() OR trades.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Trade proposers can manage trade wrestlers" ON trade_wrestlers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_wrestlers.trade_id
      AND trades.proposer_id = auth.uid()
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    'player'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate total points for a lineup
CREATE OR REPLACE FUNCTION get_lineup_total_points(lineup_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(total_points) FROM points WHERE lineup_id = lineup_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get weekly standings for a league
CREATE OR REPLACE FUNCTION get_weekly_standings(
  league_uuid UUID,
  target_season INT,
  target_quarter INT,
  target_week INT
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  total_points DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    COALESCE(SUM(pts.total_points), 0) as total_points
  FROM profiles p
  JOIN rosters r ON r.user_id = p.id
  JOIN lineups l ON l.roster_id = r.id
  LEFT JOIN points pts ON pts.lineup_id = l.id
  WHERE r.league_id = league_uuid
    AND r.season = target_season
    AND r.quarter = target_quarter
    AND l.week = target_week
  GROUP BY p.id, p.username
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql STABLE;
