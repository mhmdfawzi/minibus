import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingView, BookingsService } from './api/bookings.service';
import { PublicDriverProfile, DriversService } from './api/drivers.service';
import { RatingView, RatingsService } from './api/ratings.service';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';
import { NotificationBadgeComponent } from './shared/notification-badge.component';
import { StatusBadgeComponent } from './shared/status-badge.component';

@Component({
  selector: 'app-passenger-booking-detail',
  standalone: true,
  imports: [IonContent, IonSpinner, NotificationBadgeComponent, StatusBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page passenger-flow-page" fullscreen>
      <header class="passenger-topbar">
        <button class="stitch-icon-button" type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1>حالة الحجز</h1>
        <button class="stitch-icon-button notification-nav-button" type="button" aria-label="التنبيهات" (click)="openNotifications()">
          <span class="material-symbols-outlined">notifications</span>
          <app-notification-badge />
        </button>
      </header>

      @if (isLoading) {
        <main class="passenger-loading"><ion-spinner name="crescent" /></main>
      } @else if (booking) {
        <main class="passenger-layout with-footer">
          <section class="booking-status-hero">
            <app-status-badge [status]="booking.status" />
            <h2>{{ statusTitle }}</h2>
            <p>{{ statusMessage }}</p>
          </section>

          <section class="booking-info-grid">
            <article>
              <span class="material-symbols-outlined">route</span>
              <small>المسار</small>
              <strong>{{ routeName(trip?.routeId || '') }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">schedule</span>
              <small>الموعد</small>
              <strong>{{ trip?.tripDate || dateOnly(booking.createdAt) }} - {{ trip?.startTime || '' }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">location_on</span>
              <small>الصعود</small>
              <strong>{{ stopName(booking.pickupStopId) }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">flag</span>
              <small>الوصول</small>
              <strong>{{ stopName(booking.dropoffStopId) }}</strong>
            </article>
          </section>

          <button class="driver-mini-card driver-profile-link" type="button" (click)="openDriverProfile()">
            <span class="material-symbols-outlined">account_circle</span>
            <div>
              <small>السائق والسيارة</small>
              <strong>{{ driver?.fullName || 'سائق معتمد' }}</strong>
              <p>{{ carLabel }}</p>
            </div>
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          @if (canRate) {
            <section class="rate-prompt-card">
              <div>
                <span class="material-symbols-outlined">star</span>
                <div>
                  <h3>قيّم رحلتك</h3>
                  <p>ساعد الركاب الآخرين بتقييم السائق بعد اكتمال الرحلة.</p>
                </div>
              </div>
              <button type="button" (click)="openRateDriver()">تقييم السائق</button>
            </section>
          }

          @if (acceptedPhone) {
            <a class="driver-call-card" [href]="'tel:' + acceptedPhone">
              <span class="material-symbols-outlined">call</span>
              <div>
                <small>رقم السائق</small>
                <strong dir="ltr">{{ acceptedPhone }}</strong>
              </div>
            </a>
          }

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }
        </main>

        @if (canCancel) {
          <footer class="trip-form-footer">
            <button class="trip-danger-action trip-publish-action" type="button" [disabled]="isMutating" (click)="cancelBooking()">
              @if (isMutating) {
                <ion-spinner name="crescent" />
              } @else {
                <span class="material-symbols-outlined">cancel</span>
                إلغاء الحجز
              }
            </button>
          </footer>
        }
      }
    </ion-content>
  `
})
export class PassengerBookingDetailPage implements OnDestroy {
  booking: BookingView | null = null;
  trip: DriverTrip | null = null;
  driver: PublicDriverProfile | null = null;
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  ratings: RatingView[] = [];
  isLoading = true;
  isMutating = false;
  errorMessage = '';
  private refreshHandle: number | null = null;

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly driversService: DriversService,
    private readonly pilotApi: PilotApiService,
    private readonly ratingsService: RatingsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get bookingId(): string {
    return this.route.snapshot.paramMap.get('bookingId') || '';
  }

  get canCancel(): boolean {
    return this.booking?.status === 'pending' || this.booking?.status === 'accepted';
  }

  get acceptedPhone(): string {
    return this.booking?.status === 'accepted' ? this.driver?.phone || '' : '';
  }

  get carLabel(): string {
    const car = this.trip?.driverCar;
    return car ? `${car.model} - ${car.color} - ${car.plate}` : 'بيانات السيارة';
  }

  get statusTitle(): string {
    const labels: Record<BookingView['status'], string> = {
      pending: 'طلبك بانتظار موافقة السائق',
      accepted: 'تم قبول الحجز',
      rejected: 'تم رفض الطلب',
      cancelled: 'تم إلغاء الحجز',
      completed: 'رحلة مكتملة',
      expired: 'انتهت مهلة الحجز'
    };
    return this.booking ? labels[this.booking.status] : '';
  }

  get statusMessage(): string {
    const labels: Record<BookingView['status'], string> = {
      pending: 'سنحدّث هذه الصفحة تلقائياً عند تغير الحالة.',
      accepted: 'يمكنك الآن الاتصال بالسائق من هذه الصفحة فقط.',
      rejected: 'ابحث عن رحلة أخرى مناسبة لنفس المسار.',
      cancelled: 'أعد البحث عندما تحتاج رحلة جديدة.',
      completed: 'شكراً لاستخدامك التطبيق.',
      expired: 'انتهت مهلة انتظار الموافقة وأعيدت المقاعد للبحث.'
    };
    return this.booking ? labels[this.booking.status] : '';
  }

  get canRate(): boolean {
    if (!this.booking || !this.trip || !this.driver) return false;
    const isCompleted = this.booking.status === 'completed' && this.trip.status === 'completed';
    const alreadyRated = this.ratings.some(
      (rating) => rating.tripId === this.trip?.id && rating.passengerId === this.booking?.passengerId
    );
    return isCompleted && !alreadyRated;
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
      this.booking = bookings.find((item) => item.id === this.bookingId) || null;
      if (!this.booking) {
        this.errorMessage = 'لم يتم العثور على الحجز';
        return;
      }
      this.trip = await firstValueFrom(this.tripsService.get(this.booking.tripId));
      const [routes, stops, driver] = await Promise.all([
        firstValueFrom(this.pilotApi.listRoutes()),
        firstValueFrom(this.pilotApi.listStops(this.trip.routeId)),
        this.loadDriver(this.trip.driverId)
      ]);
      this.routes = routes;
      this.stops = stops;
      this.driver = driver;
      this.ratings = driver
        ? await firstValueFrom(this.ratingsService.listDriverRatings(driver.id))
        : [];
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الحجز';
    } finally {
      this.isLoading = false;
    }
  }

  async cancelBooking(): Promise<void> {
    if (!this.booking) return;
    this.isMutating = true;
    this.errorMessage = '';
    try {
      this.booking = await firstValueFrom(this.bookingsService.cancel(this.booking.id));
      await this.load(false);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر إلغاء الحجز';
    } finally {
      this.isMutating = false;
    }
  }

  goBack(): void {
    void this.router.navigateByUrl('/passenger/bookings');
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openDriverProfile(): void {
    if (!this.driver) return;
    void this.router.navigateByUrl(`/drivers/${this.driver.id}`);
  }

  openRateDriver(): void {
    if (!this.trip) return;
    void this.router.navigateByUrl(`/passenger/rate/${this.trip.id}`);
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

  private async loadDriver(driverId: string): Promise<PublicDriverProfile | null> {
    try {
      return await firstValueFrom(this.driversService.getPublicProfile(driverId));
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
