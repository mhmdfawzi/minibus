# Phase 2 Prompt — Admin: Routes, Stops, Driver Approval

## Before you start
Read `agent-00-project-context.md` in full. Read the "Routes" and "Drivers" sections of `api-spec-v2.md`, and the `routes`, `route_stops`, and `drivers` sections of `database-schema-v2.md`.

Assume Phases 0-1 (repo/schema/CI, Firebase auth + JWT sessions) are already done and working.

## Goal for this session
An admin can manage the fixed routes/stops that trips will run on, and drivers can register and get approved (with the documents an approval actually requires).

## Build this

### Admin bootstrap
- No self-serve admin signup. Seed exactly one admin user manually (e.g. a seed script or direct DB insert) — document how to do this for a fresh environment.

### Routes & stops (admin-only)
- `POST /admin/routes`, `PATCH /admin/routes/:id` — create/update a route (`name`, `direction: outbound|return`, `is_active`).
- `POST /admin/routes/:id/stops`, `PATCH /admin/stops/:id` — add/update stops on a route (`name`, `order_index`, `estimated_offset_minutes`, `is_active`). Enforce the `UNIQUE(route_id, order_index)` constraint from the schema — reject a stop insert/update that would collide.
- `GET /routes`, `GET /routes/:id/stops` — public read endpoints (any authenticated user).

### Driver registration & document upload
- `POST /drivers/register` — creates a `drivers` row linked to the authenticated user (`national_id`, `license_number`, `car_model`, `car_plate`, `car_color`), status starts `pending`.
- `POST /drivers/documents` — upload ID/license photos to object storage (S3-compatible: Cloudflare R2 or Supabase Storage), store the resulting URLs into `drivers.doc_urls`. A driver isn't realistically reviewable by admin without this — treat it as required, not optional, before an admin can approve.
- `GET /admin/drivers/pending` — list drivers awaiting review, including their uploaded documents.
- `PATCH /admin/drivers/:id/approve` — sets status to `approved`.
- `PATCH /admin/drivers/:id/suspend` — sets status to `suspended`; also support a rejection path that sets `rejected` with `drivers.rejection_reason` populated so the driver knows why.

## Key rules for this phase
- Only users with `role = admin` can hit any `/admin/*` endpoint — enforce this in the guard, not just in the frontend.
- A driver's `role` on `users` should already be `driver` by the time they register (set during the profile-completion step from Phase 1) — registering as a driver doesn't change `users.role`, it just creates the linked `drivers` profile.
- Reject document upload formats/sizes sensibly (images only, reasonable size cap) — this is going into permanent storage tied to a real ID document.

## Definition of done
- Admin can create the pilot's route and its stops end to end via the API (or a minimal admin UI if you're building one this phase).
- A test driver can register, upload two document images, and an admin can see them and approve or reject with a reason.
- A rejected/suspended driver cannot create trips (this will be enforced fully in Phase 3, but the driver's `status` must already reflect the decision here).
