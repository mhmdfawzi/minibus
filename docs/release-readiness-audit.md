# Release Readiness Audit

This audit revisits the definitions of done from Phases 0-7 and records remaining release gates.

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Foundations | Pass | Monorepo, Prisma schema, lint/build scripts, config, request logging, and error handling exist. |
| 1 Auth | Partial external gate | Firebase phone auth is integrated, but real Egyptian carrier OTP testing must be done outside this repo. |
| 2 Admin/routes/drivers | Pass with storage gate | Driver document upload works locally; production object storage still needs deployment configuration. |
| 3 Trips | Pass | Driver trip lifecycle is implemented. Trip completion also marks accepted bookings completed. |
| 4 Bookings | Pass with DB smoke-test gate | Row-locked seat mutation and expiry job exist. Full concurrency verification requires a live Postgres test environment. |
| 5 Notifications | Partial external gate | Device token endpoints and FCM fan-out exist. Real delivery/stale-token cleanup needs physical-device FCM testing. |
| 6 Ratings/admin oversight | Pass | Rating checks, driver rating average, and admin list/filter endpoints exist. |
| 7 Mobile pilot | Partial external gate | Arabic RTL pilot UI, Android project, Sentry hooks, and signing docs exist. Actual signed APK requires SDK/keystore/Firebase files. |
| 8 Post-pilot | Waiting on pilot data | No real pilot issues are available in the repo yet. |

## Hardening Fixes Made In Phase 8

- Re-register current device token whenever a new app session is stored, including refresh-token exchange.
- Changed Android launcher/activity name to Arabic.
- Added structured post-pilot triage and release documentation.

## Remaining External Gates

- Configure production `apiBaseUrl`, Firebase web config, Firebase Admin credentials, and `google-services.json`.
- Configure Sentry DSNs and confirm frontend/backend test events.
- Set `ANDROID_HOME` or `frontend/android/local.properties`.
- Create release keystore and local `frontend/android/signing.properties`.
- Run `./gradlew assembleRelease` and install the signed APK on real devices.
- Collect real pilot Sentry/user feedback before claiming post-pilot issues are closed.
