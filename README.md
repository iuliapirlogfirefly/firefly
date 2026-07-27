# Firefly

Nightlife discovery platform for Bucharest — backend-first Next.js + Supabase architecture.

## Setup

1. `npm run dev` — works with **mock data** until Supabase env vars are set in `.env.local`
2. Connect Supabase:
   - Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Copy API keys into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   - `supabase login` then `supabase link --project-ref <your-project-ref>`
   - Run migrations: `npm run db:push`
   - Run seed (optional): `npm run db:seed`
   - Regenerate types (optional): `npm run db:types`

## Architecture

- **UI** — you implement all screens in `components/` and page shells in `app/[locale]/`
- **Backend** — Server Actions in `lib/actions/`, queries in `lib/queries/`
- **Types** — shared contracts in `types/`

## Key integrations

- Supabase (Auth, Postgres, Storage, RLS)
- Stripe (B2B promotions)
- Resend (email notifications)
- MapLibre (client-side discovery map — OpenFreeMap dark tiles; `getEventsGeoJSON()` available for future layers)

## Routes

| Route | Access |
|-------|--------|
| `/[locale]/map` | Public |
| `/[locale]/feed` | Public |
| `/[locale]/saved` | Auth |
| `/[locale]/business/*` | Business |
| `/[locale]/admin/*` | Admin |
