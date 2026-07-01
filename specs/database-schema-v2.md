# Database Schema v2 (Refined)

Refinements vs. the original spec are marked **[NEW]** or **[CHANGED]**. Rationale for each change is covered in the architecture plan document ("Gaps & Risks" section).

## users
- id (PK, uuid)
- full_name
- phone (unique, indexed)
- **[NEW]** firebase_uid (unique, indexed) — the Firebase Authentication UID returned after phone OTP verification; this is now the anchor for login, phone is kept for display/contact and must stay in sync with Firebase's record
- role: passenger | driver | admin — **[CONFIRMED]** one phone number/account = exactly one role, no dual passenger+driver accounts. Enforced simply by the single non-nullable role column; no schema change needed, just noting the decision so it isn't re-litigated later.
- is_active
- created_at
- **[NEW]** preferred_locale (default `ar`) — needed since UI is Arabic-first with possible future locales

## drivers
- id (PK)
- user_id (FK -> users.id, unique)
- national_id
- license_number
- car_model
- car_plate
- car_color
- status: pending | approved | rejected | suspended
- **[NEW]** doc_urls (jsonb array) — links to uploaded ID/license photos in object storage; admin cannot verify a driver without seeing documents
- **[NEW]** rejection_reason (nullable text) — shown to driver when rejected/suspended
- created_at, updated_at

## routes
- id (PK)
- name
- direction: outbound | return
- is_active
- created_at

## route_stops
- id (PK)
- route_id (FK -> routes.id)
- name
- order_index
- estimated_offset_minutes
- is_active
- **[NEW]** UNIQUE (route_id, order_index) — prevents two stops on the same route sharing a position

## trips
- id (PK)
- driver_id (FK -> drivers.id)
- route_id (FK -> routes.id)
- trip_date
- start_time
- total_seats
- available_seats
- price_per_seat
- status: open | started | completed | cancelled
- created_at, updated_at
- **[NEW]** CHECK (available_seats >= 0 AND available_seats <= total_seats)
- **[NEW]** INDEX (route_id, trip_date, status) — this is the query search hits on every passenger search
- **[CONFIRMED]** price_per_seat stays flat for MVP regardless of pickup/dropoff stop — confirmed intentional. **Design note for the future:** when segment-based pricing is added, do not overload `price_per_seat`; add a separate `route_segment_fares` table (`route_id`, `from_stop_id`, `to_stop_id`, `price`) and compute a booking's price at creation time from that table, falling back to `trips.price_per_seat` when no segment fare exists. This keeps the flat-rate MVP code path untouched and the future change additive rather than a rewrite.

## bookings
- id (PK)
- trip_id (FK -> trips.id)
- passenger_id (FK -> users.id)
- pickup_stop_id (FK -> route_stops.id)
- dropoff_stop_id (FK -> route_stops.id)
- seats_count
- status: pending | accepted | rejected | cancelled | completed | **[NEW] expired**
- **[NEW]** hold_expires_at (timestamp) — pending bookings reserve seats for a limited window (e.g. 15 min); a scheduled job flips stale `pending` rows to `expired` and restores `trips.available_seats`
- created_at, updated_at
- **[NEW]** INDEX (trip_id, status) — required for the row-locked seat-decrement transaction described below

### Concurrency rule (critical — not in original spec)
Seat counts must be changed inside a single DB transaction that takes a row lock on the `trips` row (`SELECT ... FOR UPDATE`) before checking/decrementing `available_seats`. Without this, two passengers booking the last seat at the same moment can both succeed (overbooking). Apply the same lock on accept/reject/cancel paths that touch `available_seats`.

## notifications
- id (PK)
- user_id (FK -> users.id)
- title
- body
- type
- is_read
- created_at

## ratings
- id (PK)
- trip_id (FK -> trips.id)
- passenger_id (FK -> users.id)
- driver_id (FK -> drivers.id)
- rate (1-5)
- comment
- created_at
- **[NEW]** UNIQUE (trip_id, passenger_id) — one rating per passenger per trip

## device_tokens **[NEW TABLE]**
Required for FCM push — the original spec references push notifications but never stores the token needed to send them.
- id (PK)
- user_id (FK -> users.id)
- token (unique)
- platform: android | ios
- created_at
- last_seen_at

## OTP handling — **[CONFIRMED]** delegated to Firebase Authentication, no `otp_requests` table
Earlier drafts of this schema added a custom `otp_requests` table (code hash, expiry, attempt counter) to make phone login abuse-resistant. That's no longer needed: the confirmed decision is to use **Firebase Authentication's Phone sign-in** instead of a backend-issued OTP.

What this changes:
- The mobile app calls the Firebase Auth client SDK directly (`signInWithPhoneNumber` equivalent) — Firebase sends the SMS, handles resend/rate-limiting, and runs its own abuse protection (reCAPTCHA on web, Play Integrity on Android, silent APNs on iOS). None of that is code you write.
- On successful verification, the client receives a Firebase ID token and sends it to the backend once (`POST /auth/firebase-login`, see api-spec-v2.md).
- The backend verifies the token with the Firebase Admin SDK, upserts the `users` row by `firebase_uid`, and issues its own access + refresh JWT pair for subsequent API calls.
- No `otp_requests` table, no custom rate-limit logic, no SMS vendor contract to manage — Firebase's Blaze (pay-as-you-go) billing plan must be enabled on the project, and phone verification is billed per attempt (varies by country; not covered by the free tier beyond a small daily test quota).
- Egypt appears in Firebase's supported-country list for phone sign-in, but actual delivery reliability can vary by local carrier (Vodafone Egypt, Orange Egypt, Etisalat Misr, WE) — test with real numbers on each major carrier before relying on it for the pilot.

## Notes on driver document storage
`drivers.doc_urls` point to files in object storage (S3-compatible: AWS S3, Cloudflare R2, or Supabase Storage). The tech spec listed storage as "optional later" — for MVP it's required, because admin driver approval (an explicit MVP feature) is not meaningfully possible without seeing ID/license documents.
