import { Tables, WWEBrand, WrestlerStatus } from './database'

export type Wrestler = Tables<'wrestlers'>

export interface WrestlerWithStats extends Wrestler {
  totalMatches?: number
  averageRating?: number
  totalPoints?: number
}

export interface WrestlerCreateInput {
  name: string
  brand: WWEBrand
  status?: WrestlerStatus
  photoUrl?: string | null
}

export interface WrestlerUpdateInput {
  name?: string
  brand?: WWEBrand
  status?: WrestlerStatus
  photoUrl?: string | null
}

export interface WrestlerFilter {
  brand?: WWEBrand
  status?: WrestlerStatus
  search?: string
}
