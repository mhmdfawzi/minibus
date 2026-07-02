import { Routes } from '@angular/router';
import { AuthLandingPage } from './auth-landing.page';
import { approvedDriverGuard } from './driver-onboarding.guard';
import { DriverPendingApprovalPage } from './driver-pending-approval.page';
import { DriverRegistrationPage } from './driver-registration.page';
import { DriverTripDetailPage } from './driver-trip-detail.page';
import { DriverTripFormPage } from './driver-trip-form.page';
import { DriverTripsPage } from './driver-trips.page';
import { FoundationPreviewPage } from './foundation-preview.page';
import { HomePage } from './home.page';
import { NotificationsPage } from './notifications.page';
import { OtpVerificationPage } from './otp-verification.page';
import { PassengerBookingDetailPage } from './passenger-booking-detail.page';
import { PassengerBookingsPage } from './passenger-bookings.page';
import { PassengerSearchPage } from './passenger-search.page';
import { PassengerTripBookingPage } from './passenger-trip-booking.page';
import { PassengerTripResultsPage } from './passenger-trip-results.page';
import { PhoneEntryPage } from './phone-entry.page';
import { ProfileSetupPage } from './profile-setup.page';
import { WelcomePage } from './welcome.page';

/*
 * Durable screen map lives in docs/frontend-route-map.md.
 * Phase 0 keeps the working pilot app on / while future UI phases fill the
 * mapped auth, passenger, driver, and shared routes incrementally.
 */
export const routes: Routes = [
  {
    path: '',
    component: AuthLandingPage
  },
  {
    path: 'welcome',
    component: WelcomePage
  },
  {
    path: 'auth/phone',
    component: PhoneEntryPage
  },
  {
    path: 'auth/otp',
    component: OtpVerificationPage
  },
  {
    path: 'profile/setup',
    component: ProfileSetupPage
  },
  {
    path: 'passenger/home',
    component: PassengerSearchPage
  },
  {
    path: 'passenger/trips/results',
    component: PassengerTripResultsPage
  },
  {
    path: 'passenger/trips/:tripId/book',
    component: PassengerTripBookingPage
  },
  {
    path: 'passenger/bookings',
    component: PassengerBookingsPage
  },
  {
    path: 'passenger/bookings/:bookingId/status',
    component: PassengerBookingDetailPage
  },
  {
    path: 'driver/trips',
    component: DriverTripsPage,
    canActivate: [approvedDriverGuard]
  },
  {
    path: 'driver/trips/new',
    component: DriverTripFormPage,
    canActivate: [approvedDriverGuard]
  },
  {
    path: 'driver/trips/:id/edit',
    component: DriverTripFormPage,
    canActivate: [approvedDriverGuard]
  },
  {
    path: 'driver/trips/:id',
    component: DriverTripDetailPage,
    canActivate: [approvedDriverGuard]
  },
  {
    path: 'driver/register',
    component: DriverRegistrationPage
  },
  {
    path: 'driver/pending-approval',
    component: DriverPendingApprovalPage
  },
  {
    path: 'admin',
    component: HomePage
  },
  {
    path: 'foundation-preview',
    component: FoundationPreviewPage
  },
  {
    path: 'notifications',
    component: NotificationsPage
  },
  {
    path: '**',
    redirectTo: ''
  }
];
