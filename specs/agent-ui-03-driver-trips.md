# Codex UI Prompt — Phase 3: Driver Trip Screens

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md`. Assume UI Phases 1-2 (auth, driver onboarding) already exist and work — you're building for an already-approved driver.

This phase pairs with backend Phase 3 (`agent-04-phase3-driver-trips.md`). Read it to know what's implemented: `POST /trips`, `GET /trips/my`, `PATCH /trips/:id`, start/complete/cancel. Mock against a `TripsService` if backend Phase 3 isn't done yet, per the UI Phase 0 convention.

## Goal for this session
An approved driver can publish a trip and see their own trip list. This phase does not include handling incoming booking requests — that's UI Phase 4, once bookings exist on the backend.

## Build this
1. **My Trips screen (driver)** — list of the driver's trips using the shared trip card component from UI Phase 0, with status badges (Open / Started / Completed / Cancelled). Empty state when the driver has no trips yet, linking to trip creation.
2. **Create Trip screen** — route picker (from `GET /routes`), date picker, time picker, total seats input, price per seat input. Validate seats/price are positive numbers before allowing submit.
3. Trip detail view (driver, no bookings yet) — shows the trip's own info and lifecycle actions appropriate to its current status:
   - `open`: Edit, Start Trip, Cancel Trip
   - `started`: Complete Trip, Cancel Trip
   - `completed`/`cancelled`: read-only
4. Edit trip flow — reuse the create-trip form pre-filled, but disable/hide it (with an explanation) if the backend rejects the edit because the trip already has accepted bookings — don't let the driver sit on a form that will just fail on submit.

## Key rules for this phase
- This phase's trip detail screen does not yet show incoming booking requests or seat counts changing from bookings — that UI arrives in Phase 4 once the booking backend exists. Keep this screen simple and don't try to anticipate that UI now; it'll be added as a section on the same screen next phase, not a rewrite.
- Respect trip status transitions exactly as the backend enforces them (open → started → completed, or → cancelled from open/started) — don't show an action that the backend will reject.

## Definition of done
- A driver can create a trip on a real route from Phase 2's route data, see it appear in My Trips, and walk it through open → started → completed via the UI.
- Attempting to edit a trip that already has accepted bookings (fake one via direct DB/API call, since booking UI doesn't exist yet) shows a clear explanation instead of a confusing failed-request error.
