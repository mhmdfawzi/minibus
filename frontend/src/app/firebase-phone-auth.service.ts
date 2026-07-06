import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Auth,
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber
} from 'firebase/auth';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebasePhoneAuthService {
  private readonly app: FirebaseApp;
  private readonly auth: Auth;
  private verifier: RecaptchaVerifier | null = null;
  private confirmation: ConfirmationResult | null = null;

  constructor() {
    this.ensureFirebaseConfig();
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.auth.languageCode = 'ar';
  }

  async sendOtp(phoneNumber: string, recaptchaContainerId: string): Promise<void> {
    this.verifier?.clear();
    const verifierSize = Capacitor.isNativePlatform() ? 'invisible' : 'normal';
    this.verifier = new RecaptchaVerifier(this.auth, recaptchaContainerId, {
      size: verifierSize
    });
    this.confirmation = await signInWithPhoneNumber(this.auth, phoneNumber, this.verifier);
  }

  async confirmOtp(code: string): Promise<string> {
    if (!this.confirmation) {
      throw new Error('OTP confirmation has not been started');
    }

    const credential = await this.confirmation.confirm(code);
    return credential.user.getIdToken();
  }

  errorText(error: unknown, fallback: string): string {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

    switch (code) {
      case 'auth/invalid-verification-code':
        return 'رمز التحقق غير صحيح';
      case 'auth/code-expired':
      case 'auth/session-expired':
        return 'انتهت صلاحية الرمز، اضغط إعادة إرسال الكود';
      case 'auth/missing-verification-code':
        return 'اكتب رمز التحقق';
      case 'auth/too-many-requests':
        return 'محاولات كثيرة، انتظر قليلاً ثم حاول مرة أخرى';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بالإنترنت';
      case 'auth/captcha-check-failed':
      case 'auth/missing-app-credential':
        return 'تعذر التحقق من الأمان، حاول إرسال الكود مرة أخرى';
      case 'auth/invalid-phone-number':
        return 'رقم الهاتف غير صحيح';
      case 'auth/quota-exceeded':
        return 'تم تجاوز حد الرسائل مؤقتاً، حاول لاحقاً';
      default:
        if (status === 0) {
          return 'تعذر الوصول للخادم، تأكد أن backend يعمل على جهازك';
        }

        return this.extractApiErrorMessage(error) ?? (error instanceof Error && error.message ? error.message : fallback);
    }
  }

  private extractApiErrorMessage(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('error' in error)) {
      return null;
    }

    const responseError = (error as { error?: unknown }).error;
    if (typeof responseError === 'object' && responseError !== null && 'message' in responseError) {
      const message = (responseError as { message?: unknown }).message;
      if (Array.isArray(message)) return message.join('، ');
      if (typeof message === 'string' && message.trim()) return message;
    }

    return null;
  }

  private ensureFirebaseConfig(): void {
    const { apiKey, authDomain, projectId, appId } = environment.firebase;
    if (!apiKey || !authDomain || !projectId || !appId) {
      throw new Error('Firebase client config is missing');
    }
  }
}
