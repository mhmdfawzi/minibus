# Phase 3 Prompt — Driver: Trips

## Before you start
Read `agent-00-project-context.md` in full. Read the "Trips" section of `api-spec-v2.md` and the `trips` section of `database-schema-v2.md`.

Assume Phases 0-2 (schema/CI, auth, routes/stops, driver approval) are already done and working.

## Goal for this session
An approved driver can publish, edit, and manage the lifecycle of a trip on one of the admin-defined routes.

## Build this
- `POST /trips` — driver creates a trip: `route_id`, `trip_date`, `start_time`, `total_seats`, `price_per_seat`, car info. Set `available_seats = total_seats` on creation, `status = open`. Only a `driver`-role user with `drivers.status = approved` may create a trip — reject otherwise with a clear error.
- `GET /trips/my` — the driver's own trip list (this didn't exist in the original spec; it's required for the driver to manage what they've published).
- `PATCH /trips/:id` — edit seats/price/time. Only allowed while `status = open` **and** there are zero accepted bookings on the trip — reject the edit otherwise (a driver shouldn't be able to shrink seats or change price/time out from under passengers who already have a confirmed seat).
- `PATCH /trips/:id/start` — only from `status = open`.
- `PATCH /trips/:id/complete` — only from `status = started`.
- `PATCH /trips/:id/cancel` — allowed from `open` or `started`. This triggers notifications in Phase 5, but the state transition and validation belong here.
- Enforce the schema's `CHECK (available_seats >= 0 AND available_seats <= total_seats)` at the application layer too, not just relying on the DB constraint to reject bad writes silently.

## Key rules for this phase
- Every trip mutation must check the trip belongs to the authenticated driver (a driver can't edit/start/complete/cancel someone else's trip).
- Don't implement booking accept/reject here — that's Phase 4. This phase only owns the trip's own lifecycle (open → started → completed, or → cancelled).
- Keep the seat-count fields untouched by anything except the booking flow (Phase 4) once bookings exist — trip creation sets them once; trip edit is blocked once there are accepted bookings, precisely to avoid this getting out of sync.

## Definition of done
- An approved driver can create a trip on a real route/stop set from Phase 2, see it in `GET /trips/my`, edit it while still empty of accepted bookings, and walk it through open → started → completed.
- A non-approved driver, or a passenger/admin account, cannot create a trip.
- Editing a trip that already has an accepted booking is rejected with a clear error (you can fake an accepted booking directly in the DB for this test since Phase 4 doesn't exist yet).
