import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { FirebasePhoneAuthService } from './firebase-phone-auth.service';

@Component({
  selector: 'app-phone-entry',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="stitch-topbar">
        <button class="stitch-icon-button" type="button" (click)="goBack()" aria-label="رجوع">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
        <div class="stitch-brand-title">مسار دمياط</div>
        <div class="stitch-top-spacer"></div>
      </header>

      <form class="phone-layout" (ngSubmit)="sendCode()">
        <section class="phone-intro">
          <h1>أدخل رقم هاتفك</h1>
          <p>سنقوم بإرسال رمز تأكيد لضمان أمان حسابك.</p>
        </section>

        <section class="phone-field-group">
          <label>رقم الجوال</label>
          <div class="stitch-phone-row">
            <label class="country-pill">
              <input name="countryCode" dir="ltr" inputmode="tel" [(ngModel)]="countryCode" required />
              <span class="material-symbols-outlined">expand_more</span>
            </label>
            <label class="phone-pill">
              <input
                name="phoneNumber"
                dir="ltr"
                inputmode="tel"
                placeholder="01X XXXX XXXX"
                [(ngModel)]="phoneNumber"
                (input)="normalizePhoneDigits()"
                required
              />
            </label>
          </div>
        </section>

        <p class="terms-copy">
          بالنقر على "إرسال الكود"، فإنك توافق على <a href="#">شروط الخدمة</a> و
          <a href="#">سياسة الخصوصية</a>. قد يتم تطبيق رسوم الرسائل النصية والبيانات.
        </p>

        <div id="phone-recaptcha-container" class="recaptcha-container phone-recaptcha"></div>

        <div class="phone-spacer"></div>

        <button class="stitch-primary-action phone-action" type="submit" [disabled]="isLoading">
          @if (isLoading) {
            <ion-spinner name="crescent" />
          } @else {
            <span>إرسال الكود</span>
            <span class="material-symbols-outlined">chevron_left</span>
          }
        </button>

        @if (errorMessage) {
          <p class="stitch-error">{{ errorMessage }}</p>
        }
      </form>

      <div class="felucca-watermark" aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <path d="M50 10C50 10 20 40 20 70C20 85 50 90 50 90C50 90 80 85 80 70C80 40 50 10 50 10Z" />
        </svg>
      </div>
    </ion-content>
  `
})
export class PhoneEntryPage {
  countryCode = '+20';
  phoneNumber = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly firebasePhoneAuth: FirebasePhoneAuthService,
    private readonly router: Router
  ) {}

  goBack(): void {
    void this.router.navigateByUrl('/welcome');
  }

  normalizePhoneDigits(): void {
    this.phoneNumber = this.phoneNumber.replace(/[^0-9]/g, '');
  }

  async sendCode(): Promise<void> {
    this.errorMessage = '';
    const formattedPhone = this.formatPhoneNumber();
    if (!formattedPhone) {
      this.errorMessage = 'اكتب رقم هاتف صحيح';
      return;
    }

    this.isLoading = true;
    try {
      await this.firebasePhoneAuth.sendOtp(formattedPhone, 'phone-recaptcha-container');
      sessionStorage.setItem('transport_pending_phone', formattedPhone);
      await this.router.navigateByUrl('/auth/otp');
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isLoading = false;
    }
  }

  private formatPhoneNumber(): string {
    const rawPhone = this.phoneNumber.trim().replace(/\s+/g, '');
    if (rawPhone.startsWith('+')) return rawPhone;

    const country = this.countryCode.trim().replace(/\s+/g, '');
    const national = rawPhone.startsWith('0') ? rawPhone.slice(1) : rawPhone;
    return country && national ? `${country}${national}` : '';
  }

  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : 'تعذر إرسال رمز التحقق';
  }
}
