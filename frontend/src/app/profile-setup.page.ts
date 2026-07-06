import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthFlowService } from './auth-flow.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="stitch-topbar sticky">
        <div class="stitch-brand-title">مسار دمياط</div>
        <button class="stitch-icon-button" type="button" (click)="goBack()" aria-label="رجوع">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
      </header>

      <form class="profile-layout" (ngSubmit)="completeProfile()">
        <section class="profile-heading">
          <h1>إعداد الملف الشخصي</h1>
          <p>أخبرنا بالمزيد عنك لبدء رحلتك في دمياط</p>
        </section>

        <section class="profile-field">
          <label for="full-name">الاسم بالكامل</label>
          <input id="full-name" name="fullName" placeholder="أدخل اسمك الثلاثي" [(ngModel)]="fullName" required />
        </section>

        <section class="profile-role-section">
          <h2>أنا أريد أن أكون...</h2>
          <div class="profile-role-grid" role="radiogroup" aria-label="نوع الحساب">
            <button
              type="button"
              class="profile-role-card"
              [class.is-selected]="role === 'passenger'"
              [attr.aria-checked]="role === 'passenger'"
              role="radio"
              (click)="role = 'passenger'"
            >
              <span class="role-icon secondary material-symbols-outlined">person</span>
              <strong>راكب</strong>
              <small>أبحث عن وسيلة مواصلات</small>
            </button>
            <button
              type="button"
              class="profile-role-card"
              [class.is-selected]="role === 'driver'"
              [attr.aria-checked]="role === 'driver'"
              role="radio"
              (click)="role = 'driver'"
            >
              <span class="role-icon primary material-symbols-outlined">directions_bus</span>
              <strong>سائق</strong>
              <small>أمتلك وسيلة مواصلات</small>
            </button>
          </div>
        </section>

        <section class="profile-visual">
          <div class="profile-visual-image"></div>
          <div class="profile-visual-shade">
            <p>انضم إلى مجتمع التنقل الأكثر موثوقية في دمياط</p>
          </div>
        </section>

        <footer class="profile-footer">
          <button
            class="stitch-primary-action profile-action"
            type="submit"
            [disabled]="isLoading"
          >
            @if (isLoading) {
              <ion-spinner name="crescent" />
            } @else {
              <span>استمرار</span>
              <span class="material-symbols-outlined">chevron_left</span>
            }
          </button>
        </footer>

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </form>
    </ion-content>
  `
})
export class ProfileSetupPage {
  fullName = '';
  role: 'passenger' | 'driver' = 'passenger';
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly authFlow: AuthFlowService,
    private readonly router: Router
  ) {}

  goBack(): void {
    void this.router.navigateByUrl('/auth/otp');
  }

  async completeProfile(): Promise<void> {
    this.errorMessage = '';
    if (!this.fullName.trim()) {
      this.errorMessage = 'اكتب الاسم الكامل';
      return;
    }

    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.authApi.completeProfile({
          fullName: this.fullName.trim(),
          role: this.role,
          preferredLocale: 'ar'
        })
      );
      await this.authFlow.goAfterAuth(response.user);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'تعذر حفظ الملف';
    } finally {
      this.isLoading = false;
    }
  }
}
