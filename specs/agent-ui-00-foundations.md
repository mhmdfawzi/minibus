# Codex UI Prompt — Phase 0: Design System & Navigation Foundation

## Before you start
Read `agent-00-project-context.md` in this repo first. This prompt is the UI counterpart to the backend's Phase 0 — it doesn't depend on any backend endpoint existing yet, so it can run as soon as the Ionic/Angular/Capacitor project itself exists (backend Phase 0).

Design source: designs for all 17 screens were generated in Google Stitch. [Attach the Stitch export — screenshots, Figma link, or exported HTML/CSS. If nothing is attached, stop and ask before writing UI code.] This phase only needs the design system (colors, type, spacing) extracted from that export, not the full screens yet.

## Goal for this session
Every later UI phase should be able to build a screen by composing existing pieces, not inventing colors or components from scratch. This phase produces those pieces.

## Build this
1. **Theme file** — one SCSS/Ionic-theme file with these tokens (pull exact values from the Stitch export if it's more precise, otherwise use these):
   - Primary: deep royal navy blue `#0B2E6B`
   - Secondary: sky/sea blue `#5FA8D3`
   - Accent: golden yellow `#F2C230` (sparing use — primary CTAs, highlights only)
   - Background: off-white/cream `#FBF9F4`
   - Text: dark navy `#101B33`
   - Font: Cairo or Tajawal
   - Card radius: 16px
   - Status badge colors: gold/amber = pending, green = accepted, red = rejected/cancelled, gray = completed
2. **Global RTL setup** — Arabic is the only language for MVP. Set `dir="rtl"` app-wide, verify Ionic's RTL support is active, and specifically check that back-buttons, chevrons, and icon-based nav mirror correctly (not just text alignment — this is the part people get wrong).
3. **Route map** — propose a full route map covering all 17 screens across both flows (auth, passenger, driver) even though most won't be built until later phases. Get this reviewed/confirmed before later phases start generating pages against it, since a route restructure later is expensive.
4. **Shared components**, built once and reused everywhere:
   - Trip card (used in search results, my trips, my bookings)
   - Status badge (pending/accepted/rejected/cancelled/completed, using the color convention above)
   - Star rating input (used in rate-driver screen, read-only mode for driver profile)
   - Empty state (used wherever a list can be empty — no trips found, no bookings yet, etc.)
   - Loading skeleton (used while any list or detail screen is fetching)
5. **API service scaffolding convention** — establish the pattern later phases will follow: one Angular service per backend module (`AuthService`, `TripsService`, `BookingsService`, etc.), each with a typed interface. Where a phase builds a screen before its backend exists, the service implementation is a mock returning realistic fake data with the same interface — marked `// TODO: replace mock once Phase X backend lands`.

## Key rules for this phase
- No actual screens get built in this phase — it's infrastructure only. Resist the urge to jump ahead to auth screens here.
- Every later phase prompt assumes these tokens, components, and conventions exist — get them right once instead of drifting screen to screen.

## Definition of done
- The theme file is the single source of truth for every color/font/radius used anywhere in the app — grep for hardcoded hex values outside the theme file and there should be none.
- RTL is verified on a real screen (even a placeholder one) with a back button and an icon that correctly mirror.
- The route map is written down somewhere durable (e.g. a routing module comment or a short doc) that later phases can check against.
- The 5 shared components exist, are used in at least one placeholder screen each, and are documented (props/inputs) well enough that later phases don't need to guess their API.
