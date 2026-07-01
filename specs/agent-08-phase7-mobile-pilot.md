# Phase 7 Prompt — Mobile App Polish & Pilot

## Before you start
Read `agent-00-project-context.md` in full — particularly the note that the UI is Arabic-first and RTL should have been considered from the start, not bolted on now.

Assume Phases 0-6 are already done and working: the full backend (auth, drivers, trips, bookings with seat-locking, notifications, ratings, admin oversight) is functionally complete. This phase is about the client experience and getting a real build in front of real pilot users — it is not the phase to discover backend gaps (if you do, flag them explicitly rather than quietly patching around them).

## Goal for this session
A signed Android build that real drivers and passengers in the Damietta pilot can install directly and use end to end, with monitoring in place before you hand it to them.

## Build this
- Full Arabic RTL layout audit across every screen — this should mostly be confirmation/fixes if earlier phases built with RTL in mind, not a rewrite.
- Client-side push notification handling in both foreground and background app states (using the device registration from Phase 5).
- Complete the passenger flow end to end in the UI: pick pickup/dropoff stops, see matching trips, book, see status updates, see driver phone number once accepted, rate after completion.
- Complete the driver flow end to end in the UI: create a trip, see incoming booking requests, accept/reject, start/complete/cancel.
- Capacitor Android build, signed with a real keystore (not debug signing) — document the signing setup so it's repeatable.
- Basic crash/error monitoring (e.g. Sentry free tier) wired into both the client and backend before any real user touches this build — you want to see failures, not have bookings silently fail with no record.

## Key rules for this phase
- This is a direct-APK pilot distribution, not a Play Store submission (that's Phase 8) — don't spend time on Play Store metadata/assets yet.
- Treat this as the phase where real money/trust is on the line for the first time (real drivers, real passengers, real seats) — if you find a gap from an earlier phase (e.g. the seat-locking transaction, the booking hold/expiry job, driver document requirement) that isn't actually solid, stop and fix it here rather than shipping around it.

## Definition of done
- A signed APK installs and runs on a real Android device without a dev environment attached.
- A full pilot scenario works end to end on real devices: driver publishes a trip, passenger finds and books it, driver accepts, both get their notifications, trip runs through start/complete, passenger rates.
- Sentry (or equivalent) is receiving events from a deliberately triggered test error, confirmed before handing the APK to real pilot users.
