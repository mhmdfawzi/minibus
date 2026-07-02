# Codex UI Prompt — Phase 6: Ratings & Driver Profile

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md`. Assume UI Phases 1-5 (auth, driver onboarding, driver trips, booking flow, notifications) already exist and work.

This phase pairs with backend Phase 6 (`agent-07-phase6-ratings-admin.md`). Read it to know what's implemented: `POST /ratings`, `GET /drivers/:id/ratings`, `GET /drivers/:id` (with rating average), admin oversight endpoints. Mock against a `RatingsService` if backend Phase 6 isn't done yet.

## Goal for this session
A passenger can rate a driver after a completed trip, and both passengers and drivers can see a driver's rating.

## Build this
1. **Rate driver screen** — shown from the booking detail screen (UI Phase 4) once a booking's trip reaches `completed`, if the passenger hasn't already rated it. Large 1-5 star selector (using the shared star-rating component from UI Phase 0, in editable mode) and an optional comment field. Submit calls `POST /ratings`; if a rating already exists for this trip/passenger pair, don't show the screen at all rather than showing it and letting the submit fail.
2. **Driver profile screen** — photo, car info, and average star rating (shared component in read-only mode) with a count of completed trips. Reachable from the trip detail/booking screens (tap driver name/photo) so a passenger can check a driver's rating before booking, not just after.
3. Surface the driver's rating average as a small inline element on trip cards in search results (UI Phase 4) too, if it isn't already there — passengers deciding between two trips should see this without an extra tap.

## Key rules for this phase
- Only show the rate-driver prompt for trips the passenger actually completed a booking on, and only once — check both the trip status and whether a rating already exists before surfacing the screen, don't rely solely on the backend rejecting a duplicate.
- Driver profile is read-only for MVP — no self-editing UI beyond what registration already covered, unless a specific need comes up later.

## Definition of done
- A passenger who completes a trip is prompted to rate it once, submits successfully, and isn't prompted again for that trip.
- A driver's profile and their trip cards in search results both show a correct, live average rating.
