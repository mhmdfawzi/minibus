# Codex UI Prompt — Phase 5: Notifications

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md`. Assume UI Phases 1-4 (auth, driver onboarding, driver trips, booking flow) already exist and work.

This phase pairs with backend Phase 5 (`agent-06-phase5-notifications.md`). Read it to know what's implemented: `POST /devices/register`, `DELETE /devices/:token`, `GET /notifications`, `PATCH /notifications/:id/read`, and the 5 push events. Mock against a `NotificationsService` if backend Phase 5 isn't done yet.

## Goal for this session
Push notifications work end to end on the client, and there's a real in-app place to review them.

## Build this
1. Device token registration — call `POST /devices/register` on every successful login (from UI Phase 1's session handling) and on token refresh; call `DELETE /devices/:token` on logout.
2. Foreground push handling — when a push arrives while the app is open, show an in-app toast/banner (don't just silently update data with no indication).
3. Background/closed push handling — tapping a system notification deep-links into the right screen (a new booking request → that trip's driver detail screen; an accepted/rejected booking → that booking's detail screen; a cancelled/started trip → that trip's detail screen).
4. **Notifications list screen** — feed of past notifications (`GET /notifications`), unread items visually distinct (use the accent gold sparingly here, per the design system), tap to mark as read (`PATCH /notifications/:id/read`) and deep-link same as background push.
5. Add an unread-count badge on the tab/icon that opens the notifications list, if the app's nav supports badge counts.

## Key rules for this phase
- Every one of the 5 backend events (booking created, accepted, rejected, trip cancelled, trip started) needs a working deep link — a notification that opens to a generic screen instead of the relevant trip/booking is a broken feature, not a minor gap.
- Don't assume push always arrives — the notifications list screen must independently reflect the true state from `GET /notifications` even if a push was missed (app was closed, token was stale, etc.), since the underlying booking/trip data is always the source of truth, not the push itself.

## Definition of done
- A test device registers its token on login and can receive a real push for each of the 5 event types, deep-linking correctly for each.
- The notifications list shows accurate history and read/unread state, and matches reality even after simulating a missed push (trigger the event via API directly, then open the notifications list without ever receiving the push).
