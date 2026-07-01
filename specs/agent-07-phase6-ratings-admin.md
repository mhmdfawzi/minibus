# Phase 6 Prompt — Ratings & Admin Oversight

## Before you start
Read `agent-00-project-context.md` in full. Read the "Ratings" and "Admin oversight" sections of `api-spec-v2.md`, and the `ratings` section of `database-schema-v2.md`.

Assume Phases 0-5 (schema/CI, auth, routes/drivers, trips, bookings, notifications) are already done and working.

## Goal for this session
Passengers can rate a driver after a completed trip, drivers show a rating average, and admin gets read visibility into all trips/bookings for oversight (a named MVP feature that had no endpoints in the original API spec).

## Build this
- `POST /ratings` — body includes `tripId`, `rate` (1-5), optional `comment`. Only allowed if: the trip is `completed`, the requester was the accepted passenger on that trip, and no rating already exists for `(tripId, passengerId)` — enforce the last part with the DB's `UNIQUE(trip_id, passenger_id)` constraint as the backstop, but also check and return a clean error before hitting it.
- `GET /drivers/:id/ratings` — list a driver's ratings.
- Extend `GET /drivers/:id` (from Phase 2/3, the public driver profile) to include a computed rating average — decide whether to compute this on read (simple, fine at pilot scale) or maintain a denormalized average on the `drivers` row (only worth it if read volume justifies it; not necessary for a pilot).
- `GET /admin/trips` — list/filter all trips (by status, date range, driver).
- `GET /admin/bookings` — list/filter all bookings (by status, trip, passenger).

## Key rules for this phase
- A rating can only be submitted for a trip the passenger actually completed a booking on — don't allow rating a trip you never booked.
- Admin oversight endpoints are read-only in this phase; don't add admin write/override actions on trips or bookings unless a specific need shows up (not in the original scope).

## Definition of done
- A passenger who completed a trip can submit exactly one rating for it; a second attempt is rejected with a clear error, and rating a trip they weren't on is rejected too.
- A driver's public profile shows a correct average across their ratings.
- Admin can filter and page through all trips and all bookings system-wide.
