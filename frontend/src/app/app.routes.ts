import { Routes } from '@angular/router';
import { FoundationPreviewPage } from './foundation-preview.page';
import { HomePage } from './home.page';

/*
 * Durable screen map lives in docs/frontend-route-map.md.
 * Phase 0 keeps the working pilot app on / while future UI phases fill the
 * mapped auth, passenger, driver, and shared routes incrementally.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'foundation-preview',
    component: FoundationPreviewPage
  }
];
