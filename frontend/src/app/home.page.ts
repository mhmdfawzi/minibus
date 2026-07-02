import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { AuthApiService, AuthUser } from './auth-api.service';
import { FirebasePhoneAuthService } from './firebase-phone-auth.service';
import { PushNotificationsService } from './push-notifications.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>نظام النقل</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (!user) {
        @if (step === 'phone') {
          <form class="auth-form" (ngSubmit)="sendOtp()">
            <ion-item>
              <ion-label position="stacked">رقم الهاتف</ion-label>
              <ion-input
                name="phoneNumber"
                type="tel"
                inputmode="tel"
                dir="ltr"
                placeholder="+201001234567"
                [(ngModel)]="phoneNumber"
                required
              />
            </ion-item>
            <div id="recaptcha-container" class="recaptcha-container"></div>
            <ion-button type="submit" expand="block" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                إرسال الرمز
              }
            </ion-button>
          </form>
        } @else {
          <form class="auth-form" (ngSubmit)="verifyOtp()">
            <ion-item>
              <ion-label position="stacked">رمز التحقق</ion-label>
              <ion-input
                name="otpCode"
                type="text"
                inputmode="numeric"
                dir="ltr"
                [(ngModel)]="otpCode"
                required
              />
            </ion-item>
            <ion-button type="submit" expand="block" [disabled]="isLoading">
              @if (isLoading) {
                <ion-spinner name="crescent" />
              } @else {
                تسجيل الدخول
              }
            </ion-button>
            <ion-button fill="clear" expand="block" type="button" (click)="step = 'phone'">
              تغيير رقم الهاتف
            </ion-button>
          </form>
        }
      } @else if (!user.isActive) {
        <form class="auth-form" (ngSubmit)="completeProfile()">
          <ion-item>
            <ion-label position="stacked">الاسم الكامل</ion-label>
            <ion-input name="fullName" [(ngModel)]="fullName" required />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">نوع الحساب</ion-label>
            <ion-select name="role" interface="popover" [(ngModel)]="role">
              <ion-select-option value="passenger">راكب</ion-select-option>
              <ion-select-option value="driver">سائق</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-button type="submit" expand="block" [disabled]="isLoading">
            حفظ الملف
          </ion-button>
        </form>
      } @else {
        <section class="profile-summary">
          <h1>أهلاً {{ user.fullName }}</h1>
          <p>{{ roleLabel(user.role) }}</p>
          <ion-button fill="outline" expand="block" (click)="logout()">تسجيل الخروج</ion-button>
        </section>
      }

      @if (errorMessage) {
        <ion-note color="danger">{{ errorMessage }}</ion-note>
      }
    </ion-content>
  `
})
export class HomePage {
  step: 'phone' | 'otp' = 'phone';
  phoneNumber = '';
  otpCode = '';
  fullName = '';
  role: 'passenger' | 'driver' = 'passenger';
  user: AuthUser | null = null;
  errorMessage = '';
  isLoading = false;

  constructor(
    private readonly firebasePhoneAuth: FirebasePhoneAuthService,
    private readonly authApi: AuthApiService,
    private readonly pushNotifications: PushNotificationsService
  ) {}

  ionViewWillEnter(): void {
    if (!this.authApi.getAccessToken()) {
      return;
    }

    this.authApi.me().subscribe({
      next: (user) => {
        this.user = user;
        void this.pushNotifications.syncTokenAfterAuth();
      },
      error: () => this.authApi.clearSession()
    });
  }

  async sendOtp(): Promise<void> {
    await this.runWithLoading(async () => {
      await this.firebasePhoneAuth.sendOtp(this.phoneNumber, 'recaptcha-container');
      this.step = 'otp';
      this.isLoading = false;
    });
  }

  async verifyOtp(): Promise<void> {
    await this.runWithLoading(async () => {
      const firebaseIdToken = await this.firebasePhoneAuth.confirmOtp(this.otpCode);
      this.authApi.firebaseLogin(firebaseIdToken).subscribe({
        next: (response) => {
          this.user = response.user;
          void this.pushNotifications.syncTokenAfterAuth();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'تعذر تسجيل الدخول';
          this.isLoading = false;
        }
      });
    });
  }

  completeProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.authApi
      .completeProfile({
        fullName: this.fullName,
        role: this.role,
        preferredLocale: 'ar'
      })
      .subscribe({
        next: (response) => {
          this.user = response.user;
          void this.pushNotifications.syncTokenAfterAuth();
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'تعذر حفظ الملف';
          this.isLoading = false;
        }
      });
  }

  logout(): void {
    void this.pushNotifications.unregisterCurrentDevice();
    this.authApi.clearSession();
    this.user = null;
    this.step = 'phone';
    this.otpCode = '';
  }

  roleLabel(role: AuthUser['role']): string {
    const labels: Record<AuthUser['role'], string> = {
      passenger: 'راكب',
      driver: 'سائق',
      admin: 'مدير'
    };
    return labels[role];
  }

  private async runWithLoading(action: () => Promise<void>): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await action();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      this.isLoading = false;
    }
  }
}
