// Database types for Supabase
// These types match the database schema defined in supabase/migrations/001_initial_schema.sql

export type UserRole = 'player' | 'admin' | 'general_manager'
export type LeagueStatus = 'draft' | 'active' | 'extension' | 'trade_window' | 'completed'
export type WWEBrand = 'raw' | 'smackdown' | 'nxt'
export type WrestlerStatus = 'active' | 'injured' | 'released'
export type ShowType = 'raw' | 'smackdown' | 'nxt' | 'ple'
export type TitleLevel = 'world' | 'other'
export type VictoryType = 'pin' | 'submission' | 'ko' | 'dq' | 'countout' | 'no_contest'
export type LineupPosition = 'starter' | 'reserve'
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'vetoed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          username: string
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: UserRole
          created_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          commissioner_id: string | null
          current_season: number
          current_quarter: number
          status: LeagueStatus
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          commissioner_id?: string | null
          current_season?: number
          current_quarter?: number
          status?: LeagueStatus
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          commissioner_id?: string | null
          current_season?: number
          current_quarter?: number
          status?: LeagueStatus
          created_at?: string
        }
      }
      league_members: {
        Row: {
          id: string
          league_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      wrestlers: {
        Row: {
          id: string
          name: string
          brand: WWEBrand
          status: WrestlerStatus
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          brand: WWEBrand
          status?: WrestlerStatus
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: WWEBrand
          status?: WrestlerStatus
          photo_url?: string | null
          created_at?: string
        }
      }
      rosters: {
        Row: {
          id: string
          league_id: string
          user_id: string
          season: number
          quarter: number
          budget_remaining: number
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          season: number
          quarter: number
          budget_remaining?: number
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          season?: number
          quarter?: number
          budget_remaining?: number
          created_at?: string
        }
      }
      roster_wrestlers: {
        Row: {
          id: string
          roster_id: string
          wrestler_id: string
          acquisition_cost: number
          is_keeper: boolean
          acquired_at: string
        }
        Insert: {
          id?: string
          roster_id: string
          wrestler_id: string
          acquisition_cost: number
          is_keeper?: boolean
          acquired_at?: string
        }
        Update: {
          id?: string
          roster_id?: string
          wrestler_id?: string
          acquisition_cost?: number
          is_keeper?: boolean
          acquired_at?: string
        }
      }
      lineups: {
        Row: {
          id: string
          roster_id: string
          week: number
          season: number
          quarter: number
          captain_wrestler_id: string | null
          locked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          roster_id: string
          week: number
          season: number
          quarter: number
          captain_wrestler_id?: string | null
          locked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          roster_id?: string
          week?: number
          season?: number
          quarter?: number
          captain_wrestler_id?: string | null
          locked_at?: string | null
          created_at?: string
        }
      }
      lineup_wrestlers: {
        Row: {
          id: string
          lineup_id: string
          wrestler_id: string
          position: LineupPosition
          priority_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          wrestler_id: string
          position: LineupPosition
          priority_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          lineup_id?: string
          wrestler_id?: string
          position?: LineupPosition
          priority_order?: number | null
          created_at?: string
        }
      }
      shows: {
        Row: {
          id: string
          name: string
          event_date: string
          show_type: ShowType
          season: number
          quarter: number
          week: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          event_date: string
          show_type: ShowType
          season: number
          quarter: number
          week: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          event_date?: string
          show_type?: ShowType
          season?: number
          quarter?: number
          week?: number
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          show_id: string
          rating: number
          duration_minutes: number
          is_title_match: boolean
          title_level: TitleLevel | null
          is_main_event: boolean
          is_special_stipulation: boolean
          created_at: string
        }
        Insert: {
          id?: string
          show_id: string
          rating: number
          duration_minutes: number
          is_title_match?: boolean
          title_level?: TitleLevel | null
          is_main_event?: boolean
          is_special_stipulation?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          show_id?: string
          rating?: number
          duration_minutes?: number
          is_title_match?: boolean
          title_level?: TitleLevel | null
          is_main_event?: boolean
          is_special_stipulation?: boolean
          created_at?: string
        }
      }
      match_participants: {
        Row: {
          id: string
          match_id: string
          wrestler_id: string
          is_winner: boolean
          victory_type: VictoryType | null
          has_debut_bonus: boolean
          has_title_defense_bonus: boolean
          has_botch_malus: boolean
          has_short_match_malus: boolean
          has_squash_loss_malus: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          wrestler_id: string
          is_winner?: boolean
          victory_type?: VictoryType | null
          has_debut_bonus?: boolean
          has_title_defense_bonus?: boolean
          has_botch_malus?: boolean
          has_short_match_malus?: boolean
          has_squash_loss_malus?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          wrestler_id?: string
          is_winner?: boolean
          victory_type?: VictoryType | null
          has_debut_bonus?: boolean
          has_title_defense_bonus?: boolean
          has_botch_malus?: boolean
          has_short_match_malus?: boolean
          has_squash_loss_malus?: boolean
          created_at?: string
        }
      }
      points: {
        Row: {
          id: string
          lineup_id: string
          match_id: string
          wrestler_id: string
          base_points: number
          victory_bonus: number
          context_bonus: number
          duration_bonus: number
          narrative_bonus: number
          malus: number
          captain_multiplier: number
          total_points: number
          created_at: string
        }
        Insert: {
          id?: string
          lineup_id: string
          match_id: string
          wrestler_id: string
          base_points: number
          victory_bonus?: number
          context_bonus?: number
          duration_bonus?: number
          narrative_bonus?: number
          malus?: number
          captain_multiplier?: number
          total_points: number
          created_at?: string
        }
        Update: {
          id?: string
          lineup_id?: string
          match_id?: string
          wrestler_id?: string
          base_points?: number
          victory_bonus?: number
          context_bonus?: number
          duration_bonus?: number
          narrative_bonus?: number
          malus?: number
          captain_multiplier?: number
          total_points?: number
          created_at?: string
        }
      }
      draft_bids: {
        Row: {
          id: string
          league_id: string
          season: number
          quarter: number
          wrestler_id: string
          user_id: string
          bid_amount: number
          is_winning_bid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          league_id: string
          season: number
          quarter: number
          wrestler_id: string
          user_id: string
          bid_amount: number
          is_winning_bid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          league_id?: string
          season?: number
          quarter?: number
          wrestler_id?: string
          user_id?: string
          bid_amount?: number
          is_winning_bid?: boolean
          created_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          league_id: string
          proposer_id: string
          receiver_id: string
          status: TradeStatus
          proposed_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          league_id: string
          proposer_id: string
          receiver_id: string
          status?: TradeStatus
          proposed_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          league_id?: string
          proposer_id?: string
          receiver_id?: string
          status?: TradeStatus
          proposed_at?: string
          resolved_at?: string | null
        }
      }
      trade_wrestlers: {
        Row: {
          id: string
          trade_id: string
          wrestler_id: string
          from_user_id: string
          to_user_id: string
        }
        Insert: {
          id?: string
          trade_id: string
          wrestler_id: string
          from_user_id: string
          to_user_id: string
        }
        Update: {
          id?: string
          trade_id?: string
          wrestler_id?: string
          from_user_id?: string
          to_user_id?: string
        }
      }
    }
    Enums: {
      user_role: UserRole
      league_status: LeagueStatus
      wwe_brand: WWEBrand
      wrestler_status: WrestlerStatus
      show_type: ShowType
      title_level: TitleLevel
      victory_type: VictoryType
      lineup_position: LineupPosition
      trade_status: TradeStatus
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
