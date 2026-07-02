import { Component } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { boatOutline, chevronBackOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { EmptyStateComponent } from './shared/empty-state.component';
import { LoadingSkeletonComponent } from './shared/loading-skeleton.component';
import { StarRatingComponent } from './shared/star-rating.component';
import { StatusBadgeComponent } from './shared/status-badge.component';
import { TripCardComponent, TripCardViewModel } from './shared/trip-card.component';

@Component({
  selector: 'app-foundation-preview',
  standalone: true,
  imports: [
    EmptyStateComponent,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    LoadingSkeletonComponent,
    StarRatingComponent,
    StatusBadgeComponent,
    TripCardComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/" text="" />
        </ion-buttons>
        <ion-title>أساسيات الواجهة</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="foundation-preview">
      <section class="foundation-hero">
        <ion-icon name="boat-outline" aria-hidden="true" />
        <div>
          <p>Damietta Transit System</p>
          <h1>مكونات قابلة لإعادة الاستخدام</h1>
        </div>
        <ion-icon class="mirror-check" name="chevron-back-outline" aria-label="اختبار انعكاس الاتجاه" />
      </section>

      <app-trip-card [trip]="sampleTrip" actionLabel="طلب الحجز" />

      <section class="foundation-row" aria-label="حالات الحجز">
        <app-status-badge status="pending" />
        <app-status-badge status="accepted" />
        <app-status-badge status="rejected" />
        <app-status-badge status="completed" />
      </section>

      <app-star-rating [value]="4" [readonly]="true" />
      <app-empty-state title="لا توجد رحلات" message="ستظهر الرحلات المتاحة هنا عند توفرها." icon="∅" />
      <app-loading-skeleton [count]="2" />
    </ion-content>
  `,
  styles: [
    `
      .foundation-preview {
        --padding-bottom: var(--app-space-lg);
        --padding-end: var(--app-space-md);
        --padding-start: var(--app-space-md);
        --padding-top: var(--app-space-md);
      }

      .foundation-hero,
      .foundation-row {
        align-items: center;
        display: flex;
        gap: var(--app-space-sm);
      }

      .foundation-hero {
        color: var(--app-color-primary);
        justify-content: space-between;
        margin-bottom: var(--app-space-sm);
      }

      .foundation-hero ion-icon:first-child {
        font-size: 2rem;
      }

      .foundation-hero h1,
      .foundation-hero p {
        margin: 0;
      }

      .foundation-hero h1 {
        color: var(--app-color-text);
        font-size: 1.35rem;
        font-weight: 800;
      }

      .foundation-hero p {
        color: var(--app-color-text-muted);
        font-size: 0.875rem;
      }

      .foundation-row {
        flex-wrap: wrap;
        margin: var(--app-space-sm) 0;
      }

      .mirror-check {
        font-size: 1.5rem;
        transform: scaleX(-1);
      }
    `
  ]
})
export class FoundationPreviewPage {
  protected readonly sampleTrip: TripCardViewModel = {
    id: 'preview-trip',
    routeName: 'الخلفية إلى دمياط الجديدة',
    pickupName: 'الخلفية',
    dropoffName: 'دمياط الجديدة',
    date: 'اليوم',
    startTime: '08:30',
    availableSeats: 3,
    totalSeats: 7,
    pricePerSeat: 25,
    driverLabel: 'سائق معتمد',
    status: 'accepted'
  };

  constructor() {
    addIcons({ boatOutline, chevronBackOutline });
  }
}
