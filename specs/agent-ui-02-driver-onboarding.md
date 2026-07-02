# Codex UI Prompt — Phase 2: Driver Onboarding Screens

## Before you start
Read `agent-00-project-context.md` and `agent-ui-00-foundations.md`. Assume UI Phase 1 (auth screens) already exists and works — a driver arrives at these screens already signed in with `role = driver`.

This phase pairs with backend Phase 2 (`agent-03-phase2-admin-drivers.md`). Read it to know what's implemented: `POST /drivers/register`, `POST /drivers/documents`, admin approve/suspend. Mock against `DriversService` if backend Phase 2 isn't done yet in this repo, per the UI Phase 0 mock convention.

## Goal for this session
A newly-registered driver can submit their details and documents, and see a clear status while waiting on admin review.

## Build this
1. **Driver registration screen** — national ID number, license number, car model/plate/color fields, and an upload control for ID and license photos. Client-side validation before submit (required fields, plausible ID/license format, image file type/size caps).
2. Document upload flow — capture or pick two images (ID, license), preview before submit, upload via `POST /drivers/documents`, show upload progress/failure states clearly (this is a photo upload over mobile data in Egypt, don't assume a fast reliable connection — handle retry).
3. **Pending-approval waiting screen** — shown immediately after registration and every time a `pending`-status driver opens the app. Simple, reassuring state (not a dead end): explain what's happening, no action needed from the driver, will auto-update once approved.
4. Handle the rejected/suspended state too, even though it's not in the original screen list: if `drivers.status = rejected` or `suspended`, show the `rejection_reason` from the backend clearly rather than leaving the driver stuck on a generic pending screen forever.

## Key rules for this phase
- Don't let a driver past this screen set into the rest of the driver flow (trip creation, etc.) until `drivers.status = approved` — check status on every driver-flow entry point, not just at registration time.
- Document upload is a one-time flow for MVP — don't build document re-upload/edit unless the rejected-driver case needs it (it does: a rejected driver should be able to fix and resubmit, so include that path).

## Definition of done
- A test driver account can complete registration, upload two documents, and see the pending-approval screen.
- Approving that driver from the admin side (via API call if the admin panel UI isn't built yet) results in the driver's next app open routing them past this screen into the driver home.
- A rejected driver sees their rejection reason and a working way to resubmit.
