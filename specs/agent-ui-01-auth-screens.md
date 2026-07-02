# Codex UI Prompt — Phase 1: Auth Screens

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md` in this repo. Confirm the theme file, RTL setup, route map, and shared components from UI Phase 0 already exist — build on them, don't recreate them.

This phase pairs with backend Phase 1 (`agent-02-phase1-auth.md`). Read it to know exactly what's implemented: Firebase phone sign-in on the client, `POST /auth/firebase-login`, `GET /auth/me`, `POST /auth/refresh`. If backend Phase 1 isn't actually done yet in this repo, build these screens against a mocked `AuthService` (see the mock convention from UI Phase 0) and say so explicitly.

## Goal for this session
The full first-run experience: a new user opens the app, signs in with their phone, and lands as either a passenger or driver.

## Build this
1. **Welcome/splash screen** — app logo (felucca-sail mark per the Stitch design), single "Continue with phone number" button.
2. **Phone number entry screen** — country code + phone input, large "Send code" button. Wire to Firebase Auth's client SDK phone sign-in (per project context confirmed decision — this is client-driven, not a custom backend OTP call).
3. **OTP verification screen** — 6-digit code input, resend link, phone number shown for confirmation. On success, take the resulting Firebase ID token and call `POST /auth/firebase-login`.
4. **First-time profile setup screen** — full name field, and a clear two-option choice between "Passenger" and "Driver" (a user is only ever one of these — no toggle, no dual role, per the confirmed decision in project context). Only shown if `GET /auth/me` indicates the profile isn't complete yet.
5. Session handling: store the access/refresh JWT pair returned by `firebase-login`, attach the access token to all future API calls, and implement silent refresh via `POST /auth/refresh` when it expires.

## Key rules for this phase
- Do not build a custom OTP send/verify UI against your own backend — the OTP itself is entirely handled by the Firebase Auth client SDK. Your backend call happens exactly once, after Firebase already confirmed the code.
- The role choice on profile setup is permanent for MVP — don't build a role-switch UI anywhere, since the backend doesn't support it.
- Route the user correctly post-login: existing passenger → passenger home, existing driver → driver home (or pending-approval screen if not yet approved, once UI Phase 2 exists), new user → profile setup.

## Definition of done
- A real phone number completes sign-in through all 4 screens end to end (against either the real backend or the documented mock).
- Reopening the app with a valid stored session skips straight past these screens to the correct home screen for the user's role.
- An expired access token triggers a silent refresh without dropping the user back to the phone-entry screen.
