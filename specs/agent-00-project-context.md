# Project Context — Transport MVP

**Give this file to every AI coding agent before any phase prompt.** It's the shared context so each phase can be handed off independently without re-explaining the product. Assume the agent otherwise has zero memory of this project.

---

## What we're building

A mobile app that connects passengers with verified drivers on fixed local routes, for a pilot in Damietta, Egypt. Initial route: الخلفية → دمياط الجديدة, plus its return direction as a separate route. A route is an ordered list of stops; a passenger can book a seat between any two stops on a route as long as pickup comes before dropoff in that order.

Core flow: a driver publishes a trip (route, date, time, seats, price). A passenger searches trips passing through their pickup/dropoff stops, requests a booking, and the driver accepts or rejects it. Push notifications keep both sides informed. Payment is cash, handled off-platform — no payment integration in this app. After a completed trip, the passenger can rate the driver.

Three roles: passenger, driver, admin. Admin approves/suspends drivers, manages routes and stops, and can view all trips/bookings for oversight.

Out of scope for MVP (do not build): online payment, live GPS tracking, in-app chat, dynamic/surge pricing, full marketplace automation.

## Confirmed decisions (do not re-litigate these)

1. **One role per account.** A phone number/account is exactly one of passenger, driver, or admin — never more than one. This is enforced by a single non-nullable `role` column on `users`.
2. **Flat pricing for MVP.** `price = seats_count * trips.price_per_seat`, regardless of which stops the passenger boards/alights at. Segment-based fares are a deliberate future feature, not in scope now — but implement the price calculation as one isolated function/step in the booking-creation flow (not inlined everywhere), so a future `route_segment_fares` table can be dropped in without restructuring the booking flow.
3. **Phone login is Firebase Authentication (Phone sign-in), not a custom OTP build.** The mobile app calls the Firebase Auth client SDK directly; Firebase sends the SMS, handles resend/rate-limiting, and runs its own abuse protection (reCAPTCHA on web, Play Integrity on Android, silent APNs on iOS). The backend never sends or checks an OTP itself — it only verifies the Firebase ID token the client hands it after a successful sign-in, via the Firebase Admin SDK, then issues its own app session (access + refresh JWT). There is no `otp_requests` table and no send-otp/verify-otp endpoints — do not build them.

## Non-negotiable engineering rules

- **Seat-count concurrency.** Any code path that reads or changes `trips.available_seats` (booking creation, accept, reject, cancel) must do so inside a single DB transaction that takes a row lock on the trip (`SELECT ... FOR UPDATE` in raw SQL, or Prisma's equivalent interactive transaction with a locking read). Two passengers booking the last seat at the same instant must never both succeed. This is the single most important correctness rule in the whole system — treat any seat-count mutation outside this pattern as a bug.
- **Pending bookings expire.** A `pending` booking holds a seat but only for a limited window (`hold_expires_at`, recommend 15 minutes from creation). A scheduled job flips stale `pending` rows to `expired` and restores the seat count. Don't let ignored booking requests hold seats forever.
- **One rating per passenger per trip**, enforced at the DB level (`UNIQUE(trip_id, passenger_id)` on `ratings`), not just in application code.
- **Driver approval requires documents.** A driver record isn't meaningfully "pending review" without uploaded ID/license photos (`drivers.doc_urls`) — this is in scope from Phase 2, not deferred.
- **Push requires stored device tokens.** Every login/token-refresh on the client must call the device-registration endpoint, or push notifications silently stop working.

## Tech stack

- **Backend:** NestJS, PostgreSQL, Prisma ORM, Firebase Admin SDK (token verification + push send)
- **Frontend:** Ionic + Angular + Capacitor — Android first, iOS later, same codebase. The admin panel is the same app gated by the `admin` role, not a separate app.
- **Auth:** Firebase Authentication (Phone) on the client; backend issues its own short-lived access token (~15–30 min) + longer-lived refresh token (stored hashed per device, rotated on use).
- **Object storage:** S3-compatible (Cloudflare R2 or Supabase Storage) for driver verification documents.
- **Hosting:** Railway (or a small VPS) + managed PostgreSQL.
- **Architecture style:** modular monolith, not microservices. One deployable NestJS app with clean internal module boundaries: `auth/`, `users/`, `drivers/`, `routes/`, `trips/`, `bookings/`, `ratings/`, `notifications/`, `admin/`.

## Reference files (read the ones relevant to your phase before writing code)

- `database-schema-v2.md` — full schema, source of truth for the Prisma schema
- `api-spec-v2.md` — full endpoint list, request/response shapes, validation rules
- `build-roadmap.md` — phase checklist this whole prompt series is built from
- `Transport-MVP-Architecture-Implementation-Plan.docx` — full narrative architecture doc, useful if you want the "why" behind a decision

## How this project is being built

Solo developer, one phase at a time, no fixed calendar deadline — each phase should be fully working and independently testable before the next begins. You will typically be handed one phase prompt per work session. **Always assume every earlier phase already exists and works** — don't rebuild it, extend it. If something from an earlier phase seems to be missing or broken, say so explicitly rather than silently re-implementing it.

## Conventions

- TypeScript everywhere (backend and frontend)
- REST JSON APIs; error responses shaped `{ statusCode, message, error }`
- All timestamps stored in UTC; convert for display client-side
- UI is Arabic-first — build with RTL layout in mind from the start, don't bolt it on later
- Write unit tests at minimum for the booking validation chain and the seat-locking transaction — these are the two places a silent bug costs real money/trust
- Keep module boundaries clean inside the monolith even though it's one deployable
