# Codex UI Prompt — Phase 4: Booking Flow (Passenger + Driver)

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md`. Assume UI Phases 1-3 (auth, driver onboarding, driver trips) already exist and work.

This phase pairs with backend Phase 4 (`agent-05-phase4-booking.md`) — the most important backend phase (seat-locking, hold/expiry). Read it before building anything here, because the UI needs to handle every state that concurrency-safe backend can put a booking in, including one the earlier phases didn't need to think about: a booking that gets rejected by the server *after* the UI thought it would succeed, because someone else took the last seat first. Mock against `BookingsService`/`TripsService` if backend Phase 4 isn't done yet in this repo.

This is the largest UI phase in the app — it covers both sides of the same transaction (passenger booking, driver responding to it). **If this is too much for one Codex session, split it into 4a (passenger booking screens) and 4b (driver trip-management additions) and run them back to back** — they share the same booking-state model so keep both sessions' terminology identical (use the exact status names: pending, accepted, rejected, cancelled, completed, expired).

## Goal for this session
A passenger can find a trip, request a seat, and track its status. A driver can see and respond to incoming requests on their trips.

## Build this — passenger side
1. **Home/Search screen** — pickup stop and dropoff stop pickers (from the route's ordered stop list, not free text), date picker, "Search trips" button.
2. **Search results list** — trip cards (shared component) showing driver name/photo, car model/color, departure time, price per seat, seats remaining. Empty state for no matching trips.
3. **Trip detail & booking screen** — full trip summary, seat-count stepper (respect `available_seats` as a live upper bound), "Request booking" button. On submit, call `POST /bookings` and handle the response explicitly:
   - Success → navigate to booking detail, status `pending`.
   - Rejected because seats ran out between search and submit (the seat-locking transaction did its job) → show a clear, non-technical message and offer to search again, don't just show a generic error.
4. **My Bookings screen** — filterable list by status (Pending / Accepted / Rejected / Cancelled / Completed / Expired) using the shared status badge component.
5. **Booking detail screen** — trip info, driver name/photo/car, and — only when status is `accepted` — the driver's phone number with a tap-to-call action. Includes a "Cancel booking" action available while status is `pending` or `accepted`.
6. Handle the `expired` status in the UI: if a pending booking's hold window lapses server-side, the next time the passenger views it, show it as expired (not stuck showing "pending" forever) — this means My Bookings and booking detail should refetch/poll or handle a push-driven update, not just cache the status from when the screen first loaded.

## Build this — driver side
7. Extend the trip detail screen from UI Phase 3 with an **incoming booking requests section**: list of bookings on this trip with passenger name, requested seats, pickup/dropoff stops, and Accept/Reject buttons per request.
8. Reflect seat count changes live — after an accept/reject action, the trip's available seats and the request list both update from the server response, not from local optimistic math (the backend is the source of truth here, especially given the locked-transaction seat handling).

## Key rules for this phase
- Never compute or display "seats remaining" as a pure client-side decrement — always trust the server's returned `available_seats`. Optimistic UI is fine for responsiveness (show a brief loading state on the button), but reconcile with the real response immediately.
- The booking status list (pending, accepted, rejected, cancelled, completed, expired) is exhaustive — every screen showing a booking must handle all six, not just the ones you thought of first.
- Don't show a driver's phone number anywhere except the booking detail screen, and only once `status = accepted` — this matches the backend's intent (contact info exchanged only after confirmation) and shouldn't be worked around client-side.

## Definition of done
- A full booking round-trip works end to end through the UI: passenger searches, requests, driver sees and accepts, passenger sees the driver's phone number and an updated status.
- The last-seat race condition (two passengers requesting the final seat) shows a clean, understandable failure message to whichever request the backend rejects — verified against the concurrency test built in backend Phase 4.
- A booking that expires server-side (test by shortening the hold window in a dev environment) correctly shows as `expired` in the UI without requiring an app restart.
