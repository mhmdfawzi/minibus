# Phase 1 Prompt — Auth & Users

## Before you start
Read `agent-00-project-context.md` in full — pay special attention to confirmed decision #3 (Firebase Authentication, not custom OTP) and the token strategy note below. Also read the "Auth" section of `api-spec-v2.md`.

Assume Phase 0 (repo, Prisma schema, CI, base NestJS setup) is already done and working. Build on it, don't redo it.

## Goal for this session
Working phone login end to end: a user can sign in with their phone number on the client via Firebase, and the backend recognizes them and issues its own session.

## Build this

### Client side (Ionic/Capacitor app)
1. Integrate Firebase Authentication's Phone sign-in using the Firebase client SDK (or `@capacitor-firebase/authentication` for a Capacitor-native bridge).
2. Configure reCAPTCHA for the web fallback, Play Integrity for Android, and silent APNs for iOS — these are Firebase's built-in abuse protection, required for production phone auth to work at all.
3. Build the phone-entry + OTP-entry screens. On successful verification, the client holds a Firebase ID token.
4. Send that ID token to the backend's `POST /auth/firebase-login` once verified.

### Backend side (NestJS)
1. Integrate the Firebase Admin SDK (project credentials via env config).
2. `POST /auth/firebase-login` — body `{ firebaseIdToken }`. Verify the token with the Admin SDK. If a `users` row with that `firebase_uid` doesn't exist, create it (new users start with no role assigned until they complete a profile/role-selection step — decide and document how role gets set, since `role` is non-nullable per the schema; a reasonable default is requiring a follow-up "complete profile" call that sets `full_name` and `role` before the account is usable). Return the app's own access + refresh JWT pair.
3. `GET /auth/me` — returns the authenticated user's profile.
4. `POST /auth/refresh` — exchanges a valid refresh token for a new access token. Refresh tokens should be stored hashed per device/session server-side and rotated on each use (not pure stateless JWT) so a compromised token can be revoked.
5. Auth guard middleware for all other endpoints going forward, extracting the user + role from the access token.

## Key rules for this phase
- Do not build `/auth/send-otp` or `/auth/verify-otp` — that flow does not exist in this design. OTP is 100% client-side via Firebase; the backend only ever sees the resulting ID token once.
- Do not create an `otp_requests` table or any custom rate-limiting for OTP — Firebase owns that.
- Test against real Egyptian phone numbers on multiple carriers (Vodafone Egypt, Orange Egypt, Etisalat Misr, WE) before considering this phase done — Firebase lists Egypt as supported, but per-carrier SMS delivery reliability hasn't been verified for this project and needs a real check, not an assumption.
- Firebase phone verification requires the project to be on the Blaze (pay-as-you-go) billing plan — confirm this is set up, since the free tier's daily test quota isn't enough for real development/testing.

## Definition of done
- A real phone number can complete sign-in on a physical Android device (emulator SMS auto-fill doesn't count as verification) and receive a working session.
- `GET /auth/me` returns the correct user after login.
- An expired/invalid access token is rejected by the guard; a valid refresh token successfully mints a new access token.
- At least one successful test with an Egyptian carrier number is documented.
