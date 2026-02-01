# FantaWWE - Fantasy Wrestling Game

The ultimate fantasy game for WWE wrestling fans. Draft your roster, set your weekly lineup, and compete with friends based on real match performances!

## Features

- **Auction Draft System**: Bid on your favorite WWE Superstars with a 100-point budget
- **Weekly Lineups**: Set 6 starters + 4 reserves before Monday's Raw deadline
- **Captain Selection**: Choose a captain for 1.5x multiplier on their points
- **Real-Time Scoring**: Points calculated from Cagematch.net ratings
- **League Standings**: Track weekly, quarterly, and seasonal standings
- **Admin Dashboard**: Manage wrestlers, shows, and match results

## Tech Stack

- **Frontend**: Next.js 15+ (App Router, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (free tier compatible)

## Scoring System

### Base Points
- Match rating × 2 (e.g., 4 stars = 8 points)

### Victory Bonuses (per wrestler)
| Type | Bonus |
|------|-------|
| Pin | +1 |
| Submission | +1.5 |
| K.O. | +2 |
| DQ/Count-out | +0.5 |
| No Contest | 0 |

### Context Bonuses (once per player per match)
| Condition | Bonus |
|-----------|-------|
| World Title Match | +4 |
| Other Title Match | +2 |
| Main Event | +3 |
| Special Stipulation | +2 |

### Duration Bonuses (once per player per match)
| Duration | Bonus |
|----------|-------|
| 15-20 minutes | +2 |
| 20-30 minutes | +3 |
| 30+ minutes | +4 |

### Narrative Bonuses (per wrestler)
| Event | Bonus |
|-------|-------|
| Debut/Return | +2 |
| Title Defense | +1 |

### Malus (per wrestler)
| Event | Penalty |
|-------|---------|
| Botch | -2 |
| Short Match (<5 min) | -2 |
| Squash Loss (<2 min) | -2 |

### Captain Multiplier
- Captain's individual points × 1.5

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/fantawwe.git
cd fantawwe
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run database migrations

1. Go to Supabase Dashboard > SQL Editor
2. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`
3. (Optional) Run `supabase/seed.sql` to add sample wrestlers

### 5. Create an admin user

1. Register a user through the app
2. Run this SQL in Supabase to make them admin:

```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

### 6. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
fantawwe/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── admin/           # Admin-only pages
│   │   ├── draft/           # Auction draft interface
│   │   ├── lineup/          # Weekly lineup management
│   │   ├── roster/          # Roster management
│   │   └── standings/       # League standings
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── admin/               # Admin components
│   ├── draft/               # Draft components
│   ├── lineup/              # Lineup components
│   ├── shared/              # Shared components
│   └── standings/           # Standings components
├── hooks/                   # Custom React hooks
│   ├── use-draft.ts         # Draft auction logic
│   ├── use-lineup.ts        # Lineup management
│   ├── use-points.ts        # Points calculation
│   ├── use-realtime.ts      # Supabase realtime
│   └── use-toast.ts         # Toast notifications
├── lib/                     # Utility functions
│   ├── supabase/            # Supabase clients
│   ├── points-calculator.ts # Scoring engine
│   ├── utils.ts             # General utilities
│   └── validations.ts       # Zod schemas
├── types/                   # TypeScript types
│   ├── database.ts          # Database types
│   ├── draft.ts             # Draft types
│   ├── league.ts            # League types
│   ├── lineup.ts            # Lineup types
│   ├── match.ts             # Match types
│   ├── points.ts            # Points types
│   └── wrestler.ts          # Wrestler types
└── supabase/               # Database files
    ├── migrations/          # SQL migrations
    └── seed.sql             # Sample data
```

## Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   profiles  │     │   leagues   │     │  wrestlers  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │──┐  │ id (PK)     │     │ id (PK)     │
│ username    │  │  │ name        │     │ name        │
│ role        │  │  │ commissioner│──┐  │ brand       │
│ created_at  │  │  │ season      │  │  │ status      │
└─────────────┘  │  │ quarter     │  │  │ photo_url   │
                │  │ status      │  │  └─────────────┘
                │  └─────────────┘  │          │
                │         │         │          │
                │  ┌──────┴─────┐   │   ┌──────┴──────┐
                │  │            │   │   │             │
           ┌────┴──┴───┐  ┌─────┴───┴┐ ┌┴─────────────┴┐
           │  rosters  │  │  league  │ │roster_wrestlers│
           ├───────────┤  │  members │ ├───────────────┤
           │ id (PK)   │  ├──────────┤ │ id (PK)       │
           │ league_id │  │ id (PK)  │ │ roster_id     │
           │ user_id   │  │ league_id│ │ wrestler_id   │
           │ season    │  │ user_id  │ │ cost          │
           │ quarter   │  └──────────┘ │ is_keeper     │
           │ budget    │               └───────────────┘
           └───────────┘
                │
         ┌──────┴───────┐
         │   lineups    │
         ├──────────────┤
         │ id (PK)      │
         │ roster_id    │
         │ week         │
         │ captain_id   │
         │ locked_at    │
         └──────────────┘
                │
        ┌───────┴────────┐
        │lineup_wrestlers│
        ├────────────────┤
        │ id (PK)        │
        │ lineup_id      │
        │ wrestler_id    │
        │ position       │
        │ priority_order │
        └────────────────┘
```

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel settings
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Your app's URL |

## Game Rules

### Seasonal Structure
- 2 seasons per year, 4 quarters total
- Season 1: Post-Royal Rumble → SummerSlam (Q1 + Q2)
- Season 2: Post-SummerSlam → Royal Rumble (Q3 + Q4)

### Draft Auction
- Budget: 100 points for 12 wrestlers
- Minimum bid: 1 point
- Nomination → Bidding → Winner

### Extension Period (Post-WrestleMania & Post-Survivor Series)
- +8 points added to everyone's budget
- Must add 13th wrestler
- Optional: Drop wrestlers (refund cost) + add replacements

### Keeper System
- Max 1 keeper per season
- Cost: Previous cost × 1.2 (compounding)

### Weekly Lineup
- Deadline: Monday 20:00 (before Raw)
- 6 starters + 4 reserves (with priority order)
- 1 captain (must be a starter)
- Auto-substitution for non-wrestling starters

## Running Tests

```bash
# Run the points calculator tests
npx tsx lib/points-calculator.test.ts

# Run lint
npm run lint

# Build for production
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run lint && npm run build`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with Next.js, Supabase, and shadcn/ui.
