import { Routes } from '@angular/router';
import { AuthLandingPage } from './auth-landing.page';
import { FoundationPreviewPage } from './foundation-preview.page';
import { HomePage } from './home.page';
import { OtpVerificationPage } from './otp-verification.page';
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
    component: HomePage
  },
  {
    path: 'driver/trips',
    component: HomePage
  },
  {
    path: 'driver/pending-approval',
    component: HomePage
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
    path: '**',
    redirectTo: ''
  }
];
