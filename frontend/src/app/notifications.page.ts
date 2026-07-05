import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthApiService, UserRole } from './auth-api.service';
import { NotificationView, NotificationsService } from './api/notifications.service';
import { NotificationNavigationService } from './notification-navigation.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page notifications-stitch" fullscreen>
      <header class="notifications-topbar">
        <button type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1>التنبيهات</h1>
        <button type="button" aria-label="تحديث" (click)="load()">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </header>

      <main class="notifications-canvas">
        <section class="notifications-summary">
          <div>
            <p>آخر التحديثات</p>
            <h2>{{ unreadCount }} تنبيهات غير مقروءة</h2>
          </div>
          <span class="material-symbols-outlined">notifications_active</span>
        </section>

        @if (isLoading) {
          <section class="passenger-loading"><ion-spinner name="crescent" /></section>
        } @else if (notifications.length) {
          <section class="notification-feed">
            @for (notification of notifications; track notification.id) {
              <button
                class="notification-item"
                type="button"
                [class.is-unread]="!notification.isRead"
                (click)="openNotification(notification)"
              >
                <span class="notification-icon" [attr.data-type]="notification.type">
                  <span class="material-symbols-outlined">{{ iconFor(notification.type) }}</span>
                </span>
                <div>
                  <div class="notification-title-row">
                    <h2>{{ notification.title }}</h2>
                    @if (!notification.isRead) {
                      <i></i>
                    }
                  </div>
                  <p>{{ notification.body }}</p>
                  <small>{{ displayDate(notification.createdAt) }}</small>
                </div>
              </button>
            }
          </section>
        } @else {
          <section class="notifications-empty">
            <div>
              <span class="material-symbols-outlined">notifications_off</span>
            </div>
            <h2>لا توجد تنبيهات</h2>
            <p>ستظهر هنا طلبات الحجز وتحديثات الرحلات عند وصولها.</p>
          </section>
        }

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </main>

      <nav class="passenger-bottom-nav" aria-label="تنقل التطبيق">
        @if (role !== 'driver') {
          <button type="button" (click)="goHome()">
            <span class="material-symbols-outlined">home</span>
            <small>الرئيسية</small>
          </button>
        }
        <button type="button" (click)="goBookings()">
          <span class="material-symbols-outlined">directions_bus</span>
          <small>رحلاتي</small>
        </button>
        <button class="is-active notification-nav-button" type="button">
          <span class="material-symbols-outlined">notifications</span>
          <small>التنبيهات</small>
        </button>
        <button type="button" (click)="goProfile()">
          <span class="material-symbols-outlined">person</span>
          <small>الملف الشخصي</small>
        </button>
      </nav>
    </ion-content>
  `
})
export class NotificationsPage implements OnDestroy {
  notifications: NotificationView[] = [];
  isLoading = true;
  errorMessage = '';
  role: UserRole | null = null;
  private refreshHandle: number | null = null;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly notificationNavigation: NotificationNavigationService,
    private readonly notificationsService: NotificationsService,
    private readonly router: Router
  ) {}

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.isRead).length;
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
      const [notifications, user] = await Promise.all([
        firstValueFrom(this.notificationsService.list()),
        firstValueFrom(this.authApi.me()).catch(() => null)
      ]);
      this.notifications = notifications;
      this.role = user?.role ?? this.role;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل التنبيهات';
    } finally {
      this.isLoading = false;
    }
  }

  async openNotification(notification: NotificationView): Promise<void> {
    try {
      if (!notification.isRead) {
        await firstValueFrom(this.notificationsService.markRead(notification.id));
      }
    } catch {
      // Navigation is still useful even if the read-state update fails.
    }
    this.notificationNavigation.open(notification);
  }

  iconFor(type: NotificationView['type']): string {
    const icons: Record<NotificationView['type'], string> = {
      booking_created: 'confirmation_number',
      booking_accepted: 'check_circle',
      booking_rejected: 'cancel',
      booking_cancelled: 'event_busy',
      trip_cancelled: 'directions_bus_filled',
      trip_started: 'play_circle'
    };
    return icons[type];
  }

  displayDate(value: string): string {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    void this.router.navigateByUrl(this.role === 'driver' ? '/driver/trips' : '/passenger/home');
  }

  goBookings(): void {
    void this.router.navigateByUrl(this.role === 'driver' ? '/driver/trips' : '/passenger/bookings');
  }

  goProfile(): void {
    void this.router.navigateByUrl(this.role === 'driver' ? '/driver/profile' : '/passenger/profile');
  }

  private clearRefresh(): void {
    if (this.refreshHandle !== null) {
      window.clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }
}
