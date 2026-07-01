# Phase 0 Prompt — Foundations

## Before you start
Read `agent-00-project-context.md` in full first — product summary, confirmed decisions, and non-negotiable rules live there and apply to everything below. Also skim `database-schema-v2.md` since you're building the schema from it this phase.

This is the first phase — there is no existing code to preserve, you're starting from zero.

## Goal for this session
Stand up the repo skeleton, database, and CI so every later phase has something to build on. No business features yet — this phase produces no user-facing functionality, just working infrastructure.

## Build this
1. Two repos (or a monorepo with clear separation): a NestJS backend project and an Ionic + Angular + Capacitor frontend project.
2. PostgreSQL running locally via Docker Compose for development.
3. Prisma schema translated from `database-schema-v2.md` — every table, column, type, and constraint listed there (including the `[NEW]`/`[CONFIRMED]` items: `users.firebase_uid`, `users.preferred_locale`, `drivers.doc_urls`, `drivers.rejection_reason`, the `route_stops` unique constraint, the `trips` check constraint and index, the `bookings.hold_expires_at`/`expired` status and index, the `ratings` unique constraint, and the `device_tokens` table). Do not create an `otp_requests` table — that's explicitly not part of this schema (see project context, confirmed decision #3).
4. Base NestJS setup: config/env module (`.env` handling), global error filter producing the `{ statusCode, message, error }` shape, request logging, module folder structure matching the module list in the project context.
5. CI pipeline (GitHub Actions or equivalent): install, lint, build, run Prisma migrate in a throwaway test DB, on every push.

## Key rules for this phase
- Don't add any business logic modules yet beyond empty scaffolding — this phase is infrastructure only.
- Get the schema exactly right; every later phase assumes it's correct and won't revisit it unless something is actually wrong.

## Definition of done
- `docker-compose up` gives a working local Postgres.
- `prisma migrate dev` applies cleanly with no manual fixes.
- CI is green on a trivial commit.
- A fresh clone + documented setup steps gets a new contributor (or agent) to a running local backend in under 10 minutes.
