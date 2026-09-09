# Firefly

Nightlife discovery platform for Bucharest — backend-first Next.js + Supabase architecture.

## Environments

| | Git | Vercel | URL | Database |
|---|---|---|---|---|
| **Staging** | `develop` | Preview | `https://firefly-git-develop-fireflydev.vercel.app` | FireFly Staging (`vidjqydhflwemhmygoen`) |
| **Production** | `main` | Production | [fireflyapp.ro](https://fireflyapp.ro) | FireFly (`llpwwvlvxdqpbcrvwvgs`) |

Work and fixes go on `develop`. Promote to production by merging `develop` → `main`. Do not commit directly to `main`.

Staging lives in the JanosPuzzles org (free-plan limit in the FireFly org). Production stays `llpwwvlvxdqpbcrvwvgs`.

Auth on staging: set Site URL to `https://firefly-git-develop-fireflydev.vercel.app` and allow `/auth/callback`, `/{ro,en}/auth/reset-password`, plus `https://*-git-*.vercel.app/**`.

```bash
npm run db:push:staging
npm run db:push:prod
npm run db:seed-demo      # refused against production
```

Create production admins with an explicit password:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' npm run db:create-admin
```

## Setup

1. `npm run dev` — works with **mock data** until Supabase env vars are set in `.env.local`
2. Connect Supabase:
   - Copy API keys into `.env.local` (production) or `.env.staging.local` (staging)
   - `npm run db:link:prod` (or `npm run db:link:staging`)
   - Run migrations: `npm run db:push:prod` / `npm run db:push:staging`
   - Staging demo refresh (optional): `npm run db:seed-demo`
   - Regenerate types (optional): `npm run db:types`

## Architecture

- **UI** — you implement all screens in `components/` and page shells in `app/[locale]/`
- **Backend** — Server Actions in `lib/actions/`, queries in `lib/queries/`
- **Types** — shared contracts in `types/`

## Key integrations

- Supabase (Auth, Postgres, Storage, RLS)
- Stripe (B2B promotions) — live keys on Production, test keys on Preview
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
