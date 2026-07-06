import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthFlowService } from './auth-flow.service';
import { FirebasePhoneAuthService } from './firebase-phone-auth.service';
import { PushNotificationsService } from './push-notifications.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [FormsModule, IonContent, IonSpinner],
  template: `
    <ion-content class="stitch-auth-page" fullscreen>
      <header class="stitch-topbar">
        <button class="stitch-icon-button" type="button" (click)="goBack()" aria-label="رجوع">
          <span class="material-symbols-outlined rtl-back-icon">arrow_back</span>
        </button>
        <h1 class="stitch-brand-title">مسار دمياط</h1>
        <div class="stitch-top-spacer compact"></div>
      </header>

      <main class="otp-layout">
        <div class="otp-illustration" aria-hidden="true">
          <div class="boat-pattern">
            <span class="material-symbols-outlined">directions_boat</span>
            <span class="material-symbols-outlined">directions_boat</span>
            <span class="material-symbols-outlined">directions_boat</span>
            <span class="material-symbols-outlined">directions_boat</span>
          </div>
          <span class="material-symbols-outlined otp-main-icon">vibration</span>
        </div>

        <section class="otp-copy">
          <h2>تحقق من رقمك</h2>
          <p>
            لقد أرسلنا رمز التحقق المكون من 6 أرقام إلى الرقم
            <span dir="ltr">{{ phoneNumber || '+20 101 234 5678' }}</span>
          </p>
        </section>

        <form class="otp-form" (ngSubmit)="verifyCode()">
          <div class="otp-boxes" dir="ltr">
            @for (digit of otpDigits; track $index) {
              <input
                class="otp-input"
                [name]="'otp-' + $index"
                type="text"
                inputmode="numeric"
                maxlength="1"
                [value]="digit"
                (input)="onOtpInput($event, $index)"
                (keydown)="onOtpKeydown($event, $index)"
              />
            }
          </div>
          <button class="otp-resend" type="button" [disabled]="isLoading" (click)="resendCode()">
            إعادة إرسال الكود
          </button>

          <div id="otp-recaptcha-container" class="recaptcha-container otp-recaptcha"></div>

          <div class="otp-spacer"></div>

          <button class="stitch-primary-action otp-action" type="submit" [disabled]="isLoading">
            @if (isLoading) {
              <ion-spinner name="crescent" />
            } @else {
              <span>تأكيد الرمز</span>
              <span class="material-symbols-outlined">check_circle</span>
            }
          </button>

          @if (errorMessage) {
            <p class="stitch-error">{{ errorMessage }}</p>
          }
        </form>

        <div class="otp-watermark" aria-hidden="true">
          <span class="material-symbols-outlined">sailing</span>
        </div>
      </main>
    </ion-content>
  `
})
export class OtpVerificationPage {
  phoneNumber = sessionStorage.getItem('transport_pending_phone') || '';
  otpDigits = ['', '', '', '', '', ''];
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly authFlow: AuthFlowService,
    private readonly firebasePhoneAuth: FirebasePhoneAuthService,
    private readonly pushNotifications: PushNotificationsService,
    private readonly router: Router
  ) {}

  get otpCode(): string {
    return this.otpDigits.join('');
  }

  goBack(): void {
    void this.router.navigateByUrl('/auth/phone');
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '').slice(-1);
    this.otpDigits[index] = value;
    input.value = value;

    if (value && index < this.otpDigits.length - 1) {
      const next = input.parentElement?.children.item(index + 1) as HTMLInputElement | null;
      next?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const previous = input.parentElement?.children.item(index - 1) as HTMLInputElement | null;
      previous?.focus();
    }
  }

  async verifyCode(): Promise<void> {
    this.errorMessage = '';
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'اكتب رمز التحقق المكون من 6 أرقام';
      return;
    }

    this.isLoading = true;
    try {
      const firebaseIdToken = await this.firebasePhoneAuth.confirmOtp(this.otpCode);
      const response = await firstValueFrom(this.authApi.firebaseLogin(firebaseIdToken));
      sessionStorage.removeItem('transport_pending_phone');
      void this.pushNotifications.syncTokenAfterAuth();
      await this.authFlow.goAfterAuth(response.user);
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isLoading = false;
    }
  }

  async resendCode(): Promise<void> {
    this.errorMessage = '';
    if (!this.phoneNumber) {
      this.errorMessage = 'ارجع وأدخل رقم الهاتف مرة أخرى';
      return;
    }

    this.isLoading = true;
    try {
      await this.firebasePhoneAuth.sendOtp(this.phoneNumber, 'otp-recaptcha-container');
    } catch (error) {
      this.errorMessage = this.errorText(error);
    } finally {
      this.isLoading = false;
    }
  }

  private errorText(error: unknown): string {
    return this.firebasePhoneAuth.errorText(error, 'تعذر تأكيد رمز التحقق');
  }
}
