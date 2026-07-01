# Build Roadmap (Solo Developer, Phase-Based)

No fixed calendar dates — each phase ends when its checklist is done, then the next phase starts. Suggested order below is dependency-driven (each phase needs the previous one's data model or auth to exist).

## Phase 0 — Foundations
- [ ] Init NestJS backend repo + Ionic/Angular frontend repo
- [ ] Postgres running locally (Docker), Prisma schema from database-schema-v2.md
- [ ] Base error handling, request logging, config/env module
- [ ] CI: lint + build on push (even solo, catches typos early)

## Phase 1 — Auth & Users **[updated — Firebase Auth confirmed]**
- [ ] Firebase project on the Blaze (pay-as-you-go) plan; enable Phone sign-in provider
- [ ] Client: integrate Firebase Auth phone sign-in in the Capacitor app (reCAPTCHA config for web fallback, Play Integrity for Android, APNs silent push for iOS)
- [ ] Test OTP delivery against real Egyptian numbers on each major carrier (Vodafone Egypt, Orange Egypt, Etisalat Misr, WE) before relying on it for the pilot
- [ ] Backend: Firebase Admin SDK integration, POST /auth/firebase-login (verify ID token, upsert user by firebase_uid)
- [ ] JWT (access + refresh) issuance and guard middleware for the app's own session, GET /auth/me, POST /auth/refresh

## Phase 2 — Admin: Routes, Stops, Driver Approval
- [ ] Seed one admin user manually (no self-serve admin signup)
- [ ] Routes/stops CRUD (admin-only)
- [ ] Driver registration + document upload (object storage integration)
- [ ] Admin approve/suspend driver endpoints

## Phase 3 — Driver: Trips
- [ ] Trip create/edit/cancel/start/complete
- [ ] GET /trips/my (driver's own trips)
- [ ] Seat count & status validations

## Phase 4 — Passenger: Search & Booking
- [ ] Trip search by pickup/dropoff stop + date
- [ ] Booking creation with full validation chain (route match, stop order, seat availability, no duplicate active booking)
- [ ] Row-locked transaction for seat decrement (see database-schema-v2.md concurrency rule)
- [ ] Pending-booking hold + expiry background job
- [ ] Accept / reject / cancel booking flows

## Phase 5 — Notifications
- [ ] Reuse the Firebase Admin SDK integration from Phase 1 (same Firebase project, no new vendor setup)
- [ ] POST /devices/register wired from app on login
- [ ] All 5 notification events firing (booking created, accepted, rejected, trip cancelled, trip started)
- [ ] GET /notifications, mark-as-read

## Phase 6 — Ratings & Admin Oversight
- [ ] Rating submission after trip completion (one per passenger per trip)
- [ ] Driver profile shows rating average
- [ ] GET /admin/trips, GET /admin/bookings for oversight

## Phase 7 — Mobile App Polish & Pilot
- [ ] Arabic RTL layout throughout
- [ ] Push notification handling in-app (foreground/background)
- [ ] Capacitor Android build, signed APK
- [ ] Direct APK install for pilot drivers/passengers in Damietta route
- [ ] Basic crash/error monitoring (e.g. Sentry) before handing to real users

## Phase 8 — Post-Pilot Hardening
- [ ] Fix issues surfaced by real drivers/passengers
- [ ] Revisit any MVP shortcuts taken under time pressure
- [ ] Prepare Google Play listing + submission
- [ ] Scope iOS build
