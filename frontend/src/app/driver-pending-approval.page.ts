import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { DriversService, DriverOnboardingProfile } from './api/drivers.service';

@Component({
  selector: 'app-driver-pending-approval',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="stitch-topbar">
        <div class="stitch-title-with-back">
          <h1 class="stitch-brand-title">مسار دمياط</h1>
        </div>
        <button class="stitch-icon-button" type="button" (click)="refresh()" aria-label="تحديث">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </header>

      <main class="driver-status-layout">
        @if (isLoading) {
          <div class="driver-status-loading">
            <ion-spinner name="crescent" />
          </div>
        } @else {
          <section class="driver-status-illustration" [class.is-blocked]="isBlockedState">
            <div class="status-dot-pattern" aria-hidden="true"></div>
            <span class="material-symbols-outlined status-main-icon">{{ mainIcon }}</span>
            <span class="material-symbols-outlined status-sailing-icon">sailing</span>
          </section>

          <section class="driver-status-copy">
            <h1>{{ title }}</h1>
            <p>{{ description }}</p>
          </section>

          <section class="driver-status-card">
            <div class="status-info-icon">
              <span class="material-symbols-outlined">info</span>
            </div>
            <div>
              <p>الحالة الحالية</p>
              <strong>{{ statusLabel }}</strong>
            </div>
            <span class="status-pill">{{ pillLabel }}</span>
          </section>

          @if (driver?.rejectionReason && isBlockedState) {
            <section class="driver-rejection-box">
              <strong>سبب القرار</strong>
              <p>{{ driver?.rejectionReason }}</p>
            </section>
          }

          <section class="driver-tips-grid">
            <article>
              <span class="material-symbols-outlined">support_agent</span>
              <p>دعم متوفر 24/7</p>
            </article>
            <article>
              <span class="material-symbols-outlined">speed</span>
              <p>مراجعة سريعة</p>
            </article>
          </section>

          @if (isBlockedState || !driver) {
            <button class="stitch-primary-action driver-resubmit-action" type="button" (click)="resubmit()">
              <span>{{ driver ? 'تعديل وإعادة الإرسال' : 'إكمال تسجيل السائق' }}</span>
              <span class="material-symbols-outlined">edit</span>
            </button>
          } @else {
            <button class="driver-support-action" type="button">
              <span class="material-symbols-outlined">chat</span>
              <span>تحدث مع الدعم الفني</span>
            </button>
          }
        }

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </main>

      <div class="driver-status-watermark" aria-hidden="true">
        <span class="material-symbols-outlined">sailing</span>
      </div>
    </ion-content>
  `
})
export class DriverPendingApprovalPage {
  driver: DriverOnboardingProfile | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly driversService: DriversService,
    private readonly router: Router
  ) {}

  ionViewWillEnter(): void {
    this.refresh();
  }

  refresh(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.driversService.getMine().subscribe({
      next: (driver) => {
        this.driver = driver;
        this.isLoading = false;
        if (driver.status === 'approved') {
          void this.router.navigateByUrl('/driver/trips', { replaceUrl: true });
        }
      },
      error: () => {
        this.driver = null;
        this.isLoading = false;
      }
    });
  }

  resubmit(): void {
    void this.router.navigateByUrl('/driver/register');
  }

  get isBlockedState(): boolean {
    return this.driver?.status === 'rejected' || this.driver?.status === 'suspended';
  }

  get mainIcon(): string {
    return this.isBlockedState ? 'report' : 'hourglass_empty';
  }

  get title(): string {
    if (this.driver?.status === 'rejected') return 'تعذر اعتماد طلبك';
    if (this.driver?.status === 'suspended') return 'تم إيقاف حساب السائق';
    if (!this.driver) return 'أكمل تسجيل السائق';
    return 'طلبك قيد المراجعة';
  }

  get description(): string {
    if (this.isBlockedState) return 'يمكنك تعديل البيانات والمستندات ثم إعادة إرسال الطلب للمراجعة.';
    if (!this.driver) return 'أكمل بيانات السائق وارفع المستندات المطلوبة للانضمام إلى فريق مسار.';
    return 'سنقوم بإعلامك فور الموافقة على انضمامك لفريق مسار.';
  }

  get statusLabel(): string {
    if (this.driver?.status === 'rejected') return 'مرفوض';
    if (this.driver?.status === 'suspended') return 'موقوف';
    if (this.driver?.status === 'approved') return 'معتمد';
    if (!this.driver) return 'لم يكتمل التسجيل';
    return 'تدقيق المستندات';
  }

  get pillLabel(): string {
    if (this.driver?.status === 'rejected') return 'مرفوض';
    if (this.driver?.status === 'suspended') return 'موقوف';
    if (!this.driver) return 'مطلوب';
    return 'جاري...';
  }
}
