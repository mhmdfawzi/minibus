# Phase 4 Prompt — Passenger: Search & Booking

## Before you start
Read `agent-00-project-context.md` in full — **especially the "Non-negotiable engineering rules" section on seat-count concurrency and pending-booking expiry.** This phase is where those rules get implemented; treat them as the actual spec, not background color. Also read the "Bookings" section and "Booking validation" subsection of `api-spec-v2.md`, and the `bookings` section + "Concurrency rule" of `database-schema-v2.md`.

Assume Phases 0-3 (schema/CI, auth, routes/stops, driver approval, trip lifecycle) are already done and working.

## Goal for this session
A passenger can find a trip and request a seat, correctly and safely under concurrent load, and a driver can accept/reject/cancel that request.

## Build this

### Search
- `GET /trips/search?pickupStopId=&dropoffStopId=&date=` — returns open trips whose route contains both stops with pickup's `order_index < ` dropoff's `order_index`, on the given date, with enough `available_seats`.

### Booking creation — `POST /bookings`
Body: `{ tripId, pickupStopId, dropoffStopId, seatsCount }`. Validate, in order, all of:
1. `pickup_stop.route_id = trip.route_id`
2. `dropoff_stop.route_id = trip.route_id`
3. `pickup_stop.order_index < dropoff_stop.order_index`
4. `trip.status = open`
5. `available_seats >= seatsCount`
6. The passenger does not already have an active (`pending` or `accepted`) booking on this same trip

Price = `seatsCount * trip.price_per_seat` (flat rate — see project context confirmed decision #2; write this as one isolated calculation, not inlined, so it's easy to swap later).

**This is the critical part:** creating the booking and decrementing `trip.available_seats` must happen in a single database transaction that takes a row lock on the trip before reading `available_seats` (e.g. Prisma interactive transaction issuing a `SELECT ... FOR UPDATE`-equivalent locking read, or raw SQL if Prisma's abstraction doesn't expose it cleanly). Re-check `available_seats >= seatsCount` *after* acquiring the lock, not just before — the whole point is that another request may have changed it between your first read and the lock. Set `status = pending` and `hold_expires_at = now() + 15 minutes` (or your chosen window).

### Hold expiry
- A scheduled job (cron or equivalent) that finds `pending` bookings past `hold_expires_at`, flips them to `expired`, and restores the held seats — inside the same locked-transaction pattern as above.

### Accept / reject / cancel
- `PATCH /bookings/:id/accept` — driver only, only their own trip's bookings. On accept, seats stay decremented (they were already held at creation); clear `hold_expires_at` since it's no longer at risk of expiring.
- `PATCH /bookings/:id/reject` — driver only. Restores the held seats (locked transaction).
- `PATCH /bookings/:id/cancel` — passenger (their own booking) or driver (their own trip's booking). Restores seats if the booking was `pending` or `accepted` (locked transaction).
- `GET /bookings/my` (passenger), `GET /drivers/bookings` (driver).

## Key rules for this phase — do not skip these
- Every place that reads or writes `available_seats` — creation, accept, reject, cancel, and the expiry job — goes through the same locked-transaction helper. Don't write this logic more than once; extract it so there's exactly one code path that's allowed to touch `available_seats`.
- Write a concurrency test: fire two simultaneous booking requests for the last available seat on a trip and assert exactly one succeeds. If you can't write an automated version of this test, at minimum document a manual test you ran (e.g. two parallel curl/script calls) and its result.
- Don't let a `pending` booking sit forever — the expiry job is not optional polish, it's part of this phase's definition of done.

## Definition of done
- Search returns correct trips for a given stop pair and date, excluding trips where the passenger's requested segment isn't valid on that route.
- The last-seat concurrency test (above) passes.
- A pending booking past its hold window is automatically expired and its seat is bookable again, without manual intervention.
- Accept/reject/cancel all correctly restore or hold seats as appropriate, verified by checking `available_seats` before and after each transition.
