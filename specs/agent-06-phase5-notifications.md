# Phase 5 Prompt — Notifications

## Before you start
Read `agent-00-project-context.md` in full. Read the "Devices" and "Notifications" sections of `api-spec-v2.md`, the `device_tokens` and `notifications` sections of `database-schema-v2.md`, and the original notification-event copy (titles/bodies in Arabic) from the product's notification spec if available in your repo.

Assume Phases 0-4 (schema/CI, auth, routes/drivers, trips, bookings with seat-locking) are already done and working. You're wiring notifications on top of a booking/trip system that already functions correctly without them.

## Goal for this session
Push notifications fire correctly for every relevant event, to the right audience, using the same Firebase project already integrated in Phase 1.

## Build this
- Reuse the Firebase Admin SDK integration from Phase 1 — same Firebase project, no new vendor setup, just add Cloud Messaging send calls alongside the existing auth token verification.
- `POST /devices/register` — body `{ token, platform }`, upserts into `device_tokens` for the authenticated user. The client must call this on every login and every token refresh, or notifications silently stop reaching a reinstalled/updated app.
- `DELETE /devices/:token` — remove on logout.
- Wire the 5 events to actually send:
  1. Passenger creates a booking → notify the driver.
  2. Driver accepts a booking → notify the passenger.
  3. Driver rejects a booking → notify the passenger.
  4. Driver cancels a trip → notify **all passengers with a booking in `pending` or `accepted` status** on that trip (not only accepted — pending passengers are also affected and should be told, not left to discover it via a silent expiry).
  5. Driver starts a trip → notify accepted passengers.
- Persist every sent notification into the `notifications` table (title, body, type, `is_read = false`) regardless of whether the push delivery itself succeeds — the in-app notification list must work even if a device token is stale or push fails.
- `GET /notifications`, `PATCH /notifications/:id/read`.
- Client: handle incoming push in both foreground and background app states.

## Key rules for this phase
- A user can have multiple registered devices (e.g. reinstalled the app) — sending push means fanning out to all of that user's tokens, not assuming one.
- If sending to a token fails because it's no longer valid (Firebase returns an unregistered-token error), remove that `device_tokens` row so it stops being retried.
- Don't couple notification sending into the same transaction as the booking/trip state change it's reporting on — if the push send fails, the underlying booking/trip action must still have succeeded. Fire notifications after the state change commits, not as part of it.

## Definition of done
- All 5 events produce both a stored `notifications` row and an actual push delivered to a real device for each affected user.
- Cancelling a trip with one pending and one accepted passenger notifies both.
- A stale/invalid device token is cleaned up automatically after a failed send, verified by checking the `device_tokens` table.
