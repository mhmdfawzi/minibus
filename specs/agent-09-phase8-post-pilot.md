# Phase 8 Prompt — Post-Pilot Hardening

## Before you start
Read `agent-00-project-context.md` in full. This phase starts only after real pilot usage has happened (Phase 7's APK is in the hands of real drivers/passengers) — you should have actual bug reports, crash logs, and usage patterns to work from, not hypothetical ones.

Assume Phases 0-7 are fully done: the whole product works and has been used by real people on a real route.

## Goal for this session
Turn pilot feedback into fixes, close out any shortcuts taken to hit the pilot deadline, and prepare for a wider release.

## Build this
- Triage and fix issues surfaced by real drivers/passengers during the pilot (pull from Sentry/crash reports and direct user feedback).
- Revisit anything flagged as a shortcut during Phases 0-7 — check each phase prompt's "Definition of done" was actually fully met, not partially, and close any gaps found.
- Prepare Google Play Store listing and submission (icons, screenshots, store description, privacy policy, content rating) — this was deliberately deferred from Phase 7's direct-APK pilot distribution.
- Scope (don't necessarily build yet) the iOS release: what Capacitor/iOS-specific work remains, App Store requirements, Apple's stricter phone-auth/push entitlement setup.

## Key rules for this phase
- Prioritize fixes by real pilot impact, not by theoretical severity — a rare edge case that never actually happened during the pilot is lower priority than a papercut every driver hit daily.
- Don't scope-creep new features here; this phase is about hardening what exists and getting it store-ready, not adding capability beyond the original MVP scope (payments, live tracking, chat, dynamic pricing are still explicitly out of scope).

## Definition of done
- Every issue found during the pilot is either fixed or explicitly triaged/deferred with a reason.
- Play Store submission assets are complete and the app is submitted or ready to submit.
- A written scope (even a short one) exists for the iOS release, so it can be picked up as a follow-on phase without re-deriving context.
