import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthApiService, AuthUser } from './auth-api.service';
import { BookingsService } from './api/bookings.service';
import { PublicDriverProfile, DriversService } from './api/drivers.service';
import { RatingsService } from './api/ratings.service';
import { DriverTrip, TripsService } from './api/trips.service';
import { StarRatingComponent } from './shared/star-rating.component';

@Component({
  selector: 'app-rate-driver',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner, StarRatingComponent],
  template: `
    <ion-content class="stitch-auth-page rate-driver-stitch" fullscreen>
      <header class="driver-profile-topbar">
        <button type="button" aria-label="رجوع" (click)="goBack()">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
        <h1>تقييم السائق</h1>
        <span></span>
      </header>

      @if (isLoading) {
        <main class="passenger-loading"><ion-spinner name="crescent" /></main>
      } @else if (alreadyRated) {
        <main class="rate-driver-canvas">
          <section class="rate-state-card">
            <span class="material-symbols-outlined">task_alt</span>
            <h2>تم إرسال تقييمك من قبل</h2>
            <p>شكراً لك. نعرض طلب التقييم مرة واحدة فقط لكل رحلة.</p>
            <button type="button" (click)="goBack()">رجوع</button>
          </section>
        </main>
      } @else if (trip && driver) {
        <main class="rate-driver-canvas">
          <section class="rate-driver-card">
            <div class="rate-avatar">
              <span class="material-symbols-outlined">person</span>
            </div>
            <p>كيف كانت رحلتك مع</p>
            <h2>{{ driver.fullName || 'السائق' }}؟</h2>
            <small>{{ trip.tripDate }} - {{ trip.startTime }}</small>
            <app-star-rating [(value)]="rate" ariaLabel="اختر تقييم السائق" />
          </section>

          <form class="rate-form" (ngSubmit)="submitRating()">
            <label>
              <span>ملاحظات إضافية</span>
              <textarea name="comment" rows="4" [(ngModel)]="comment" placeholder="اكتب تجربتك باختصار"></textarea>
            </label>

            @if (errorMessage) {
              <p class="stitch-error">{{ errorMessage }}</p>
            }

            <button class="home-search-button" type="submit" [disabled]="isSubmitting">
              @if (isSubmitting) {
                <ion-spinner name="crescent" />
              } @else {
                <span class="material-symbols-outlined">star</span>
                إرسال التقييم
              }
            </button>
          </form>
        </main>
      } @else {
        <main class="rate-driver-canvas">
          <section class="rate-state-card">
            <span class="material-symbols-outlined">lock</span>
            <h2>التقييم غير متاح</h2>
            <p>يمكنك تقييم السائق بعد اكتمال رحلة كنت مقبولاً عليها.</p>
            <button type="button" (click)="goBack()">رجوع</button>
          </section>
        </main>
      }
    </ion-content>
  `
})
export class RateDriverPage {
  trip: DriverTrip | null = null;
  driver: PublicDriverProfile | null = null;
  user: AuthUser | null = null;
  rate = 5;
  comment = '';
  alreadyRated = false;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly authApi: AuthApiService,
    private readonly bookingsService: BookingsService,
    private readonly driversService: DriversService,
    private readonly ratingsService: RatingsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tripsService: TripsService
  ) {}

  get tripId(): string {
    return this.route.snapshot.paramMap.get('tripId') || '';
  }

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const [trip, user, bookings] = await Promise.all([
        firstValueFrom(this.tripsService.get(this.tripId)),
        firstValueFrom(this.authApi.me()),
        firstValueFrom(this.bookingsService.listMine())
      ]);
      this.user = user;
      const eligibleBooking = bookings.some((booking) => {
        return (
          booking.tripId === trip.id &&
          booking.passengerId === user.id &&
          (booking.status === 'accepted' || booking.status === 'completed')
        );
      });

      if (trip.status !== 'completed' || !eligibleBooking) {
        this.trip = null;
        return;
      }
      this.trip = trip;
      const [driver, ratings] = await Promise.all([
        firstValueFrom(this.driversService.getPublicProfile(trip.driverId)),
        firstValueFrom(this.ratingsService.listDriverRatings(trip.driverId))
      ]);
      this.driver = driver;
      this.alreadyRated = ratings.some((rating) => rating.tripId === trip.id && rating.passengerId === user.id);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر تحميل التقييم';
    } finally {
      this.isLoading = false;
    }
  }

  async submitRating(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      await firstValueFrom(
        this.ratingsService.create({
          tripId: this.tripId,
          rate: this.rate,
          comment: this.comment.trim() || undefined
        })
      );
      this.alreadyRated = true;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر إرسال التقييم';
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack(): void {
    window.history.back();
  }
}
