import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthApiService, AuthUser } from './auth-api.service';
import {
  AdminBooking,
  AdminDriver,
  AdminTrip,
  PilotApiService,
  RouteDirection,
  RouteStop,
  RouteSummary
} from './pilot-api.service';

type AdminTab = 'routes' | 'drivers' | 'trips' | 'bookings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="admin-web-page" fullscreen>
      <main class="admin-web-shell">
        <header class="admin-web-header">
          <div>
            <p>لوحة الإدارة</p>
            <h1>إدارة مسار دمياط</h1>
          </div>
          <div class="admin-web-actions">
            @if (!user) {
              <button type="button" class="admin-secondary-button" (click)="devLogin()">
                <span class="material-symbols-outlined">admin_panel_settings</span>
                دخول مدير تجريبي
              </button>
            } @else {
              <button type="button" class="admin-secondary-button" (click)="logout()">
                <span class="material-symbols-outlined">logout</span>
                خروج
              </button>
            }
            <button type="button" class="admin-icon-button" (click)="loadAll()" aria-label="تحديث">
              <span class="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        @if (errorMessage) {
          <p class="admin-alert">{{ errorMessage }}</p>
        }

        <nav class="admin-tabs" aria-label="أقسام الإدارة">
          <button type="button" [class.is-active]="activeTab === 'routes'" (click)="activeTab = 'routes'">
            <span class="material-symbols-outlined">route</span>
            الخطوط والمحطات
          </button>
          <button type="button" [class.is-active]="activeTab === 'drivers'" (click)="activeTab = 'drivers'">
            <span class="material-symbols-outlined">badge</span>
            السائقون
          </button>
          <button type="button" [class.is-active]="activeTab === 'trips'" (click)="activeTab = 'trips'">
            <span class="material-symbols-outlined">directions_bus</span>
            الرحلات
          </button>
          <button type="button" [class.is-active]="activeTab === 'bookings'" (click)="activeTab = 'bookings'">
            <span class="material-symbols-outlined">confirmation_number</span>
            الحجوزات
          </button>
        </nav>

        @if (isLoading) {
          <section class="admin-loading">
            <ion-spinner name="crescent" />
          </section>
        } @else {
          @if (activeTab === 'routes') {
            <section class="admin-grid two-columns">
              <form class="admin-panel" (ngSubmit)="createRoute()">
                <div class="admin-panel-heading">
                  <h2>إضافة خط</h2>
                  <span class="material-symbols-outlined">add_road</span>
                </div>
                <label>
                  اسم الخط
                  <input name="routeName" [(ngModel)]="routeForm.name" placeholder="الخلفية → دمياط الجديدة" required />
                </label>
                <label>
                  الاتجاه
                  <select name="routeDirection" [(ngModel)]="routeForm.direction">
                    <option value="outbound">ذهاب</option>
                    <option value="return">عودة</option>
                  </select>
                </label>
                <label class="admin-check-row">
                  <input name="routeActive" type="checkbox" [(ngModel)]="routeForm.isActive" />
                  نشط
                </label>
                <button type="submit" class="admin-primary-button">حفظ الخط</button>
              </form>

              <section class="admin-panel">
                <div class="admin-panel-heading">
                  <h2>الخطوط</h2>
                  <span>{{ routes.length }}</span>
                </div>
                <div class="admin-list">
                  @for (route of routes; track route.id) {
                    <article class="admin-list-item" [class.is-muted]="!route.isActive">
                      <div class="admin-inline-form">
                        <input [(ngModel)]="route.name" [name]="'route-name-' + route.id" />
                        <select [(ngModel)]="route.direction" [name]="'route-direction-' + route.id">
                          <option value="outbound">ذهاب</option>
                          <option value="return">عودة</option>
                        </select>
                      </div>
                      <div class="admin-row-actions">
                        <button type="button" class="admin-secondary-button" (click)="selectRoute(route.id)">
                          المحطات
                        </button>
                        <button type="button" class="admin-secondary-button" (click)="toggleRoute(route)">
                          {{ route.isActive ? 'تعطيل' : 'تفعيل' }}
                        </button>
                        <button type="button" class="admin-primary-button compact" (click)="saveRoute(route)">
                          حفظ
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <p class="admin-empty">لا توجد خطوط حتى الآن.</p>
                  }
                </div>
              </section>

              <form class="admin-panel" (ngSubmit)="createStop()">
                <div class="admin-panel-heading">
                  <h2>إضافة محطة</h2>
                  <span class="material-symbols-outlined">add_location_alt</span>
                </div>
                <label>
                  الخط
                  <select name="stopRoute" [(ngModel)]="selectedRouteId" (change)="loadStops()">
                    @for (route of routes; track route.id) {
                      <option [value]="route.id">{{ route.name }}</option>
                    }
                  </select>
                </label>
                <label>
                  اسم المحطة
                  <input name="stopName" [(ngModel)]="stopForm.name" placeholder="موقف السنانية" required />
                </label>
                <div class="admin-form-row">
                  <label>
                    الترتيب
                    <input name="stopOrder" type="number" min="0" [(ngModel)]="stopForm.orderIndex" required />
                  </label>
                  <label>
                    دقائق من البداية
                    <input name="stopOffset" type="number" min="0" [(ngModel)]="stopForm.estimatedOffsetMinutes" required />
                  </label>
                </div>
                <label class="admin-check-row">
                  <input name="stopActive" type="checkbox" [(ngModel)]="stopForm.isActive" />
                  نشطة
                </label>
                <button type="submit" class="admin-primary-button" [disabled]="!selectedRouteId">حفظ المحطة</button>
              </form>

              <section class="admin-panel">
                <div class="admin-panel-heading">
                  <h2>محطات الخط</h2>
                  <span>{{ stops.length }}</span>
                </div>
                <div class="admin-list">
                  @for (stop of stops; track stop.id) {
                    <article class="admin-list-item" [class.is-muted]="!stop.isActive">
                      <div class="admin-inline-form stops">
                        <input [(ngModel)]="stop.name" [name]="'stop-name-' + stop.id" />
                        <input type="number" min="0" [(ngModel)]="stop.orderIndex" [name]="'stop-order-' + stop.id" />
                        <input
                          type="number"
                          min="0"
                          [(ngModel)]="stop.estimatedOffsetMinutes"
                          [name]="'stop-offset-' + stop.id"
                        />
                      </div>
                      <div class="admin-row-actions">
                        <button type="button" class="admin-secondary-button" (click)="toggleStop(stop)">
                          {{ stop.isActive ? 'تعطيل' : 'تفعيل' }}
                        </button>
                        <button type="button" class="admin-primary-button compact" (click)="saveStop(stop)">
                          حفظ
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <p class="admin-empty">اختر خطاً لإدارة محطاته.</p>
                  }
                </div>
              </section>
            </section>
          }

          @if (activeTab === 'drivers') {
            <section class="admin-grid two-columns">
              <section class="admin-panel">
                <div class="admin-panel-heading">
                  <h2>السائقون قيد المراجعة</h2>
                  <span>{{ pendingDrivers.length }}</span>
                </div>
                <div class="admin-list">
                  @for (driver of pendingDrivers; track driver.id) {
                    <article class="admin-list-item driver-card">
                      <div>
                        <h3>{{ driver.user?.fullName || 'سائق بدون اسم' }}</h3>
                        <p>{{ driver.user?.phone || 'لا يوجد رقم' }} · {{ driver.carModel }} · {{ driver.carPlate }}</p>
                      </div>
                      <div class="admin-row-actions">
                        <button type="button" class="admin-primary-button compact" (click)="approveDriver(driver.id)">
                          موافقة
                        </button>
                        <button type="button" class="admin-secondary-button" (click)="rejectDriver(driver.id)">
                          رفض
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <p class="admin-empty">لا يوجد سائقون في الانتظار.</p>
                  }
                </div>
              </section>

              <section class="admin-panel">
                <div class="admin-panel-heading">
                  <h2>السائقون النشطون</h2>
                  <span>{{ activeDrivers.length }}</span>
                </div>
                <div class="admin-list">
                  @for (driver of activeDrivers; track driver.id) {
                    <article class="admin-list-item driver-card">
                      <div>
                        <h3>{{ driver.user?.fullName || 'سائق بدون اسم' }}</h3>
                        <p>{{ driver.user?.phone || 'لا يوجد رقم' }}</p>
                        <p>{{ driver.carModel }} · {{ driver.carColor }} · {{ driver.carPlate }}</p>
                      </div>
                      <div class="admin-row-actions">
                        <button type="button" class="admin-secondary-button" (click)="suspendDriver(driver.id)">
                          إيقاف
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <p class="admin-empty">لا يوجد سائقون نشطون حالياً.</p>
                  }
                </div>
              </section>
            </section>
          }

          @if (activeTab === 'trips') {
            <section class="admin-panel">
              <div class="admin-panel-heading">
                <h2>الرحلات</h2>
                <span>{{ adminTrips.length }}</span>
              </div>
              <div class="admin-table">
                <div class="admin-table-row heading">
                  <span>الخط</span>
                  <span>السائق</span>
                  <span>التاريخ</span>
                  <span>الحجوزات</span>
                  <span>الحالة</span>
                </div>
                @for (trip of adminTrips; track trip.id) {
                  <div class="admin-table-row">
                    <span>{{ trip.route?.name || routeName(trip.routeId) }}</span>
                    <span>{{ trip.driver?.fullName || trip.driver?.phone || 'سائق' }}</span>
                    <span>{{ trip.tripDate | slice:0:10 }} · {{ trip.startTime | slice:0:5 }}</span>
                    <span>{{ trip.bookingCount }}</span>
                    <span>{{ trip.status }}</span>
                  </div>
                } @empty {
                  <p class="admin-empty">لا توجد رحلات.</p>
                }
              </div>
            </section>
          }

          @if (activeTab === 'bookings') {
            <section class="admin-panel">
              <div class="admin-panel-heading">
                <h2>الحجوزات</h2>
                <span>{{ adminBookings.length }}</span>
              </div>
              <div class="admin-table bookings">
                <div class="admin-table-row heading">
                  <span>الراكب</span>
                  <span>الرحلة</span>
                  <span>المقاعد</span>
                  <span>السعر</span>
                  <span>الحالة</span>
                </div>
                @for (booking of adminBookings; track booking.id) {
                  <div class="admin-table-row">
                    <span>{{ booking.passenger?.fullName || booking.passenger?.phone || 'راكب' }}</span>
                    <span>{{ booking.trip?.routeName || 'رحلة' }}</span>
                    <span>{{ booking.seatsCount }}</span>
                    <span>{{ booking.price }} ج.م</span>
                    <span>{{ booking.status }}</span>
                  </div>
                } @empty {
                  <p class="admin-empty">لا توجد حجوزات.</p>
                }
              </div>
            </section>
          }
        }
      </main>
    </ion-content>
  `,
  styles: [`
    .admin-web-page {
      --background: #f7f5f0;
      --padding-bottom: 32px;
      --padding-end: 24px;
      --padding-start: 24px;
      --padding-top: 24px;
      color: #102f67;
    }

    .admin-web-shell {
      display: grid;
      gap: 18px;
      margin: 0 auto;
      max-width: 1180px;
    }

    .admin-web-header,
    .admin-web-actions,
    .admin-tabs,
    .admin-panel-heading,
    .admin-row-actions,
    .admin-form-row {
      align-items: center;
      display: flex;
      gap: 12px;
    }

    .admin-web-header {
      justify-content: space-between;
    }

    .admin-web-header p,
    .admin-web-header h1,
    .admin-panel h2,
    .admin-list-item h3,
    .admin-list-item p {
      margin: 0;
    }

    .admin-web-header p {
      color: #6d7380;
      font-weight: 700;
    }

    .admin-web-header h1 {
      font-size: 30px;
      line-height: 1.25;
    }

    .admin-tabs {
      background: #fff;
      border: 1px solid #ebe7df;
      border-radius: 8px;
      overflow-x: auto;
      padding: 6px;
    }

    .admin-tabs button,
    .admin-primary-button,
    .admin-secondary-button,
    .admin-icon-button {
      align-items: center;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      font: inherit;
      font-weight: 800;
      gap: 8px;
      justify-content: center;
      min-height: 42px;
      padding: 0 14px;
      white-space: nowrap;
    }

    .admin-tabs button {
      background: transparent;
      color: #5f6673;
    }

    .admin-tabs button.is-active {
      background: #102f67;
      color: #fff;
    }

    .admin-grid {
      display: grid;
      gap: 16px;
    }

    .admin-grid.two-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-panel {
      background: #fff;
      border: 1px solid #ebe7df;
      border-radius: 8px;
      box-shadow: 0 18px 40px rgba(16, 47, 103, 0.08);
      display: grid;
      gap: 14px;
      padding: 18px;
    }

    .admin-panel-heading {
      justify-content: space-between;
    }

    .admin-panel-heading h2 {
      font-size: 18px;
    }

    .admin-panel label {
      color: #4f5663;
      display: grid;
      font-size: 13px;
      font-weight: 800;
      gap: 8px;
    }

    .admin-panel input,
    .admin-panel select {
      background: #f4f1eb;
      border: 1px solid #e5e0d8;
      border-radius: 8px;
      color: #172033;
      font: inherit;
      min-height: 44px;
      padding: 0 12px;
      width: 100%;
    }

    .admin-form-row > label {
      flex: 1;
    }

    .admin-check-row {
      align-items: center;
      display: flex !important;
      grid-template-columns: auto 1fr;
      justify-content: flex-start;
    }

    .admin-check-row input {
      min-height: auto;
      width: 18px;
    }

    .admin-primary-button {
      background: #f9c72f;
      color: #102f67;
    }

    .admin-primary-button.compact {
      min-width: 72px;
    }

    .admin-secondary-button,
    .admin-icon-button {
      background: #eef1f6;
      color: #102f67;
    }

    .admin-icon-button {
      padding: 0;
      width: 44px;
    }

    .admin-list {
      display: grid;
      gap: 10px;
    }

    .admin-list-item {
      border: 1px solid #eee9df;
      border-radius: 8px;
      display: grid;
      gap: 10px;
      padding: 12px;
    }

    .admin-list-item.is-muted {
      opacity: 0.58;
    }

    .admin-inline-form {
      display: grid;
      gap: 8px;
      grid-template-columns: minmax(160px, 1fr) 120px;
    }

    .admin-inline-form.stops {
      grid-template-columns: minmax(160px, 1fr) 92px 120px;
    }

    .admin-row-actions {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .admin-table {
      display: grid;
      gap: 8px;
      overflow-x: auto;
    }

    .admin-table-row {
      align-items: center;
      border-bottom: 1px solid #eee9df;
      display: grid;
      gap: 12px;
      grid-template-columns: 1.2fr 1fr 1fr 88px 100px;
      min-width: 760px;
      padding: 12px 0;
    }

    .admin-table.bookings .admin-table-row {
      grid-template-columns: 1fr 1.2fr 80px 90px 100px;
    }

    .admin-table-row.heading {
      color: #6d7380;
      font-size: 13px;
      font-weight: 800;
    }

    .admin-alert {
      background: #fff2f2;
      border: 1px solid #ffd0d0;
      border-radius: 8px;
      color: #b42318;
      font-weight: 800;
      margin: 0;
      padding: 12px 14px;
    }

    .admin-empty,
    .admin-loading {
      color: #6d7380;
      margin: 0;
      padding: 16px 0;
      text-align: center;
    }

    @media (max-width: 860px) {
      .admin-web-page {
        --padding-end: 14px;
        --padding-start: 14px;
      }

      .admin-web-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .admin-grid.two-columns {
        grid-template-columns: 1fr;
      }

      .admin-inline-form,
      .admin-inline-form.stops {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminPage implements OnInit {
  activeTab: AdminTab = 'routes';
  user: AuthUser | null = null;
  routes: RouteSummary[] = [];
  stops: RouteStop[] = [];
  pendingDrivers: AdminDriver[] = [];
  activeDrivers: AdminDriver[] = [];
  adminTrips: AdminTrip[] = [];
  adminBookings: AdminBooking[] = [];
  selectedRouteId = '';
  isLoading = false;
  errorMessage = '';

  routeForm: { name: string; direction: RouteDirection; isActive: boolean } = {
    name: '',
    direction: 'outbound',
    isActive: true
  };

  stopForm = {
    name: '',
    orderIndex: 0,
    estimatedOffsetMinutes: 0,
    isActive: true
  };

  constructor(
    private readonly authApi: AuthApiService,
    private readonly pilotApi: PilotApiService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  async devLogin(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.authApi.devAdminLogin());
      this.user = response.user;
      await this.loadAll();
    } catch (error) {
      this.errorMessage = this.errorText(error, 'تعذر تسجيل دخول المدير التجريبي');
    } finally {
      this.isLoading = false;
    }
  }

  logout(): void {
    this.authApi.clearSession();
    this.user = null;
    void this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }

  async loadAll(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;
    try {
      this.user = await firstValueFrom(this.authApi.me());
      const [routes, pendingDrivers, activeDrivers, trips, bookings] = await Promise.all([
        firstValueFrom(this.pilotApi.listAdminRoutes()),
        firstValueFrom(this.pilotApi.listPendingDrivers()),
        firstValueFrom(this.pilotApi.listActiveDrivers()),
        firstValueFrom(this.pilotApi.listAdminTrips()),
        firstValueFrom(this.pilotApi.listAdminBookings())
      ]);

      this.routes = routes;
      this.pendingDrivers = pendingDrivers;
      this.activeDrivers = activeDrivers;
      this.adminTrips = trips.data;
      this.adminBookings = bookings.data;
      this.selectedRouteId ||= routes[0]?.id ?? '';
      await this.loadStops();
    } catch (error) {
      this.errorMessage = this.errorText(error, 'تعذر تحميل بيانات الإدارة');
    } finally {
      this.isLoading = false;
    }
  }

  async createRoute(): Promise<void> {
    if (!this.routeForm.name.trim()) return;
    await this.mutate(async () => {
      const route = await firstValueFrom(this.pilotApi.createAdminRoute({
        name: this.routeForm.name.trim(),
        direction: this.routeForm.direction,
        isActive: this.routeForm.isActive
      }));
      this.routeForm.name = '';
      this.selectedRouteId = route.id;
      await this.loadAll();
    }, 'تعذر إنشاء الخط');
  }

  async saveRoute(route: RouteSummary): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.updateAdminRoute(route.id, {
        name: route.name.trim(),
        direction: route.direction,
        isActive: route.isActive
      }));
      await this.loadAll();
    }, 'تعذر حفظ الخط');
  }

  async toggleRoute(route: RouteSummary): Promise<void> {
    route.isActive = !route.isActive;
    await this.saveRoute(route);
  }

  async selectRoute(routeId: string): Promise<void> {
    this.selectedRouteId = routeId;
    await this.loadStops();
  }

  async loadStops(): Promise<void> {
    if (!this.selectedRouteId) {
      this.stops = [];
      return;
    }

    this.stops = await firstValueFrom(this.pilotApi.listAdminStops(this.selectedRouteId));
    this.stopForm.orderIndex = this.nextStopOrder();
  }

  async createStop(): Promise<void> {
    if (!this.selectedRouteId || !this.stopForm.name.trim()) return;
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.createAdminStop(this.selectedRouteId, {
        name: this.stopForm.name.trim(),
        orderIndex: Number(this.stopForm.orderIndex),
        estimatedOffsetMinutes: Number(this.stopForm.estimatedOffsetMinutes),
        isActive: this.stopForm.isActive
      }));
      this.stopForm.name = '';
      this.stopForm.orderIndex = this.nextStopOrder() + 1;
      await this.loadStops();
    }, 'تعذر إنشاء المحطة');
  }

  async saveStop(stop: RouteStop): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.updateAdminStop(stop.id, {
        name: stop.name.trim(),
        orderIndex: Number(stop.orderIndex),
        estimatedOffsetMinutes: Number(stop.estimatedOffsetMinutes),
        isActive: stop.isActive
      }));
      await this.loadStops();
    }, 'تعذر حفظ المحطة');
  }

  async toggleStop(stop: RouteStop): Promise<void> {
    stop.isActive = !stop.isActive;
    await this.saveStop(stop);
  }

  async approveDriver(driverId: string): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.approveDriver(driverId));
      await this.loadAll();
    }, 'تعذر الموافقة على السائق');
  }

  async rejectDriver(driverId: string): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.rejectDriver(driverId, 'تم الرفض من لوحة الإدارة'));
      await this.loadAll();
    }, 'تعذر رفض السائق');
  }

  async suspendDriver(driverId: string): Promise<void> {
    await this.mutate(async () => {
      await firstValueFrom(this.pilotApi.suspendDriver(driverId, 'تم الإيقاف من لوحة الإدارة'));
      await this.loadAll();
    }, 'تعذر إيقاف السائق');
  }

  routeName(routeId: string): string {
    return this.routes.find((route) => route.id === routeId)?.name ?? 'خط غير معروف';
  }

  private nextStopOrder(): number {
    return this.stops.reduce((max, stop) => Math.max(max, Number(stop.orderIndex)), -1) + 1;
  }

  private async mutate(action: () => Promise<void>, fallback: string): Promise<void> {
    this.errorMessage = '';
    try {
      await action();
    } catch (error) {
      this.errorMessage = this.errorText(error, fallback);
    }
  }

  private errorText(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: unknown } }).error;
      const message = responseError?.message;
      if (Array.isArray(message)) return message.join('، ');
      if (typeof message === 'string') return message;
    }

    return error instanceof Error && error.message ? error.message : fallback;
  }
}
