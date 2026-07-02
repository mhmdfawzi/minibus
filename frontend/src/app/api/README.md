# API Service Convention

Each backend module gets one Angular service with typed request and response interfaces. New UI phases should prefer these focused services over adding more methods to `PilotApiService`.

- `AuthApiService` currently owns auth/session calls until the auth screens are split.
- `TripsService` owns trip search and driver trip APIs.
- `BookingsService` owns passenger and driver booking APIs.
- `NotificationsService` owns notification list and read-state APIs.

When a UI phase arrives before its backend endpoint is ready, implement the same interface with realistic `of(...)` mock data and mark the method with:

```ts
// TODO: replace mock once Phase X backend lands.
```
