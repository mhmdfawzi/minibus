import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingView, BookingsService } from './api/bookings.service';
import { AuthApiService, AuthUser } from './auth-api.service';
import { NotificationBadgeComponent } from './shared/notification-badge.component';

@Component({
  selector: 'app-passenger-profile',
  standalone: true,
  imports: [IonContent, IonSpinner, NotificationBadgeComponent],
  template: `
    <ion-content class="stitch-auth-page driver-profile-stitch" fullscreen>
      <header class="driver-profile-topbar">
        <button type="button" aria-label="رجوع" (click)="goHome()">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
        <h1>الملف الشخصي</h1>
        <button type="button" aria-label="تسجيل الخروج" (click)="logout()">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </header>

      @if (isLoading) {
        <main class="driver-profile-canvas">
          <section class="passenger-loading"><ion-spinner name="crescent" /></section>
        </main>
      } @else if (user) {
        <main class="driver-profile-canvas">
          <section class="driver-profile-hero">
            <div class="driver-profile-avatar">
              <span class="material-symbols-outlined">person</span>
              <i></i>
            </div>
            <h2>{{ user.fullName || 'راكب' }}</h2>
            <p>{{ user.phone || 'رقم الهاتف غير متاح' }}</p>
            <div class="profile-role-pill">راكب</div>
          </section>

          <section class="driver-profile-grid">
            <article>
              <span class="material-symbols-outlined">confirmation_number</span>
              <small>إجمالي الحجوزات</small>
              <strong>{{ bookings.length }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">event_available</span>
              <small>رحلات مكتملة</small>
              <strong>{{ completedBookings }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">pending_actions</span>
              <small>حجوزات نشطة</small>
              <strong>{{ activeBookings }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">language</span>
              <small>اللغة</small>
              <strong>{{ user.preferredLocale === 'ar' ? 'العربية' : user.preferredLocale }}</strong>
            </article>
          </section>
        </main>
      } @else {
        <main class="driver-profile-canvas">
          <section class="driver-review-empty">
            <p>تعذر تحميل الملف الشخصي.</p>
          </section>
        </main>
      }

      <nav class="passenger-bottom-nav" aria-label="تنقل الراكب">
        <button type="button" (click)="goHome()">
          <span class="material-symbols-outlined">home</span>
          <small>الرئيسية</small>
        </button>
        <button type="button" (click)="goBookings()">
          <span class="material-symbols-outlined">directions_bus</span>
          <small>رحلاتي</small>
        </button>
        <button class="notification-nav-button" type="button" (click)="openNotifications()">
          <span class="material-symbols-outlined">notifications</span>
          <app-notification-badge />
          <small>التنبيهات</small>
        </button>
        <button class="is-active" type="button">
          <span class="material-symbols-outlined">person</span>
          <small>الملف الشخصي</small>
          <i></i>
        </button>
      </nav>
    </ion-content>
  `
})
export class PassengerProfilePage {
  user: AuthUser | null = null;
  bookings: BookingView[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly authApi: AuthApiService,
    private readonly bookingsService: BookingsService,
    private readonly router: Router
  ) {}

  get completedBookings(): number {
    return this.bookings.filter((booking) => booking.status === 'completed').length;
  }

  get activeBookings(): number {
    return this.bookings.filter((booking) => booking.status === 'pending' || booking.status === 'accepted').length;
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [user, bookings] = await Promise.all([
        firstValueFrom(this.authApi.me()),
        firstValueFrom(this.bookingsService.listMine()).catch(() => [])
      ]);
      this.user = user;
      this.bookings = bookings;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل الملف الشخصي';
    } finally {
      this.isLoading = false;
    }
  }

  goHome(): void {
    void this.router.navigateByUrl('/passenger/home');
  }

  goBookings(): void {
    void this.router.navigateByUrl('/passenger/bookings');
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  logout(): void {
    this.authApi.clearSession();
    void this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }
}
