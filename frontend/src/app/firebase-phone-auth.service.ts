import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  Auth,
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber
} from 'firebase/auth';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebasePhoneAuthService {
  private readonly isNative = Capacitor.isNativePlatform();
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private verifier: RecaptchaVerifier | null = null;
  private verifierContainerId: string | null = null;
  private confirmation: ConfirmationResult | null = null;
  private isSending = false;

  private nativeVerificationId: string | null = null;
  private nativeListeners: PluginListenerHandle[] = [];

  constructor() {
    if (!this.isNative) {
      this.ensureFirebaseConfig();
      this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
      this.auth = getAuth(this.app);
      this.auth.languageCode = 'ar';
    }
  }

  async sendOtp(phoneNumber: string, recaptchaContainerId: string): Promise<void> {
    if (this.isSending) {
      throw new Error('OTP request is already in progress');
    }

    this.isSending = true;
    try {
      if (this.isNative) {
        await this.sendOtpNative(phoneNumber);
      } else {
        await this.sendOtpWeb(phoneNumber, recaptchaContainerId);
      }
    } finally {
      this.isSending = false;
    }
  }

  async confirmOtp(code: string): Promise<string> {
    if (this.isNative) {
      return this.confirmOtpNative(code);
    }

    if (!this.confirmation) {
      throw new Error('OTP confirmation has not been started');
    }

    const credential = await this.confirmation.confirm(code);
    return credential.user.getIdToken();
  }

  private async sendOtpNative(phoneNumber: string): Promise<void> {
    await this.clearNativeListeners();
    this.nativeVerificationId = null;

    const verificationId = await new Promise<string>((resolve, reject) => {
      void (async () => {
        const sentHandle = await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
          resolve(event.verificationId);
        });
        const failedHandle = await FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
          reject(new Error(event.message));
        });
        this.nativeListeners.push(sentHandle, failedHandle);

        try {
          await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber });
        } catch (error) {
          reject(error);
        }
      })();
    });

    this.nativeVerificationId = verificationId;
    await this.clearNativeListeners();
  }

  private async confirmOtpNative(code: string): Promise<string> {
    if (!this.nativeVerificationId) {
      throw new Error('OTP confirmation has not been started');
    }

    const result = await FirebaseAuthentication.confirmVerificationCode({
      verificationId: this.nativeVerificationId,
      verificationCode: code
    });

    if (!result.user) {
      throw new Error('Sign-in failed');
    }

    const { token } = await FirebaseAuthentication.getIdToken();
    return token;
  }

  private async clearNativeListeners(): Promise<void> {
    await Promise.all(this.nativeListeners.map((handle) => handle.remove()));
    this.nativeListeners = [];
  }

  private async sendOtpWeb(phoneNumber: string, recaptchaContainerId: string): Promise<void> {
    this.clearVerifier();

    const container = document.getElementById(recaptchaContainerId);
    if (!container) {
      throw new Error(`reCAPTCHA container "${recaptchaContainerId}" was not found`);
    }

    container.replaceChildren();
    const verifier = new RecaptchaVerifier(this.auth!, container, { size: 'normal' });

    this.verifier = verifier;
    this.verifierContainerId = recaptchaContainerId;

    try {
      await verifier.render();
      this.confirmation = await signInWithPhoneNumber(this.auth!, phoneNumber, verifier);
    } catch (error) {
      this.clearVerifier();
      throw error;
    }
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
      case 'auth/invalid-app-credential':
      case 'auth/unauthorized-domain':
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

  private clearVerifier(): void {
    try {
      this.verifier?.clear();
    } catch {
      // Firebase may already have disposed the widget after a failed request.
    }

    if (this.verifierContainerId) {
      document.getElementById(this.verifierContainerId)?.replaceChildren();
    }

    this.verifier = null;
    this.verifierContainerId = null;
  }

  private ensureFirebaseConfig(): void {
    const { apiKey, authDomain, projectId, appId } = environment.firebase;
    if (!apiKey || !authDomain || !projectId || !appId) {
      throw new Error('Firebase client config is missing');
    }
  }
}
