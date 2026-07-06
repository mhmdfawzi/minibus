import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { PilotApiService, RouteSummary } from './pilot-api.service';
import { DriverTrip, DriverTripStatus, TripsService } from './api/trips.service';
import { EmptyStateComponent } from './shared/empty-state.component';
import { NotificationBadgeComponent } from './shared/notification-badge.component';
import { StatusBadgeComponent } from './shared/status-badge.component';
import { TripCardComponent, TripCardViewModel } from './shared/trip-card.component';

type TripFilter = DriverTripStatus;

@Component({
  selector: 'app-driver-trips',
  standalone: true,
  imports: [EmptyStateComponent, IonContent, IonSpinner, NotificationBadgeComponent, StatusBadgeComponent, TripCardComponent],
  template: `
    <ion-content class="stitch-auth-page driver-trips-page" fullscreen>
      <header class="driver-trips-topbar">
        <h1>رحلاتي</h1>
        <button type="button" class="stitch-icon-button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
      </header>

      <main class="driver-trips-layout">
        <section class="driver-trips-heading">
          <h2>أهلاً يا كابتن</h2>
          <p>{{ tripsSummary }}</p>
        </section>

        <nav class="trip-filter-row" aria-label="تصفية الرحلات">
          @for (item of filters; track item.value) {
            <button
              type="button"
              [class.is-active]="activeFilter === item.value"
              (click)="activeFilter = item.value"
            >
              {{ item.label }}
            </button>
          }
        </nav>

        @if (isLoading) {
          <div class="driver-trips-loading"><ion-spinner name="crescent" /></div>
        } @else if (filteredTrips.length) {
          <section class="driver-trip-list">
            @for (trip of filteredTrips; track trip.id) {
              <button class="driver-trip-card-button" type="button" (click)="openTrip(trip.id)">
                <app-trip-card [trip]="toCard(trip)" />
              </button>
            }
          </section>
        } @else {
          <app-empty-state
            title="لا توجد رحلات"
            message="ابدأ بإنشاء رحلة جديدة على أحد المسارات المتاحة."
            icon="+"
          />
        }

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </main>

      <button class="driver-floating-add" type="button" aria-label="إنشاء رحلة" (click)="createTrip()">
        <span class="material-symbols-outlined">add</span>
      </button>

      <nav class="passenger-bottom-nav" aria-label="تنقل السائق">
        <button class="is-active" type="button">
          <span class="material-symbols-outlined">directions_bus</span>
          <small>رحلاتي</small>
          <i></i>
        </button>
        <button class="notification-nav-button" type="button" (click)="openNotifications()">
          <span class="material-symbols-outlined">notifications</span>
          <app-notification-badge />
          <small>التنبيهات</small>
        </button>
        <button type="button" (click)="openProfile()">
          <span class="material-symbols-outlined">person</span>
          <small>الملف الشخصي</small>
        </button>
      </nav>
    </ion-content>
  `
})
export class DriverTripsPage {
  trips: DriverTrip[] = [];
  routes: RouteSummary[] = [];
  activeFilter: TripFilter = 'open';
  isLoading = true;
  errorMessage = '';
  readonly filters: { value: TripFilter; label: string }[] = [
    { value: 'open', label: 'مفتوح' },
    { value: 'started', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'منتهي' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  constructor(
    private readonly pilotApi: PilotApiService,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  ionViewWillEnter(): void {
    this.load();
  }

  get filteredTrips(): DriverTrip[] {
    const direction = this.activeFilter === 'completed' ? -1 : 1;
    return this.trips
      .filter((trip) => trip.status === this.activeFilter)
      .sort((first, second) => direction * (this.tripTimestamp(first) - this.tripTimestamp(second)));
  }

  get tripsSummary(): string {
    const openCount = this.trips.filter((trip) => trip.status === 'open' || trip.status === 'started').length;
    return openCount ? `لديك ${openCount} رحلات مجدولة أو نشطة` : 'لا توجد رحلات نشطة حالياً';
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pilotApi.listRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
        this.tripsService.listMine().subscribe({
          next: (trips) => {
            this.trips = trips;
            this.isLoading = false;
          },
          error: (error) => this.fail(error)
        });
      },
      error: (error) => this.fail(error)
    });
  }

  toCard(trip: DriverTrip): TripCardViewModel {
    return {
      id: trip.id,
      routeName: this.routeName(trip.routeId),
      date: this.tripDateLabel(trip.tripDate),
      startTime: this.tripTimeLabel(trip.startTime),
      availableSeats: trip.availableSeats,
      totalSeats: trip.totalSeats,
      pricePerSeat: trip.pricePerSeat,
      driverLabel: this.statusLabel(trip.status),
      status: trip.status === 'open' ? 'open' : trip.status
    };
  }

  routeName(routeId: string): string {
    return this.routes.find((route) => route.id === routeId)?.name ?? 'مسار غير معروف';
  }

  statusLabel(status: DriverTripStatus): string {
    const labels: Record<DriverTripStatus, string> = {
      open: 'مفتوحة',
      started: 'قيد التنفيذ',
      completed: 'منتهية',
      cancelled: 'ملغية'
    };
    return labels[status];
  }

  tripDateLabel(value: string): string {
    const date = this.parseDate(value);
    const today = this.parseDate(new Date().toISOString().slice(0, 10));
    const dayDiff = Math.round((date.getTime() - today.getTime()) / 86400000);
    const formattedDate = new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short'
    }).format(date);

    if (dayDiff === 0) return `النهارده - ${formattedDate}`;
    if (dayDiff === 1) return `بكرة - ${formattedDate}`;
    if (dayDiff === 2) return `بعد بكرة - ${formattedDate}`;

    const weekday = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
    return `${weekday} - ${formattedDate}`;
  }

  tripTimeLabel(value: string): string {
    const [hourText, minuteText = '00'] = value.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const suffix = hour < 12 ? 'ص' : hour === 12 ? 'ظ' : 'م';
    const hourLabel = new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(displayHour);
    const minuteLabel = minute
      ? `:${new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2, useGrouping: false }).format(minute)}`
      : '';
    return `${hourLabel}${minuteLabel} ${suffix}`;
  }

  createTrip(): void {
    void this.router.navigateByUrl('/driver/trips/new');
  }

  openTrip(tripId: string): void {
    void this.router.navigateByUrl(`/driver/trips/${tripId}`);
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openProfile(): void {
    void this.router.navigateByUrl('/driver/profile');
  }

  goBack(): void {
    void this.router.navigateByUrl('/');
  }

  private fail(error: unknown): void {
    this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الرحلات';
    this.isLoading = false;
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private tripTimestamp(trip: DriverTrip): number {
    const [year, month, day] = trip.tripDate.split('-').map(Number);
    const [hour = 0, minute = 0] = trip.startTime.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute).getTime();
  }
}
