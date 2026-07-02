# Shared UI Components

Phase 0 components are standalone Angular components and must keep using tokens from `frontend/src/theme/damietta-theme.scss`.

## `app-trip-card`

- `trip: TripCardViewModel` — route, timing, seats, price, optional stops, driver label, and status.
- `actionLabel?: string` — shows a full-width CTA when provided.
- `action: EventEmitter<string>` — emits the trip id.

## `app-status-badge`

- `status: AppStatus` — `pending`, `accepted`, `rejected`, `cancelled`, `completed`, `expired`, `open`, or `started`.
- `label?: string` — optional Arabic label override.

## `app-star-rating`

- `value: number` — selected/read-only rating from 1 to 5.
- `readonly: boolean` — disables user selection when true.
- `valueChange: EventEmitter<number>` — emits the selected rating.

## `app-empty-state`

- `title: string` — short empty-list title.
- `message?: string` — optional helper text.
- `icon?: string` — compact visual marker.

## `app-loading-skeleton`

- `count: number` — number of placeholder cards to render.
