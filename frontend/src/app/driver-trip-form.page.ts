import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteStop, RouteSummary } from './pilot-api.service';

@Component({
  selector: 'app-driver-trip-form',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page trip-create-stitch" fullscreen>
      <header class="trip-form-topbar">
        <div class="trip-form-title-cluster">
          <button class="stitch-icon-button" type="button" aria-label="رجوع" (click)="goBack()">
            <span class="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1>{{ isEditMode ? 'تعديل رحلة' : 'إنشاء رحلة' }}</h1>
        </div>
        <span class="material-symbols-outlined trip-form-sail">sailing</span>
      </header>

      <main class="trip-form-layout">
        <form id="tripForm" class="trip-create-form" (ngSubmit)="submit()">
          <section class="trip-create-hero" aria-label="تفاصيل الرحلة">
            <div class="trip-create-hero-image"></div>
            <div class="trip-create-hero-overlay">
              <p>رحلتك جاهزة في خطوات بسيطة</p>
            </div>
          </section>

          <section class="trip-form-card">
            <label for="routeId">اختار الخط</label>
            <div class="trip-route-stack">
              <div class="trip-input-shell">
                <span class="material-symbols-outlined route-origin-icon">location_on</span>
                <select
                  id="routeId"
                  name="routeId"
                  [ngModel]="form.routeId"
                  (ngModelChange)="selectRoute($event)"
                  required
                  [disabled]="isEditMode"
                >
                  <option value="">اختار خط الرحلة</option>
                  @for (route of routes; track route.id) {
                    <option [value]="route.id">{{ route.name }}</option>
                  }
                </select>
              </div>
              <small>{{ selectedRouteLabel }}</small>
            </div>
          </section>

          @if (routeStops.length) {
            <section class="trip-form-card trip-stops-card">
              <label>المحطات في الطريق</label>
              <div class="trip-stops-list">
                @for (stop of routeStops; track stop.id; let first = $first; let last = $last) {
                  <div class="trip-stop-row" [class.is-edge]="first || last">
                    <span class="trip-stop-dot"></span>
                    <div>
                      <strong>{{ stop.name }}</strong>
                      @if (!first && !last) {
                        <small>محطة في النص</small>
                      } @else if (first) {
                        <small>بداية الخط</small>
                      } @else {
                        <small>آخر الخط</small>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <section class="trip-form-card">
            <label>يوم الرحلة</label>
            <div class="trip-choice-grid trip-date-choice-grid" role="group" aria-label="اختيار يوم الرحلة">
              @for (dateOption of dateOptions; track dateOption.value) {
                <button
                  type="button"
                  [class.is-active]="form.tripDate === dateOption.value"
                  (click)="form.tripDate = dateOption.value"
                >
                  <strong>{{ dateOption.label }}</strong>
                  <small>{{ dateOption.dateLabel }}</small>
                </button>
              }
            </div>
          </section>

          <section class="trip-form-card">
            <label>هتتحرك الساعة</label>
            <div class="trip-choice-grid trip-time-choice-grid" role="group" aria-label="اختيار وقت التحرك">
              @for (timeOption of timeOptions; track timeOption.value) {
                <button
                  type="button"
                  [class.is-active]="form.startTime === timeOption.value"
                  (click)="form.startTime = timeOption.value"
                >
                  {{ timeOption.label }}
                </button>
              }
            </div>
          </section>

          <section class="trip-form-card trip-counter-card">
            <label>عدد الركاب اللي تقدر تاخدهم</label>
            <div class="trip-stepper">
              <button type="button" (click)="changeSeats(-1)">
                <span class="material-symbols-outlined">remove</span>
              </button>
              <strong>{{ form.totalSeats }}</strong>
              <button type="button" (click)="changeSeats(1)">
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
          </section>

          <section class="trip-form-card">
            <label for="pricePerSeat">الأجرة للفرد</label>
            <div class="trip-price-shell">
              <input
                id="pricePerSeat"
                name="pricePerSeat"
                type="number"
                min="1"
                inputmode="decimal"
                placeholder="00.0"
                [(ngModel)]="form.pricePerSeat"
                required
              />
              <span>جنيه</span>
            </div>
          </section>

          <section class="trip-form-card">
            <label for="driverNotes">ملاحظة للركاب (اختياري)</label>
            <textarea
              id="driverNotes"
              name="driverNotes"
              rows="2"
              placeholder="مثال: هقف عند البوابة الرئيسية"
              [(ngModel)]="driverNotes"
            ></textarea>
          </section>

          @if (editBlockedMessage) {
            <section class="trip-edit-blocked">
              <strong>لا يمكن تعديل الرحلة</strong>
              <p>{{ editBlockedMessage }}</p>
            </section>
          }

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }

          <footer class="trip-form-footer">
            <button class="stitch-primary-action trip-publish-action" type="submit" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                <span class="material-symbols-outlined">rocket_launch</span>
                <span>{{ isEditMode ? 'حفظ التعديلات' : 'نشر الرحلة' }}</span>
              }
            </button>
          </footer>
        </form>
      </main>
    </ion-content>
  `
})
export class DriverTripFormPage {
  routes: RouteSummary[] = [];
  routeStops: RouteStop[] = [];
  tripId = '';
  isLoading = false;
  errorMessage = '';
  editBlockedMessage = '';
  form = {
    routeId: '',
    tripDate: this.today(),
    startTime: '08:00',
    totalSeats: 14,
    pricePerSeat: 30
  };
  driverNotes = '';
  readonly dateOptions = this.buildDateOptions();
  readonly timeOptions = this.buildTimeOptions();

  constructor(
    private readonly pilotApi: PilotApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get isEditMode(): boolean {
    return Boolean(this.tripId);
  }

  get selectedRouteLabel(): string {
    const route = this.routes.find((item) => item.id === this.form.routeId);
    if (!route) return 'اختار الخط الذي ستتحرك عليه.';
    return route.direction === 'return' ? 'اتجاه العودة' : 'اتجاه الذهاب';
  }

  ionViewWillEnter(): void {
    this.tripId = this.route.snapshot.paramMap.get('id') ?? '';
    void this.load();
  }

  async load(): Promise<void> {
    this.errorMessage = '';
    this.routes = await firstValueFrom(this.pilotApi.listRoutes());
    if (!this.tripId) {
      this.form.routeId ||= this.routes[0]?.id ?? '';
      await this.loadStops(this.form.routeId);
      return;
    }

    const trip = await firstValueFrom(this.tripsService.get(this.tripId));
    this.patchForm(trip);
    await this.loadStops(this.form.routeId);
  }

  selectRoute(routeId: string): void {
    this.form.routeId = routeId;
    void this.loadStops(routeId);
  }

  changeSeats(delta: number): void {
    this.form.totalSeats = Math.max(1, Number(this.form.totalSeats) + delta);
  }

  async submit(): Promise<void> {
    this.errorMessage = this.validate();
    this.editBlockedMessage = '';
    if (this.errorMessage) return;

    this.isLoading = true;
    try {
      const payload = {
        routeId: this.form.routeId,
        tripDate: this.form.tripDate,
        startTime: this.form.startTime,
        totalSeats: Number(this.form.totalSeats),
        pricePerSeat: Number(this.form.pricePerSeat)
      };
      if (this.isEditMode) {
        const trip = await firstValueFrom(this.tripsService.update(this.tripId, payload));
        await this.router.navigateByUrl(`/driver/trips/${trip.id}`, { replaceUrl: true });
        return;
      }

      await firstValueFrom(this.tripsService.create(payload));
      await this.router.navigateByUrl('/driver/trips', { replaceUrl: true });
    } catch (error) {
      const message = this.errorText(error);
      if (message.includes('active bookings') || message.includes('cannot be edited')) {
        this.editBlockedMessage = 'هذه الرحلة لديها حجوزات نشطة، لذلك لا يمكن تغيير الوقت أو السعر أو المقاعد.';
      } else {
        this.errorMessage = message;
      }
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    void this.router.navigateByUrl(this.tripId ? `/driver/trips/${this.tripId}` : '/driver/trips');
  }

  private patchForm(trip: DriverTrip): void {
    this.form = {
      routeId: trip.routeId,
      tripDate: trip.tripDate,
      startTime: trip.startTime,
      totalSeats: trip.totalSeats,
      pricePerSeat: Number(trip.pricePerSeat)
    };
  }

  private async loadStops(routeId: string): Promise<void> {
    if (!routeId) {
      this.routeStops = [];
      return;
    }

    try {
      const stops = await firstValueFrom(this.pilotApi.listStops(routeId));
      this.routeStops = stops.sort((first, second) => first.orderIndex - second.orderIndex);
    } catch {
      this.routeStops = [];
    }
  }

  private validate(): string {
    if (!this.form.routeId) return 'اختر مسار الرحلة';
    if (!this.form.tripDate || !this.form.startTime) return 'اختر التاريخ ووقت التحرك';
    if (Number(this.form.totalSeats) <= 0) return 'عدد المقاعد يجب أن يكون أكبر من صفر';
    if (Number(this.form.pricePerSeat) <= 0) return 'سعر المقعد يجب أن يكون أكبر من صفر';
    return '';
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private buildDateOptions(): { value: string; label: string; dateLabel: string }[] {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);

      return {
        value: this.isoDate(date),
        label: this.relativeDateLabel(index, date),
        dateLabel: new Intl.DateTimeFormat('ar-EG', {
          day: 'numeric',
          month: 'short'
        }).format(date)
      };
    });
  }

  private relativeDateLabel(index: number, date: Date): string {
    if (index === 0) return 'النهارده';
    if (index === 1) return 'بكرة';
    if (index === 2) return 'بعد بكرة';
    return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
  }

  private isoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildTimeOptions(): { value: string; label: string }[] {
    return Array.from({ length: 18 }, (_, index) => {
      const hour = index + 5;
      return {
        value: `${hour}`.padStart(2, '0') + ':00',
        label: this.hourLabel(hour)
      };
    });
  }

  private hourLabel(hour: number): string {
    if (hour < 12) return `${this.toArabicDigits(hour)} ص`;
    if (hour === 12) return '١٢ ظ';
    return `${this.toArabicDigits(hour - 12)} م`;
  }

  private toArabicDigits(value: number): string {
    return new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(value);
  }

  private errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'تعذر حفظ الرحلة';
  }
}
