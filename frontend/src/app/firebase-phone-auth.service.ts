import { Injectable } from '@angular/core';
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
    this.verifier = new RecaptchaVerifier(this.auth, recaptchaContainerId, {
      size: 'normal'
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

  private ensureFirebaseConfig(): void {
    const { apiKey, authDomain, projectId, appId } = environment.firebase;
    if (!apiKey || !authDomain || !projectId || !appId) {
      throw new Error('Firebase client config is missing');
    }
  }
}
