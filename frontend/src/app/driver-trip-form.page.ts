import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { DriverTrip, TripsService } from './api/trips.service';
import { PilotApiService, RouteSummary } from './pilot-api.service';

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
          <section class="trip-create-hero" aria-label="تفاصيل الرحلة القادمة">
            <div class="trip-create-hero-image"></div>
            <div class="trip-create-hero-overlay">
              <p>حدد تفاصيل رحلتك القادمة</p>
            </div>
          </section>

          <section class="trip-form-card">
            <label for="routeId">مسار الرحلة</label>
            <div class="trip-route-stack">
              <div class="trip-input-shell">
                <span class="material-symbols-outlined route-origin-icon">location_on</span>
                <select id="routeId" name="routeId" [(ngModel)]="form.routeId" required [disabled]="isEditMode">
                  <option value="">من: نقطة الانطلاق</option>
                  @for (route of routes; track route.id) {
                    <option [value]="route.id">{{ route.name }}</option>
                  }
                </select>
              </div>
              <div class="trip-input-shell trip-destination-row" aria-hidden="true">
                <span class="material-symbols-outlined route-destination-icon">flag</span>
                <input tabindex="-1" readonly [value]="selectedRouteLabel" />
              </div>
            </div>
          </section>

          <section class="trip-form-grid">
            <div class="trip-form-card">
              <label for="tripDate">التاريخ</label>
              <div class="trip-input-shell">
                <span class="material-symbols-outlined">calendar_today</span>
                <input id="tripDate" name="tripDate" type="date" [(ngModel)]="form.tripDate" required />
              </div>
            </div>
            <div class="trip-form-card">
              <label for="startTime">وقت التحرك</label>
              <div class="trip-input-shell">
                <span class="material-symbols-outlined">schedule</span>
                <input id="startTime" name="startTime" type="time" [(ngModel)]="form.startTime" required />
              </div>
            </div>
          </section>

          <section class="trip-form-card trip-counter-card">
            <label>عدد المقاعد المتاحة</label>
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
            <label for="pricePerSeat">سعر المقعد الواحد</label>
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
              <span>ج.م</span>
            </div>
          </section>

          <section class="trip-form-card">
            <label for="driverNotes">ملاحظات إضافية (اختياري)</label>
            <textarea
              id="driverNotes"
              name="driverNotes"
              rows="2"
              placeholder="مثلاً: مكان التجمع، شروط الحقائب..."
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
        </form>
      </main>

      <footer class="trip-form-footer">
        <button class="stitch-primary-action trip-publish-action" form="tripForm" type="submit" [disabled]="isLoading">
          @if (isLoading) {
            <ion-spinner name="crescent" />
          } @else {
            <span class="material-symbols-outlined">rocket_launch</span>
            <span>{{ isEditMode ? 'حفظ التعديلات' : 'نشر الرحلة' }}</span>
          }
        </button>
      </footer>
    </ion-content>
  `
})
export class DriverTripFormPage {
  routes: RouteSummary[] = [];
  tripId = '';
  isLoading = false;
  errorMessage = '';
  editBlockedMessage = '';
  form = {
    routeId: '',
    tripDate: this.today(),
    startTime: '08:00',
    totalSeats: 4,
    pricePerSeat: 30
  };
  driverNotes = '';

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
    if (!route) return 'إلى: وجهة الوصول';
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
      return;
    }

    const trip = await firstValueFrom(this.tripsService.get(this.tripId));
    this.patchForm(trip);
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
      const trip = this.isEditMode
        ? await firstValueFrom(this.tripsService.update(this.tripId, payload))
        : await firstValueFrom(this.tripsService.create(payload));
      await this.router.navigateByUrl(`/driver/trips/${trip.id}`, { replaceUrl: true });
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

  private errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'تعذر حفظ الرحلة';
  }
}
