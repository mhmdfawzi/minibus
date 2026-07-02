# Post-Pilot Triage

Phase 8 is designed to start after real Damietta pilot usage. At the time this document was created, no Sentry export, crash report, support log, or direct user feedback file was present in the repository, so there are no real pilot issues to fix yet.

## Intake Sources

- Sentry frontend project: pending real DSN/project access.
- Sentry backend project: pending real DSN/project access.
- Direct passenger feedback: pending pilot notes.
- Direct driver feedback: pending pilot notes.
- Operational/admin feedback: pending pilot notes.

## Issue Register

| ID | Source | Role | Impact | Status | Decision |
| --- | --- | --- | --- | --- | --- |
| P8-001 | Phase 8 kickoff | all | Real pilot feedback not available in repo | Deferred | Cannot prioritize or fix pilot issues without real crash/user data. Import Sentry issues and user notes here after the APK pilot. |
| P8-002 | Phase 7 audit | passenger/driver | Device token registration was not automatically repeated after app refresh-token exchange | Fixed | Added an auth session event and push-service listener so token refresh re-registers the current device token. |
| P8-003 | Phase 7 audit | Android users | Launcher app name was still the generated English placeholder | Fixed | Android strings now use the Arabic app name. |
| P8-004 | Phase 7 audit | release engineer | Signed APK cannot be assembled on this machine until Android SDK path and keystore files exist | Deferred | Documented required local files in `docs/android-pilot-build.md`; this is environment setup, not application code. |

## Triage Policy

Use pilot impact first, not theoretical severity:

1. Blocks booking, accepting, starting/completing trips, or cash handoff trust.
2. Causes data loss, wrong seats, duplicate bookings, or missed critical notifications.
3. Repeated papercuts that drivers/passengers hit daily.
4. Rare edge cases with a workaround.

Every pilot issue should include:

- user role
- device model and Android version
- app build/version
- route/trip/booking IDs if relevant
- Sentry event URL if present
- user-visible symptom in Arabic or translated summary
- final decision: fixed, deferred, duplicate, cannot reproduce
