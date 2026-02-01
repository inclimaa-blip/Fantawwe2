import { Tables } from './database'

export type League = Tables<'leagues'>
export type LeagueMember = Tables<'league_members'>

export interface LeagueWithMembers extends League {
  members: LeagueMemberWithProfile[]
}

export interface LeagueMemberWithProfile extends LeagueMember {
  profile: {
    id: string
    username: string
  }
}

export interface LeagueStanding {
  userId: string
  username: string
  totalPoints: number
  rank: number
  weeklyPoints?: number
  quarterlyPoints?: number
}

export interface LeagueCreateInput {
  name: string
  commissionerId: string
}

export interface LeagueJoinInput {
  leagueId: string
  userId: string
}
