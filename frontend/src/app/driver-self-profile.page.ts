import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { DriverOnboardingProfile, DriversService, DriverReviewStatus } from './api/drivers.service';
import { RatingView, RatingsService } from './api/ratings.service';
import { AuthApiService } from './auth-api.service';
import { NotificationBadgeComponent } from './shared/notification-badge.component';
import { StarRatingComponent } from './shared/star-rating.component';

@Component({
  selector: 'app-driver-self-profile',
  standalone: true,
  imports: [IonContent, IonSpinner, NotificationBadgeComponent, StarRatingComponent],
  template: `
    <ion-content class="stitch-auth-page driver-profile-stitch" fullscreen>
      <header class="driver-profile-topbar">
        <button type="button" aria-label="رجوع" (click)="goTrips()">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
        <h1>ملفي كسائق</h1>
        <button type="button" aria-label="تسجيل الخروج" (click)="logout()">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </header>

      @if (isLoading) {
        <main class="driver-profile-canvas">
          <section class="passenger-loading"><ion-spinner name="crescent" /></section>
        </main>
      } @else if (profile) {
        <main class="driver-profile-canvas">
          <section class="driver-profile-hero">
            <div class="driver-profile-avatar">
              <span class="material-symbols-outlined">directions_car</span>
              <i></i>
            </div>
            <h2>{{ profile.carModel }}</h2>
            <p>{{ profile.carColor }} - {{ profile.carPlate }}</p>
            <div class="driver-profile-rating">
              <app-star-rating [value]="roundedAverage" [readonly]="true" />
              <strong>{{ averageLabel }}</strong>
              <small>({{ ratings.length }} تقييم)</small>
            </div>
          </section>

          <section class="driver-profile-grid">
            <article>
              <span class="material-symbols-outlined">verified</span>
              <small>حالة الحساب</small>
              <strong>{{ statusLabel(profile.status) }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">badge</span>
              <small>رقم الرخصة</small>
              <strong>{{ profile.licenseNumber }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">directions_car</span>
              <small>السيارة</small>
              <strong>{{ profile.carModel }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">pin</span>
              <small>لوحة السيارة</small>
              <strong>{{ profile.carPlate }}</strong>
            </article>
          </section>

          <section class="driver-review-list">
            <h3>تقييماتي</h3>
            @for (rating of ratings; track rating.id) {
              <article>
                <div>
                  <strong>{{ rating.passenger?.fullName || 'راكب' }}</strong>
                  <app-star-rating [value]="rating.rate" [readonly]="true" />
                </div>
                @if (rating.comment) {
                  <p>{{ rating.comment }}</p>
                }
                <small>{{ dateOnly(rating.createdAt) }}</small>
              </article>
            } @empty {
              <div class="driver-review-empty">
                <p>لم تحصل على تقييمات بعد. ستظهر هنا بعد أن يقيّم الركاب رحلاتهم المكتملة.</p>
              </div>
            }
          </section>
        </main>
      } @else {
        <main class="driver-profile-canvas">
          <section class="driver-review-empty">
            <p>تعذر تحميل ملف السائق.</p>
          </section>
        </main>
      }

      <nav class="passenger-bottom-nav" aria-label="تنقل السائق">
        <button type="button" (click)="goTrips()">
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
export class DriverSelfProfilePage {
  profile: DriverOnboardingProfile | null = null;
  ratings: RatingView[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly authApi: AuthApiService,
    private readonly driversService: DriversService,
    private readonly ratingsService: RatingsService,
    private readonly router: Router
  ) {}

  get average(): number {
    if (!this.ratings.length) return 0;
    const total = this.ratings.reduce((sum, rating) => sum + rating.rate, 0);
    return total / this.ratings.length;
  }

  get roundedAverage(): number {
    return Math.round(this.average);
  }

  get averageLabel(): string {
    return this.ratings.length ? this.average.toFixed(1) : 'جديد';
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.profile = await firstValueFrom(this.driversService.getMine());
      this.ratings = await firstValueFrom(this.ratingsService.listDriverRatings(this.profile.id));
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل ملف السائق';
    } finally {
      this.isLoading = false;
    }
  }

  statusLabel(status: DriverReviewStatus): string {
    const labels: Record<DriverReviewStatus, string> = {
      pending: 'قيد المراجعة',
      approved: 'معتمد',
      rejected: 'مرفوض',
      suspended: 'موقوف'
    };
    return labels[status];
  }

  dateOnly(value: string): string {
    return value.slice(0, 10);
  }

  goTrips(): void {
    void this.router.navigateByUrl('/driver/trips');
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  logout(): void {
    this.authApi.clearSession();
    void this.router.navigateByUrl('/welcome', { replaceUrl: true });
  }
}
