# Frontend Route Map

This route map matches the 17 Stitch screens for the Damietta Transit mobile MVP. Keep future UI phases aligned with these paths unless the product flow changes deliberately.

## Auth

- `/welcome` — Welcome Screen
- `/auth/phone` — Phone Number Entry
- `/auth/otp` — OTP Verification
- `/profile/setup` — Profile Setup

## Passenger

- `/passenger/home` — Home Search (implemented)
- `/passenger/trips/results` — Search Results (implemented)
- `/passenger/trips/:tripId/book` — Trip Booking (implemented)
- `/passenger/bookings/:bookingId/status` — Booking Status (implemented)
- `/passenger/bookings` — My Bookings (implemented)
- `/passenger/rate/:tripId` — Rate Driver
- `/drivers/:driverId` — Driver Profile

## Driver

- `/driver/register` — Driver Registration
- `/driver/pending-approval` — Pending Approval
- `/driver/trips` — My Trips
- `/driver/trips/new` — Create Trip
- `/driver/trips/:tripId` — Trip Management
- `/driver/trips/:tripId/edit` — Edit Trip

## Shared

- `/notifications` — Notifications (implemented)
- `/foundation-preview` — Phase 0 component and RTL verification surface
