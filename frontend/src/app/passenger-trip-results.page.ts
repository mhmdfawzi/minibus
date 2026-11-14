import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { PublicDriverProfile, DriversService } from './api/drivers.service';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';
import { AvatarComponent } from './shared/avatar.component';
import { EmptyStateComponent } from './shared/empty-state.component';
import { NotificationBadgeComponent } from './shared/notification-badge.component';

interface SearchTripResult {
  trip: DriverTrip;
  driver: PublicDriverProfile | null;
}

@Component({
  selector: 'app-passenger-trip-results',
  standalone: true,
  imports: [AvatarComponent, EmptyStateComponent, IonContent, IonSpinner, NotificationBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page passenger-results-stitch" fullscreen>
      <header class="results-topbar">
        <div class="results-title-cluster">
          <button type="button" aria-label="رجوع" (click)="goBack()">
            <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
          </button>
          <div>
            <h1>{{ stopName(pickupStopId) }} - {{ stopName(dropoffStopId) }}</h1>
            <p>{{ displayDate }} • {{ passengerCountLabel }}</p>
          </div>
        </div>
        <div class="stitch-top-spacer"></div>
      </header>

      <main class="results-canvas">
        <nav class="results-filter-pills" aria-label="ترتيب الرحلات">
          @for (filter of sortFilters; track filter) {
            <button type="button" [class.is-active]="activeSort === filter" (click)="activeSort = filter">
              {{ filter }}
            </button>
          }
        </nav>

        @if (isLoading) {
          <section class="passenger-loading"><ion-spinner name="crescent" /></section>
        } @else if (results.length) {
          <section class="results-trip-list">
            @for (result of sortedResults; track result.trip.id; let index = $index) {
              <article class="results-trip-card" (click)="openTrip(result.trip.id)">
                @if (index === 1) {
                  <span class="nearest-ribbon">الأقرب إليك</span>
                }

                <div class="results-card-main" [class.has-ribbon]="index === 1">
                  <div class="results-time">
                    <strong>{{ result.trip.startTime }}</strong>
                    <small>مدة الرحلة: {{ estimatedDuration(result.trip) }}</small>
                  </div>
                  <div class="results-price">
                    <strong>{{ money(result.trip.pricePerSeat) }} ج.م</strong>
                    <small>للمقعد الواحدة</small>
                  </div>
                </div>

                <div class="results-driver-row">
                  <app-avatar [name]="result.driver?.fullName" size="md" />
                  <div class="results-driver-copy">
                    <div>
                      <strong>{{ result.driver?.fullName || 'سائق معتمد' }}</strong>
                      <span>
                        <span class="material-symbols-outlined">star</span>
                        {{ ratingLabel(result.driver) }}
                      </span>
                    </div>
                    <p>{{ carLabel(result.trip) }}</p>
                  </div>
                  <span class="results-seats-chip" [class.is-low]="result.trip.availableSeats <= 1">
                    {{ seatsLabel(result.trip.availableSeats) }}
                  </span>
                </div>

                <div class="results-route-row">
                  <div class="results-route-dots">
                    <span></span>
                    <i></i>
                    <span></span>
                  </div>
                  <div>
                    <p>{{ stopName(pickupStopId) }}</p>
                    <p>{{ stopName(dropoffStopId) }}</p>
                  </div>
                </div>
              </article>
            }
          </section>
        } @else {
          <app-empty-state
            title="لا توجد رحلات مناسبة"
            message="جرّب تغيير التاريخ أو اختيار محطات أخرى على نفس المسار."
            icon="⌕"
          />
        }

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </main>

      <nav class="passenger-bottom-nav" aria-label="تنقل الراكب">
        <button class="is-active" type="button" (click)="goBack()">
          <span class="material-symbols-outlined">home</span>
          <small>الرئيسية</small>
        </button>
        <button type="button" (click)="openMyBookings()">
          <span class="material-symbols-outlined">directions_bus</span>
          <small>رحلاتي</small>
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
export class PassengerTripResultsPage {
  results: SearchTripResult[] = [];
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  isLoading = true;
  errorMessage = '';
  activeSort = 'الأسرع';
  readonly sortFilters = ['الأسرع', 'الأقل سعراً', 'المغادرة مبكراً'];

  constructor(
    private readonly driversService: DriversService,
    private readonly pilotApi: PilotApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get pickupStopId(): string {
    return this.route.snapshot.queryParamMap.get('pickupStopId') || '';
  }

  get dropoffStopId(): string {
    return this.route.snapshot.queryParamMap.get('dropoffStopId') || '';
  }

  get date(): string {
    return this.route.snapshot.queryParamMap.get('date') || new Date().toISOString().slice(0, 10);
  }

  get displayDate(): string {
    return this.date;
  }

  get passengerCountLabel(): string {
    return '١ راكب';
  }

  get sortedResults(): SearchTripResult[] {
    const results = [...this.results];
    if (this.activeSort === 'الأقل سعراً') {
      return results.sort((first, second) => Number(first.trip.pricePerSeat) - Number(second.trip.pricePerSeat));
    }
    if (this.activeSort === 'المغادرة مبكراً') {
      return results.sort((first, second) => first.trip.startTime.localeCompare(second.trip.startTime));
    }
    return results.sort((first, second) => first.trip.startTime.localeCompare(second.trip.startTime));
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const trips = await firstValueFrom(
        this.tripsService.search({
          pickupStopId: this.pickupStopId,
          dropoffStopId: this.dropoffStopId,
          date: this.date
        })
      );
      this.routes = await firstValueFrom(this.pilotApi.listRoutes());
      const routeIds = [...new Set(trips.map((trip) => trip.routeId))];
      const stopGroups = await Promise.all(routeIds.map((routeId) => firstValueFrom(this.pilotApi.listStops(routeId))));
      this.stops = stopGroups.flat();
      this.results = await Promise.all(
        trips.map(async (trip) => ({
          trip,
          driver: await this.loadDriver(trip.driverId)
        }))
      );
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الرحلات';
    } finally {
      this.isLoading = false;
    }
  }

  openTrip(tripId: string): void {
    void this.router.navigate(['/passenger/trips', tripId, 'book'], {
      queryParams: {
        pickupStopId: this.pickupStopId,
        dropoffStopId: this.dropoffStopId,
        date: this.date
      }
    });
  }

  goBack(): void {
    void this.router.navigateByUrl('/passenger/home');
  }

  openMyBookings(): void {
    void this.router.navigateByUrl('/passenger/bookings');
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openProfile(): void {
    void this.router.navigateByUrl('/passenger/profile');
  }

  stopName(stopId: string): string {
    return this.stops.find((stop) => stop.id === stopId)?.name || 'محطة';
  }

  money(value: string | number): string {
    return Number(value).toFixed(0);
  }

  estimatedDuration(_trip: DriverTrip): string {
    return '٤٥ دقيقة';
  }

  ratingLabel(driver: PublicDriverProfile | null): string {
    return driver?.ratingAverage ? driver.ratingAverage.toFixed(1) : 'جديد';
  }

  carLabel(trip: DriverTrip): string {
    const car = trip.driverCar;
    return car ? `${car.model} - ${car.color}` : 'سيارة معتمدة';
  }

  seatsLabel(seats: number): string {
    return seats <= 1 ? 'مقعد واحد فقط!' : `${seats} مقاعد شاغرة`;
  }

  private async loadDriver(driverId: string): Promise<PublicDriverProfile | null> {
    try {
      return await firstValueFrom(this.driversService.getPublicProfile(driverId));
    } catch {
      return null;
    }
  }
}
