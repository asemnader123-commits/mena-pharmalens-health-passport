# MENA Passport + PharmaLens

MENA Passport + PharmaLens gives travelers a portable, time-limited medication passport and gives pharmacists a safe lookup and FEFO inventory workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mena-pharmalens` — React/Vite patient and pharmacist web app
- `artifacts/api-server/src/routes/product.ts` — API routes for auth, passport, access grants, lookup, inventory, and pharmacist review
- `artifacts/api-server/src/lib/seed.ts` — idempotent demo accounts, passport records, INN mappings, pharmacy, and inventory seed
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and Zod contracts
- `lib/db/src/schema/passport.ts` — Drizzle schema for the shared product data model
- `artifacts/mena-pharmalens/src/index.css` — product theme and design tokens

## Architecture decisions

- The first release uses seeded demo role sign-in with a signed, httpOnly session cookie so reviewers can enter either portal instantly without a signup flow.
- All patient sharing is represented by a short-lived access grant; lookup validates expiry/revocation and writes an access log before returning minimum-necessary data.
- INN mapping is deliberately deterministic and table-backed; it never generates clinical or substitution advice.
- Inventory status is derived from expiry dates at read time using FEFO ordering: under 30 days is rotate now, 30–90 days is return window, and later is fine.

## Product

- Public landing page with patient and pharmacist demo entry points
- Bilingual English/Arabic shell with RTL direction switching
- Patient dashboard with medication CRUD, profile context, passport records, time-boxed access code/QR token generation, revocation, countdown, and access history
- Pharmacist dashboard with patient lookup, audit logging, FEFO inventory, expiry status, and pharmacist-confirmed matching suggestions

## User preferences

No project-specific preferences recorded.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm --filter @workspace/db run push` after changing Drizzle schema.
- The product API is mounted at `/api`; the web app uses generated hooks from `@workspace/api-client-react`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
