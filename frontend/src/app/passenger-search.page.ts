import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';
import { NotificationBadgeComponent } from './shared/notification-badge.component';

@Component({
  selector: 'app-passenger-search',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner, NotificationBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page passenger-home-stitch mobility-home" fullscreen>
      <section class="mobility-hero">
        <header class="mobility-topbar">
          <div class="mobility-brand" aria-label="مسار دمياط">
            <span class="material-symbols-outlined">directions_bus</span>
            <strong>مسار</strong>
          </div>
          <button class="mobility-alert-button notification-nav-button" type="button" aria-label="التنبيهات" (click)="openNotifications()">
            <span class="material-symbols-outlined">notifications</span>
            <app-notification-badge />
          </button>
        </header>

        <div class="mobility-welcome">
          <span class="mobility-eyebrow">رحلات يومية داخل دمياط</span>
          <h1>رايح فين؟</h1>
          <p>احجز مقعدك في أقرب رحلة خلال دقائق.</p>
        </div>

        <div class="mobility-road" aria-hidden="true">
          <span></span><i></i><span></span><i></i><span></span>
          <b class="material-symbols-outlined">airport_shuttle</b>
        </div>
      </section>

      <main class="mobility-canvas">
        <form class="mobility-search-sheet" (ngSubmit)="searchTrips()">
          <div class="mobility-sheet-heading">
            <div>
              <span>خطط لرحلتك</span>
              <h2>اختار نقطة الركوب والوصول</h2>
            </div>
            <span class="material-symbols-outlined">route</span>
          </div>

          <div class="mobility-route-picker">
            <div class="mobility-route-rail" aria-hidden="true">
              <span></span><i></i><span></span>
            </div>

            <label class="mobility-place-field">
              <small>الركوب من</small>
              <select
                name="pickupStopId"
                [ngModel]="pickupStopId"
                (ngModelChange)="selectPickupStop($event)"
                [disabled]="stops.length < 2"
                required
              >
                <option disabled value="">اختار نقطة الركوب</option>
                @for (stop of pickupStops; track stop.id) {
                  <option [value]="stop.id">{{ stop.name }}</option>
                }
              </select>
              <span class="mobility-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
            </label>

            <label class="mobility-place-field">
              <small>الوصول إلى</small>
              <select
                name="dropoffStopId"
                [(ngModel)]="dropoffStopId"
                [disabled]="dropoffStops.length === 0"
                required
              >
                <option disabled value="">اختار وجهتك</option>
                @for (stop of dropoffStops; track stop.id) {
                  <option [value]="stop.id">{{ stop.name }}</option>
                }
              </select>
              <span class="mobility-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
            </label>
          </div>

          <label class="mobility-line-field">
            <span class="material-symbols-outlined">alt_route</span>
            <span>
              <small>الخط</small>
              <select name="routeId" [ngModel]="routeId" (ngModelChange)="selectRoute($event)" required>
                <option disabled value="">اختار الخط المناسب</option>
                @for (route of routes; track route.id) {
                  <option [value]="route.id">{{ route.name }}</option>
                }
              </select>
            </span>
            <span class="material-symbols-outlined">expand_more</span>
          </label>

          <div class="mobility-date-row" role="group" aria-label="اختيار يوم الرحلة">
            @for (dateOption of dateOptions; track dateOption.value) {
              <button
                type="button"
                [class.is-active]="date === dateOption.value"
                (click)="date = dateOption.value"
              >
                <strong>{{ dateOption.label }}</strong>
                <small>{{ dateOption.dateLabel }}</small>
              </button>
            }
          </div>

          @if (errorMessage) {
            <p class="mobility-error" role="alert">{{ errorMessage }}</p>
          }

          <button class="mobility-search-button" type="submit" [disabled]="isLoading || !canSearch">
            @if (isLoading) {
              <ion-spinner name="crescent" />
            } @else {
              <span>اعرض الرحلات</span>
              <span class="material-symbols-outlined">arrow_back</span>
            }
          </button>
        </form>

        <section class="mobility-section">
          <div class="mobility-section-title">
            <h2>رحلتك الأخيرة</h2>
            <span>احجزها مرة ثانية</span>
          </div>
          <button class="mobility-recent-card" type="button" [disabled]="!canSearch" (click)="searchTrips()">
            <span class="mobility-recent-icon material-symbols-outlined">history</span>
            <span class="mobility-recent-copy">
              <strong>{{ recentSearchLabel }}</strong>
              <small>نفس الخط والمحطات المختارة</small>
            </span>
            <span class="material-symbols-outlined mobility-recent-arrow">arrow_back</span>
          </button>
        </section>

        <section class="mobility-promise" aria-label="مزايا الخدمة">
          <div><span class="material-symbols-outlined">verified_user</span><strong>رحلات موثوقة</strong></div>
          <div><span class="material-symbols-outlined">event_seat</span><strong>مقعد مضمون</strong></div>
          <div><span class="material-symbols-outlined">payments</span><strong>سعر واضح</strong></div>
        </section>
      </main>

      <nav class="passenger-bottom-nav" aria-label="تنقل الراكب">
        <button class="is-active" type="button">
          <span class="material-symbols-outlined">home</span>
          <small>الرئيسية</small>
          <i></i>
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
export class PassengerSearchPage {
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  routeId = '';
  pickupStopId = '';
  dropoffStopId = '';
  date = new Date().toISOString().slice(0, 10);
  isLoading = true;
  errorMessage = '';
  readonly dateOptions = this.buildDateOptions();

  constructor(
    private readonly pilotApi: PilotApiService,
    private readonly router: Router
  ) {}

  get pickupStops(): RouteStop[] {
    return this.stops.slice(0, -1);
  }

  get dropoffStops(): RouteStop[] {
    const pickup = this.stops.find((stop) => stop.id === this.pickupStopId);
    return pickup ? this.stops.filter((stop) => stop.orderIndex > pickup.orderIndex) : this.stops.slice(1);
  }

  get canSearch(): boolean {
    return Boolean(
      this.routeId &&
        this.pickupStopId &&
        this.dropoffStopId &&
        this.date &&
        this.pickupStopId !== this.dropoffStopId
    );
  }

  get recentSearchLabel(): string {
    const route = this.routes.find((item) => item.id === this.routeId)?.name;
    const stops = `${this.stopName(this.pickupStopId) || 'نقطة الصعود'} ← ${this.stopName(this.dropoffStopId) || 'الوجهة'}`;
    return route ? `${route}: ${stops}` : stops;
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.routes = await firstValueFrom(this.pilotApi.listRoutes());
      this.routeId = this.routeId || this.routes[0]?.id || '';
      if (this.routeId) {
        await this.loadStopsForRoute(this.routeId);
      }
    } catch (error) {
      this.errorMessage = this.errorText(error, 'تعذر تحميل المسارات');
    } finally {
      this.isLoading = false;
    }
  }

  async loadStopsForRoute(routeId: string): Promise<void> {
    if (!routeId) return;
    this.stops = (await firstValueFrom(this.pilotApi.listStops(routeId))).sort(
      (first, second) => first.orderIndex - second.orderIndex
    );
    this.pickupStopId = this.stops[0]?.id || '';
    this.dropoffStopId = this.defaultDropoffStopId();
  }

  selectRoute(routeId: string): void {
    this.routeId = routeId;
    this.stops = [];
    this.pickupStopId = '';
    this.dropoffStopId = '';
    this.errorMessage = '';
    void this.loadStopsForRoute(routeId);
  }

  selectPickupStop(stopId: string): void {
    this.pickupStopId = stopId;
    const validDropoffs = this.dropoffStops;
    if (!validDropoffs.some((stop) => stop.id === this.dropoffStopId)) {
      this.dropoffStopId = this.defaultDropoffStopId();
    }
  }

  private defaultDropoffStopId(): string {
    return this.dropoffStops.at(-1)?.id || '';
  }

  searchTrips(): void {
    if (!this.canSearch) {
      this.errorMessage = 'اختر الخط، ثم نقطة صعود ونقطة وصول بعدها على نفس الخط.';
      return;
    }

    void this.router.navigate(['/passenger/trips/results'], {
      queryParams: {
        pickupStopId: this.pickupStopId,
        dropoffStopId: this.dropoffStopId,
        date: this.date
      }
    });
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
    return this.stops.find((stop) => stop.id === stopId)?.name || '';
  }

  private buildDateOptions(): { value: string; label: string; dateLabel: string }[] {
    return Array.from({ length: 6 }, (_, index) => {
      const optionDate = new Date();
      optionDate.setDate(optionDate.getDate() + index);

      return {
        value: this.isoDate(optionDate),
        label: this.relativeDateLabel(index, optionDate),
        dateLabel: new Intl.DateTimeFormat('ar-EG', {
          day: 'numeric',
          month: 'short'
        }).format(optionDate)
      };
    });
  }

  private relativeDateLabel(index: number, optionDate: Date): string {
    if (index === 0) return 'النهارده';
    if (index === 1) return 'بكرة';
    if (index === 2) return 'بعد بكرة';
    return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(optionDate);
  }

  private isoDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
