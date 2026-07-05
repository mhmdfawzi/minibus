import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { PublicDriverProfile, DriversService } from './api/drivers.service';
import { RatingView, RatingsService } from './api/ratings.service';
import { StarRatingComponent } from './shared/star-rating.component';

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [IonContent, IonSpinner, StarRatingComponent],
  template: `
    <ion-content class="stitch-auth-page driver-profile-stitch" fullscreen>
      <header class="driver-profile-topbar">
        <button type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <h1>ملف السائق</h1>
        <span></span>
      </header>

      @if (isLoading) {
        <main class="passenger-loading"><ion-spinner name="crescent" /></main>
      } @else if (driver) {
        <main class="driver-profile-canvas">
          <section class="driver-profile-hero">
            <div class="driver-profile-avatar">
              <span class="material-symbols-outlined">person</span>
              <i class="material-symbols-outlined">verified</i>
            </div>
            <h2>{{ driver.fullName || 'سائق معتمد' }}</h2>
            <p>{{ driver.carModel }} - {{ driver.carColor }}</p>
            <div class="driver-profile-rating">
              <app-star-rating [value]="roundedAverage" [readonly]="true" />
              <strong>{{ averageLabel }}</strong>
              <small>({{ driver.ratingCount }} تقييم)</small>
            </div>
          </section>

          <section class="driver-profile-grid">
            <article>
              <span class="material-symbols-outlined">directions_car</span>
              <small>السيارة</small>
              <strong>{{ driver.carModel }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">palette</span>
              <small>اللون</small>
              <strong>{{ driver.carColor }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">pin</span>
              <small>اللوحة</small>
              <strong>{{ driver.carPlate }}</strong>
            </article>
            <article>
              <span class="material-symbols-outlined">workspace_premium</span>
              <small>الحالة</small>
              <strong>معتمد</strong>
            </article>
          </section>

          <section class="driver-review-list">
            <h3>آراء الركاب</h3>
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
                <span class="material-symbols-outlined">star</span>
                <p>لا توجد تقييمات بعد.</p>
              </div>
            }
          </section>
        </main>
      }

      @if (errorMessage) {
        <p class="stitch-error">{{ errorMessage }}</p>
      }
    </ion-content>
  `
})
export class DriverProfilePage {
  driver: PublicDriverProfile | null = null;
  ratings: RatingView[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly driversService: DriversService,
    private readonly ratingsService: RatingsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  get driverId(): string {
    return this.route.snapshot.paramMap.get('driverId') || '';
  }

  get roundedAverage(): number {
    return Math.round(this.driver?.ratingAverage || 0);
  }

  get averageLabel(): string {
    return this.driver?.ratingAverage ? this.driver.ratingAverage.toFixed(1) : 'جديد';
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [driver, ratings] = await Promise.all([
        firstValueFrom(this.driversService.getPublicProfile(this.driverId)),
        firstValueFrom(this.ratingsService.listDriverRatings(this.driverId))
      ]);
      this.driver = driver;
      this.ratings = ratings;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل ملف السائق';
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    window.history.back();
  }

  dateOnly(value: string): string {
    return value.slice(0, 10);
  }
}
