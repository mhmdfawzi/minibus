# API Spec v2 (Refined)

Endpoints carried over unchanged from the original spec are not repeated in detail here except where behavior needed clarification. **[NEW]** marks endpoints added to close gaps.

## Auth — **[CHANGED]** OTP delivery moved to Firebase Authentication (confirmed decision)
- ~~POST /auth/send-otp~~ / ~~POST /auth/verify-otp~~ — **removed**. The mobile app calls the Firebase Auth client SDK directly to send and verify the phone OTP; the backend is not involved in that step at all.
- **[NEW]** POST /auth/firebase-login — body `{ firebaseIdToken }`. Backend verifies the token via the Firebase Admin SDK, upserts the `users` row keyed on `firebase_uid` (creating it on first login), and returns the app's own access + refresh JWT pair.
- GET /auth/me
- POST /auth/refresh — exchange refresh token for new access token (see token strategy note below); unrelated to Firebase's own token refresh, which the client SDK handles silently for its ID token.

## Devices **[NEW]**
- **[NEW]** POST /devices/register — body `{ token, platform }`, upserts into `device_tokens` for the authenticated user; must be called on every app login/token-refresh
- **[NEW]** DELETE /devices/:token — remove on logout so stale devices stop receiving push

## Routes
- GET /routes
- GET /routes/:id/stops
- POST /admin/routes
- POST /admin/routes/:id/stops
- PATCH /admin/routes/:id
- PATCH /admin/stops/:id

## Trips
- POST /trips
- GET /trips/search?pickupStopId=&dropoffStopId=&date=
- GET /trips/:id
- **[NEW]** GET /trips/my — driver's own trip list (create/manage flow needs this; original spec had no way for a driver to see their trips)
- **[NEW]** PATCH /trips/:id — edit seats/price/time, only allowed while `status = open` and zero accepted bookings exist
- PATCH /trips/:id/start
- PATCH /trips/:id/complete
- PATCH /trips/:id/cancel — **[CHANGED]** must notify all passengers with `status IN (pending, accepted)`, not only accepted (pending passengers are also waiting on this trip)

## Bookings
- POST /bookings
  Request body:
  ```json
  { "tripId": "...", "pickupStopId": "...", "dropoffStopId": "...", "seatsCount": 1 }
  ```
- GET /bookings/my
- GET /drivers/bookings
- PATCH /bookings/:id/accept
- PATCH /bookings/:id/reject
- PATCH /bookings/:id/cancel

### Booking validation (unchanged, plus one addition)
A passenger can book only if:
1. pickup_stop.route_id = trip.route_id
2. dropoff_stop.route_id = trip.route_id
3. pickup_stop.order_index < dropoff_stop.order_index
4. trip.status = open
5. available seats are enough
6. **[NEW]** passenger does not already have an active (`pending`/`accepted`) booking on the same trip

## Drivers
- POST /drivers/register
- **[NEW]** POST /drivers/documents — upload national ID / license images, stores URLs into `drivers.doc_urls`
- GET /admin/drivers/pending
- PATCH /admin/drivers/:id/approve
- PATCH /admin/drivers/:id/suspend
- **[NEW]** GET /drivers/:id — public profile (name, car info, rating average) shown to a passenger before booking

## Notifications
- GET /notifications
- PATCH /notifications/:id/read

## Ratings
- POST /ratings — reject if a rating already exists for `(tripId, passengerId)`
- GET /drivers/:id/ratings

## Admin oversight **[NEW — required by product spec "Admin: View bookings" but missing from original API list]**
- **[NEW]** GET /admin/trips — list/filter all trips
- **[NEW]** GET /admin/bookings — list/filter all bookings

## Pricing note — **[CONFIRMED]**
`seats_count * trips.price_per_seat` is the full price calculation for MVP, regardless of pickup/dropoff stop — confirmed flat-rate is intentional for now. When segment-based fares are added later, the price calculation becomes a single swappable step in the booking-creation flow (see database-schema-v2.md for the suggested `route_segment_fares` table); no endpoint contract changes are expected.

## Token strategy note
Original spec says "JWT session" without detail. Recommendation for solo-dev simplicity while still being safe:
- Short-lived access token (~15–30 min)
- Longer-lived refresh token, stored hashed server-side per device, rotated on use
- This is the standard tradeoff between pure-stateless JWT (simpler, but hard to revoke) and session storage (revocable, slightly more backend work) — worth the small extra effort since drivers/passengers will stay logged in for weeks.
