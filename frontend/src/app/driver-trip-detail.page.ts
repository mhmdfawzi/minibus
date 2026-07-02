import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingView, BookingsService } from './api/bookings.service';
import { DriverTrip, DriverTripStatus, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';
import { StatusBadgeComponent } from './shared/status-badge.component';

@Component({
  selector: 'app-driver-trip-detail',
  standalone: true,
  imports: [IonContent, IonSpinner, StatusBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="trip-detail-topbar">
        <button class="stitch-icon-button" type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1>مسار دمياط</h1>
        <div class="stitch-top-spacer"></div>
      </header>

      @if (isLoading) {
        <main class="trip-detail-loading"><ion-spinner name="crescent" /></main>
      } @else if (trip) {
        <main class="trip-detail-layout">
          <section class="trip-summary-hero">
            <div class="trip-sail-card">
              <span class="material-symbols-outlined">sailing</span>
            </div>
            <p>{{ statusEyebrow }}</p>
            <h2>{{ routeName(trip.routeId) }}</h2>
            <app-status-badge [status]="trip.status === 'open' ? 'open' : trip.status" [label]="statusLabel(trip.status)" />
          </section>

          <section class="trip-detail-metrics">
            <article>
              <span class="material-symbols-outlined">schedule</span>
              <div>
                <small>وقت التحرك</small>
                <strong>{{ trip.tripDate }} - {{ trip.startTime }}</strong>
              </div>
            </article>
            <article>
              <span class="material-symbols-outlined">payments</span>
              <div>
                <small>سعر المقعد</small>
                <strong>{{ trip.pricePerSeat }} جنيه</strong>
              </div>
            </article>
            <article>
              <span class="material-symbols-outlined">event_seat</span>
              <div>
                <small>المقاعد</small>
                <strong>{{ trip.availableSeats }} / {{ trip.totalSeats }}</strong>
              </div>
            </article>
          </section>

          <section class="trip-booking-requests">
            <div class="section-heading-row">
              <div>
                <h3>طلبات الحجز</h3>
                <p>يتم تحديث المقاعد والطلبات من الخادم بعد كل إجراء.</p>
              </div>
              <span>{{ tripBookings.length }}</span>
            </div>

            @for (booking of tripBookings; track booking.id) {
              <article class="trip-booking-request-card">
                <div class="request-main">
                  <div>
                    <strong>{{ passengerLabel(booking) }}</strong>
                    <p>{{ stopName(booking.pickupStopId) }} ← {{ stopName(booking.dropoffStopId) }}</p>
                  </div>
                  <app-status-badge [status]="booking.status" />
                </div>
                <div class="request-meta">
                  <span>{{ booking.seatsCount }} مقعد</span>
                  <span>{{ booking.price }} جنيه</span>
                </div>
                @if (booking.status === 'pending') {
                  <div class="request-actions">
                    <button class="trip-secondary-action" type="button" [disabled]="isMutating" (click)="acceptBooking(booking.id)">
                      قبول
                    </button>
                    <button class="trip-danger-action" type="button" [disabled]="isMutating" (click)="rejectBooking(booking.id)">
                      رفض
                    </button>
                  </div>
                }
              </article>
            } @empty {
              <div class="trip-booking-empty">
                <span class="material-symbols-outlined">confirmation_number</span>
                <p>لا توجد طلبات حجز على هذه الرحلة حتى الآن.</p>
              </div>
            }
          </section>

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }
        </main>

        <footer class="trip-detail-actions">
          @if (trip.status === 'open') {
            <button class="trip-secondary-action" type="button" (click)="editTrip()">
              <span class="material-symbols-outlined">edit</span>
              تعديل
            </button>
            <button class="stitch-primary-action" type="button" [disabled]="isMutating" (click)="startTrip()">
              <span class="material-symbols-outlined">play_arrow</span>
              بدء الرحلة
            </button>
            <button class="trip-danger-action" type="button" [disabled]="isMutating" (click)="cancelTrip()">
              <span class="material-symbols-outlined">cancel</span>
              إلغاء الرحلة
            </button>
          } @else if (trip.status === 'started') {
            <button class="stitch-primary-action" type="button" [disabled]="isMutating" (click)="completeTrip()">
              <span class="material-symbols-outlined">check_circle</span>
              إكمال الرحلة
            </button>
            <button class="trip-danger-action" type="button" [disabled]="isMutating" (click)="cancelTrip()">
              <span class="material-symbols-outlined">cancel</span>
              إلغاء الرحلة
            </button>
          } @else {
            <button class="trip-readonly-action" type="button" disabled>
              هذه الرحلة للعرض فقط
            </button>
          }
        </footer>
      }
    </ion-content>
  `
})
export class DriverTripDetailPage {
  trip: DriverTrip | null = null;
  bookings: BookingView[] = [];
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  isLoading = true;
  isMutating = false;
  errorMessage = '';

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pilotApi: PilotApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get tripId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  get statusEyebrow(): string {
    if (this.trip?.status === 'started') return 'الرحلة النشطة';
    if (this.trip?.status === 'completed') return 'رحلة مكتملة';
    if (this.trip?.status === 'cancelled') return 'رحلة ملغية';
    return 'رحلة مفتوحة';
  }

  get tripBookings(): BookingView[] {
    return this.bookings.filter((booking) => booking.tripId === this.tripId);
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [routes, trip, bookings] = await Promise.all([
        firstValueFrom(this.pilotApi.listRoutes()),
        firstValueFrom(this.tripsService.get(this.tripId)),
        firstValueFrom(this.bookingsService.listDriverBookings())
      ]);
      this.routes = routes;
      this.trip = trip;
      this.bookings = bookings;
      this.stops = await firstValueFrom(this.pilotApi.listStops(trip.routeId));
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isLoading = false;
    }
  }

  routeName(routeId: string): string {
    return this.routes.find((route) => route.id === routeId)?.name ?? 'مسار غير معروف';
  }

  statusLabel(status: DriverTripStatus): string {
    const labels: Record<DriverTripStatus, string> = {
      open: 'مفتوحة',
      started: 'قيد التنفيذ',
      completed: 'مكتملة',
      cancelled: 'ملغية'
    };
    return labels[status];
  }

  stopName(stopId: string): string {
    return this.stops.find((stop) => stop.id === stopId)?.name ?? 'محطة';
  }

  passengerLabel(booking: BookingView): string {
    return booking.passenger?.fullName || booking.passenger?.phone || `راكب ${booking.passengerId.slice(0, 8)}`;
  }

  editTrip(): void {
    if (!this.trip) return;
    void this.router.navigateByUrl(`/driver/trips/${this.trip.id}/edit`);
  }

  async startTrip(): Promise<void> {
    await this.mutate(() => this.tripsService.start(this.tripId));
  }

  async completeTrip(): Promise<void> {
    await this.mutate(() => this.tripsService.complete(this.tripId));
  }

  async cancelTrip(): Promise<void> {
    await this.mutate(() => this.tripsService.cancel(this.tripId));
  }

  async acceptBooking(bookingId: string): Promise<void> {
    await this.mutateBooking(() => this.bookingsService.accept(bookingId));
  }

  async rejectBooking(bookingId: string): Promise<void> {
    await this.mutateBooking(() => this.bookingsService.reject(bookingId));
  }

  goBack(): void {
    void this.router.navigateByUrl('/driver/trips');
  }

  private async mutate(action: () => ReturnType<TripsService['start']>): Promise<void> {
    this.isMutating = true;
    this.errorMessage = '';
    try {
      this.trip = await firstValueFrom(action());
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isMutating = false;
    }
  }

  private async mutateBooking(action: () => ReturnType<BookingsService['accept']>): Promise<void> {
    this.isMutating = true;
    this.errorMessage = '';
    try {
      await firstValueFrom(action());
      const [trip, bookings] = await Promise.all([
        firstValueFrom(this.tripsService.get(this.tripId)),
        firstValueFrom(this.bookingsService.listDriverBookings())
      ]);
      this.trip = trip;
      this.bookings = bookings;
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isMutating = false;
    }
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'تعذر تحديث الرحلة';
  }
}
