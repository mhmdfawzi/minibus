import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';
import { AuthApiService, DevicePlatform } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private currentToken: string | null = null;
  private hasInitialized = false;

  constructor(private readonly authApi: AuthApiService) {
    this.authApi.sessionStored$.subscribe(() => this.registerCurrentDevice());
  }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.hasInitialized) {
      return;
    }

    this.hasInitialized = true;

    await PushNotifications.removeAllListeners();
    await PushNotifications.addListener('registration', (token: Token) => {
      this.currentToken = token.value;
      this.registerCurrentDevice();
    });
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration failed', error);
    });
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.info('Push notification received', notification);
      }
    );
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.info('Push notification opened', action.notification);
      }
    );

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }
  }

  async syncTokenAfterAuth(): Promise<void> {
    await this.initialize();
    this.registerCurrentDevice();
  }

  async unregisterCurrentDevice(): Promise<void> {
    if (!this.currentToken) {
      return;
    }

    this.authApi.deleteDevice(this.currentToken).subscribe({
      next: () => {
        this.currentToken = null;
      },
      error: () => {
        this.currentToken = null;
      }
    });
  }

  private registerCurrentDevice(): void {
    if (!this.currentToken || !this.authApi.getAccessToken()) {
      return;
    }

    this.authApi
      .registerDevice({
        token: this.currentToken,
        platform: this.platform()
      })
      .subscribe({ error: () => undefined });
  }

  private platform(): DevicePlatform {
    return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  }
}
