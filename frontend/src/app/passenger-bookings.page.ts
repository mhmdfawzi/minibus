import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingUiStatus, BookingView, BookingsService } from './api/bookings.service';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';
import { NotificationBadgeComponent } from './shared/notification-badge.component';

interface PassengerBookingRow {
  booking: BookingView;
  trip: DriverTrip | null;
}

type BookingFilter = 'all' | 'pending' | 'accepted' | 'completed';

@Component({
  selector: 'app-passenger-bookings',
  standalone: true,
  imports: [IonContent, IonSpinner, NotificationBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page passenger-flow-page my-bookings-stitch" fullscreen>
      <header class="my-bookings-topbar">
        <div class="my-bookings-brand">
          <span class="material-symbols-outlined">directions_bus</span>
          <h1>مسار دمياط</h1>
        </div>
        <button class="stitch-icon-button" type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </header>

      <main class="my-bookings-canvas">
        <div class="my-bookings-tabs-shell">
          <nav class="my-bookings-tabs" aria-label="تصفية الحجوزات">
            @for (filter of filters; track filter.value) {
              <button type="button" [class.is-active]="activeFilter === filter.value" (click)="activeFilter = filter.value">
                {{ filter.label }}
                @if (activeFilter === filter.value) {
                  <span class="active-tab-indicator"></span>
                }
              </button>
            }
          </nav>
        </div>

        @if (isLoading) {
          <section class="passenger-loading"><ion-spinner name="crescent" /></section>
        } @else if (filteredRows.length) {
          <section class="my-bookings-list">
            @for (row of filteredRows; track row.booking.id) {
              <article class="booking-card-stitch" [class.is-muted]="row.booking.status === 'completed'" [attr.data-status]="row.booking.status">
                <button class="booking-card-tap-area" type="button" (click)="openBooking(row.booking.id)" aria-label="فتح تفاصيل الحجز"></button>

                <div class="booking-card-header">
                  <span class="booking-status-pill" [attr.data-status]="statusTone(row.booking.status)">
                    {{ statusLabel(row.booking.status) }}
                  </span>
                  <div class="booking-card-price">
                    <p>{{ row.booking.price }} ج.م</p>
                    <small>#{{ bookingCode(row.booking.id) }}</small>
                  </div>
                </div>

                <div class="booking-route-line">
                  <div class="booking-route-icons">
                    <span class="material-symbols-outlined" [class.is-completed]="row.booking.status === 'completed'">trip_origin</span>
                    <i></i>
                    <span class="material-symbols-outlined destination" [class.is-completed]="row.booking.status === 'completed'">location_on</span>
                  </div>
                  <div class="booking-route-copy">
                    <div>
                      <p>نقطة الانطلاق</p>
                      <strong>{{ stopName(row.booking.pickupStopId) }}</strong>
                    </div>
                    <div>
                      <p>وجهة الوصول</p>
                      <strong>{{ stopName(row.booking.dropoffStopId) }}</strong>
                    </div>
                  </div>
                </div>

                <div class="booking-card-footer">
                  <div class="booking-card-time">
                    <span class="material-symbols-outlined">{{ row.booking.status === 'completed' ? 'event_available' : 'calendar_today' }}</span>
                    <p>{{ displayDate(row) }}</p>
                  </div>
                  <button
                    type="button"
                    [class.is-danger]="row.booking.status === 'pending'"
                    [class.is-primary]="row.booking.status === 'completed'"
                    (click)="handleCardAction(row)"
                  >
                    {{ actionLabel(row.booking.status) }}
                  </button>
                </div>
              </article>
            }
          </section>
        } @else {
          <section class="my-bookings-empty">
            <div>
              <span class="material-symbols-outlined">event_busy</span>
            </div>
            <h2>لا توجد حجوزات</h2>
            <p>يبدو أنك لم تقم بأي حجوزات في هذا القسم بعد.</p>
            <button type="button" (click)="goBack()">احجز رحلتك الآن</button>
          </section>
        }

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </main>

      <nav class="my-bookings-bottom-nav" aria-label="تنقل الراكب">
        <button type="button" (click)="goBack()">
          <span class="material-symbols-outlined">home</span>
          <small>الرئيسية</small>
        </button>
        <button class="is-active" type="button">
          <span class="material-symbols-outlined">directions_bus</span>
          <small>رحلاتي</small>
        </button>
        <button class="notification-nav-button" type="button" (click)="openNotifications()">
          <span class="material-symbols-outlined">notifications</span>
          <app-notification-badge />
          <small>التنبيهات</small>
        </button>
        <button type="button">
          <span class="material-symbols-outlined">person</span>
          <small>الملف الشخصي</small>
        </button>
      </nav>
    </ion-content>
  `
})
export class PassengerBookingsPage implements OnDestroy {
  rows: PassengerBookingRow[] = [];
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  activeFilter: BookingFilter = 'all';
  isLoading = true;
  errorMessage = '';
  private refreshHandle: number | null = null;

  readonly filters: { value: BookingFilter; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'accepted', label: 'مقبول' },
    { value: 'completed', label: 'مكتمل' }
  ];

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pilotApi: PilotApiService,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get filteredRows(): PassengerBookingRow[] {
    if (this.activeFilter === 'all') return this.rows;
    return this.rows.filter((row) => row.booking.status === this.activeFilter);
  }

  ionViewWillEnter(): void {
    void this.load();
    this.refreshHandle = window.setInterval(() => void this.load(false), 30000);
  }

  ionViewDidLeave(): void {
    this.clearRefresh();
  }

  ngOnDestroy(): void {
    this.clearRefresh();
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.isLoading = true;
    this.errorMessage = '';
    try {
      const bookings = await firstValueFrom(this.bookingsService.listMine());
      this.routes = await firstValueFrom(this.pilotApi.listRoutes());
      const rows = await Promise.all(
        bookings.map(async (booking) => ({
          booking,
          trip: await this.loadTrip(booking.tripId)
        }))
      );
      const routeIds = [...new Set(rows.map((row) => row.trip?.routeId).filter(Boolean) as string[])];
      const stopGroups = await Promise.all(routeIds.map((routeId) => firstValueFrom(this.pilotApi.listStops(routeId))));
      this.stops = stopGroups.flat();
      this.rows = rows;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الحجوزات';
    } finally {
      this.isLoading = false;
    }
  }

  openBooking(bookingId: string): void {
    void this.router.navigateByUrl(`/passenger/bookings/${bookingId}/status`);
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  handleCardAction(row: PassengerBookingRow): void {
    if (row.booking.status === 'completed') {
      void this.router.navigate(['/passenger/trips/results'], {
        queryParams: {
          pickupStopId: row.booking.pickupStopId,
          dropoffStopId: row.booking.dropoffStopId,
          date: new Date().toISOString().slice(0, 10)
        }
      });
      return;
    }

    this.openBooking(row.booking.id);
  }

  goBack(): void {
    void this.router.navigateByUrl('/passenger/home');
  }

  routeName(routeId: string): string {
    return this.routes.find((route) => route.id === routeId)?.name || 'مسار دمياط';
  }

  stopName(stopId: string): string {
    return this.stops.find((stop) => stop.id === stopId)?.name || 'محطة';
  }

  dateOnly(value: string): string {
    return value.slice(0, 10);
  }

  displayDate(row: PassengerBookingRow): string {
    const date = row.trip?.tripDate || this.dateOnly(row.booking.createdAt);
    const time = row.trip?.startTime || '';
    return time ? `${date}، ${time}` : date;
  }

  bookingCode(bookingId: string): string {
    return `TR-${bookingId.slice(0, 4).toUpperCase()}`;
  }

  statusLabel(status: BookingUiStatus): string {
    const labels: Record<BookingUiStatus, string> = {
      pending: 'قيد الانتظار',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      cancelled: 'ملغي',
      completed: 'مكتمل',
      expired: 'منتهي'
    };
    return labels[status];
  }

  statusTone(status: BookingUiStatus): 'accepted' | 'pending' | 'completed' | 'rejected' {
    if (status === 'accepted') return 'accepted';
    if (status === 'pending') return 'pending';
    if (status === 'completed') return 'completed';
    return 'rejected';
  }

  actionLabel(status: BookingUiStatus): string {
    const labels: Record<BookingUiStatus, string> = {
      pending: 'إلغاء الطلب',
      accepted: 'التفاصيل',
      rejected: 'التفاصيل',
      cancelled: 'التفاصيل',
      completed: 'إعادة حجز',
      expired: 'التفاصيل'
    };
    return labels[status];
  }

  private async loadTrip(tripId: string): Promise<DriverTrip | null> {
    try {
      return await firstValueFrom(this.tripsService.get(tripId));
    } catch {
      return null;
    }
  }

  private clearRefresh(): void {
    if (this.refreshHandle !== null) {
      window.clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }
}
