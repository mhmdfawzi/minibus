import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';

@Component({
  selector: 'app-passenger-search',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page passenger-home-stitch" fullscreen>
      <header class="passenger-home-topbar">
        <div>
          <h1>مسار دمياط</h1>
        </div>
        <button type="button" aria-label="القائمة">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </header>

      <main class="passenger-home-canvas">
        <section class="passenger-home-hero">
          <div></div>
          <p>خطط لرحلتك القادمة في دمياط</p>
        </section>

        <form class="passenger-search-grid" (ngSubmit)="searchTrips()">
          <section class="home-route-card">
            <div class="home-route-inner">
              <label>
                <span>
                  <span class="material-symbols-outlined">location_on</span>
                  من
                </span>
                <div class="home-select-shell">
                  <select name="pickupStopId" [(ngModel)]="pickupStopId" required>
                    <option disabled value="">اختر نقطة الانطلاق</option>
                    @for (stop of pickupStops; track stop.id) {
                      <option [value]="stop.id">{{ stop.name }}</option>
                    }
                  </select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </label>

              <button class="home-swap-button" type="button" aria-label="تبديل المحطات" (click)="swapStops()">
                <span class="material-symbols-outlined">swap_vert</span>
              </button>

              <label>
                <span>
                  <span class="material-symbols-outlined">near_me</span>
                  إلى
                </span>
                <div class="home-select-shell">
                  <select name="dropoffStopId" [(ngModel)]="dropoffStopId" required>
                    <option disabled value="">اختر وجهتك</option>
                    @for (stop of dropoffStops; track stop.id) {
                      <option [value]="stop.id">{{ stop.name }}</option>
                    }
                  </select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </label>
            </div>
          </section>

          <section class="home-date-card">
            <label>
              <span>
                <span class="material-symbols-outlined">calendar_month</span>
                تاريخ الرحلة
              </span>
              <input name="date" type="date" [(ngModel)]="date" required />
            </label>
          </section>

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }

          <button class="home-search-button" type="submit" [disabled]="isLoading || !canSearch">
            @if (isLoading) {
              <ion-spinner name="crescent" />
            } @else {
              <span class="material-symbols-outlined">search</span>
              بحث عن رحلات
            }
          </button>
        </form>

        <section class="home-section">
          <h2>البحث الأخير</h2>
          <button class="home-recent-card" type="button" (click)="searchTrips()">
            <div>
              <span class="material-symbols-outlined">history</span>
            </div>
            <div>
              <p>{{ recentSearchLabel }}</p>
              <small>أمس، الساعة 09:30 ص</small>
            </div>
            <span class="material-symbols-outlined chevron">arrow_back_ios</span>
          </button>
        </section>

        <section class="home-section">
          <h2>اكتشف وجهاتنا</h2>
          <div class="home-destination-grid">
            <article class="wide">
              <div class="ras-elbar"></div>
              <span>رأس البر</span>
            </article>
            <article>
              <div class="damietta-square"></div>
              <span>ميدان دمياط</span>
            </article>
            <article>
              <div class="new-damietta"></div>
              <span>دمياط الجديدة</span>
            </article>
          </div>
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
        <button type="button">
          <span class="material-symbols-outlined">notifications</span>
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
export class PassengerSearchPage {
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  routeId = '';
  pickupStopId = '';
  dropoffStopId = '';
  date = new Date().toISOString().slice(0, 10);
  isLoading = true;
  errorMessage = '';

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
    return Boolean(this.pickupStopId && this.dropoffStopId && this.date && this.pickupStopId !== this.dropoffStopId);
  }

  get recentSearchLabel(): string {
    return `${this.stopName(this.pickupStopId) || 'دمياط الجديدة'} ← ${this.stopName(this.dropoffStopId) || 'رأس البر'}`;
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
    this.dropoffStopId = this.stops[1]?.id || '';
  }

  searchTrips(): void {
    if (!this.canSearch) {
      this.errorMessage = 'اختر نقطة صعود ونقطة وصول بعدها على نفس المسار.';
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

  swapStops(): void {
    const pickup = this.pickupStopId;
    this.pickupStopId = this.dropoffStopId;
    this.dropoffStopId = pickup;
  }

  stopName(stopId: string): string {
    return this.stops.find((stop) => stop.id === stopId)?.name || '';
  }

  private errorText(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
