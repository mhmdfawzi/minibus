import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingsService } from './api/bookings.service';
import { PublicDriverProfile, DriversService } from './api/drivers.service';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';

@Component({
  selector: 'app-passenger-trip-booking',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page passenger-booking-stitch" fullscreen>
      <header class="booking-detail-topbar">
        <button type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1>تفاصيل الرحلة</h1>
        <span></span>
      </header>

      @if (isLoading) {
        <main class="passenger-loading"><ion-spinner name="crescent" /></main>
      } @else if (trip) {
        <main class="booking-detail-canvas">
          <section class="trip-path-card">
            <div class="trip-path-main">
              <div class="trip-path-points">
                <div>
                  <span></span>
                  <p>{{ stopName(pickupStopId) }}</p>
                </div>
                <i></i>
                <div>
                  <span></span>
                  <p>{{ stopName(dropoffStopId) }}</p>
                </div>
              </div>
              <div class="trip-path-time">
                <strong>{{ trip.startTime }}</strong>
                <small>{{ trip.tripDate }}</small>
              </div>
            </div>
            <div class="trip-path-meta">
              <span>
                <span class="material-symbols-outlined">timer</span>
                45 دقيقة
              </span>
              <span>
                <span class="material-symbols-outlined">distance</span>
                12 كم
              </span>
            </div>
          </section>

          <section class="vehicle-driver-grid">
            <article class="vehicle-card">
              <div>
                <span>ممتاز</span>
                <h2>{{ vehicleTitle }}</h2>
                <p>{{ vehiclePlate }}</p>
              </div>
              <img
                alt=""
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5_PX-IgJ2Tlm-t34CS--8KQxJ8pHKZ7-5FJ71Ys5nay9TwTnw_hLvrFEYI5br0Q5Xf4gWv1qgDQQwPQ0WC3NISl9DSV1NItqZTfaUboUWpkYLAoIHvxCgnzXJBQqtj8rBgcGeNo609_-sCZbQgl5oYOu70GdhUfljIpWvFdJxGfudlwbODNy2cOjgz5H2qfiGLYjzT4_SE3HSZEJ3Md0tsnA0_tJq2f4lq654lQdQs0BzS36nmuSbDw"
              />
            </article>

            <article class="booking-driver-card">
              <div>
                <img
                  alt=""
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKJyeT6rH4GY1_o-V7N0LS1mooRHg0BleI5PYxZMDYn1tM8iFEY29_Pp0vHiF5CfaAcPY1lUel1wpjeeUDKz-YBqS0ScaIQafUkoOzlOUemYI1ScG5KA1FTipRo9KFABZaUjK9yyzzMQDigRJJAbop5aypwBjcp8w093e0Ivk2BUnSAna9iykyBo4qZNbF6lNQpvTdqr4SpUECTg2vXDuo7pv-E9EeTKcw1w3IRLlmXHFEtalwMJvS9g"
                />
                <span class="material-symbols-outlined">verified</span>
              </div>
              <p>{{ driver?.fullName || 'سائق معتمد' }}</p>
              <small>
                <span class="material-symbols-outlined">star</span>
                {{ driverRating }}
              </small>
            </article>
          </section>

          <section class="seat-selection-card">
            <div class="seat-card-header">
              <div>
                <h2>عدد المقاعد</h2>
                <p>المقاعد المتاحة: {{ trip.availableSeats }}</p>
              </div>
              <div class="seat-stepper">
                <button type="button" [disabled]="seatsCount <= 1" (click)="changeSeats(-1)">
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <strong>{{ seatsCount }}</strong>
                <button class="plus" type="button" [disabled]="seatsCount >= trip.availableSeats" (click)="changeSeats(1)">
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
            <div class="seat-card-price">
              <div>
                <p>التكلفة الإجمالية</p>
                <strong>{{ totalPrice }}</strong>
                <span>جم</span>
              </div>
              <div>
                <span class="material-symbols-outlined">payments</span>
                <small>نقدي عند الوصول</small>
              </div>
            </div>
          </section>

          <section class="amenity-row" aria-label="مميزات الرحلة">
            <div>
              <span class="material-symbols-outlined">ac_unit</span>
              تكييف هواء
            </div>
            <div>
              <span class="material-symbols-outlined">wifi</span>
              واي فاي مجاني
            </div>
            <div>
              <span class="material-symbols-outlined">event_seat</span>
              مقاعد مريحة
            </div>
          </section>

          @if (raceMessage) {
            <section class="booking-race-message">
              <strong>المقاعد لم تعد متاحة</strong>
              <p>{{ raceMessage }}</p>
              <button type="button" (click)="searchAgain()">بحث من جديد</button>
            </section>
          }

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }
        </main>

        <footer class="booking-detail-footer">
          <button type="button" [disabled]="isSubmitting || trip.availableSeats < 1" (click)="requestBooking()">
            @if (isSubmitting) {
              <ion-spinner name="crescent" />
            } @else {
              <span>طلب حجز</span>
              <span class="material-symbols-outlined">bolt</span>
            }
          </button>
        </footer>
      }
    </ion-content>
  `
})
export class PassengerTripBookingPage {
  trip: DriverTrip | null = null;
  driver: PublicDriverProfile | null = null;
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  seatsCount = 1;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  raceMessage = '';

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly driversService: DriversService,
    private readonly pilotApi: PilotApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get tripId(): string {
    return this.route.snapshot.paramMap.get('tripId') || '';
  }

  get pickupStopId(): string {
    return this.route.snapshot.queryParamMap.get('pickupStopId') || '';
  }

  get dropoffStopId(): string {
    return this.route.snapshot.queryParamMap.get('dropoffStopId') || '';
  }

  get date(): string {
    return this.route.snapshot.queryParamMap.get('date') || '';
  }

  get carLabel(): string {
    const car = this.trip?.driverCar;
    return car ? `${car.model} - ${car.color} - ${car.plate}` : 'بيانات السيارة ستظهر بعد التحميل';
  }

  get vehicleTitle(): string {
    return this.trip?.driverCar?.model || this.driver?.carModel || 'تويوتا هايس 2023';
  }

  get vehiclePlate(): string {
    return this.trip?.driverCar?.plate || this.driver?.carPlate || 'أ ب ج | ١٢٣٤';
  }

  get driverRating(): string {
    return this.driver?.ratingAverage ? this.driver.ratingAverage.toFixed(1) : '4.9';
  }

  get totalPrice(): string {
    return ((Number(this.trip?.pricePerSeat || 0) || 0) * this.seatsCount).toFixed(2);
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.raceMessage = '';
    try {
      this.trip = await firstValueFrom(this.tripsService.get(this.tripId));
      const [routes, stops, driver] = await Promise.all([
        firstValueFrom(this.pilotApi.listRoutes()),
        firstValueFrom(this.pilotApi.listStops(this.trip.routeId)),
        this.loadDriver(this.trip.driverId)
      ]);
      this.routes = routes;
      this.stops = stops;
      this.driver = driver;
      this.seatsCount = Math.min(this.seatsCount, Math.max(1, this.trip.availableSeats));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الرحلة';
    } finally {
      this.isLoading = false;
    }
  }

  changeSeats(delta: number): void {
    if (!this.trip) return;
    this.seatsCount = Math.min(this.trip.availableSeats, Math.max(1, this.seatsCount + delta));
  }

  async requestBooking(): Promise<void> {
    if (!this.trip) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.raceMessage = '';
    try {
      const booking = await firstValueFrom(
        this.bookingsService.create({
          tripId: this.trip.id,
          pickupStopId: this.pickupStopId,
          dropoffStopId: this.dropoffStopId,
          seatsCount: this.seatsCount
        })
      );
      void this.router.navigateByUrl(`/passenger/bookings/${booking.id}/status`);
    } catch (error) {
      if (this.isSeatRaceError(error)) {
        this.raceMessage = 'حاول راكب آخر حجز آخر المقاعد قبل تأكيد طلبك. يمكنك تحديث البحث واختيار رحلة أخرى.';
        await this.load();
      } else {
        this.errorMessage = this.errorText(error, 'تعذر إرسال طلب الحجز');
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  searchAgain(): void {
    void this.router.navigate(['/passenger/trips/results'], {
      queryParams: {
        pickupStopId: this.pickupStopId,
        dropoffStopId: this.dropoffStopId,
        date: this.date
      }
    });
  }

  goBack(): void {
    this.searchAgain();
  }

  routeName(routeId: string): string {
    return this.routes.find((route) => route.id === routeId)?.name || 'مسار دمياط';
  }

  stopName(stopId: string): string {
    return this.stops.find((stop) => stop.id === stopId)?.name || 'محطة';
  }

  private async loadDriver(driverId: string): Promise<PublicDriverProfile | null> {
    try {
      return await firstValueFrom(this.driversService.getPublicProfile(driverId));
    } catch {
      return null;
    }
  }

  private isSeatRaceError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    const message = this.errorText(error, '');
    return error.status === 400 && /seat|available|مقاعد|المقاعد/i.test(message);
  }

  private errorText(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      return Array.isArray(message) ? message.join('، ') : message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }
}
