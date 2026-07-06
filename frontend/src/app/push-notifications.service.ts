import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ToastController } from '@ionic/angular';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';
import { AuthApiService, DevicePlatform } from './auth-api.service';
import { NotificationsService } from './api/notifications.service';
import { environment } from '../environments/environment';
import { NotificationNavigationService } from './notification-navigation.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private currentToken: string | null = null;
  private hasInitialized = false;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly notificationNavigation: NotificationNavigationService,
    private readonly notificationsService: NotificationsService,
    private readonly toastController: ToastController
  ) {
    this.authApi.sessionStored$.subscribe(() => this.registerCurrentDevice());
  }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.hasInitialized || !environment.nativePushEnabled) {
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
        this.notificationsService.incrementUnreadCount();
        void this.showForegroundToast(notification);
      }
    );
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.notificationNavigation.openFromPush(action.notification.data);
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

  private async showForegroundToast(notification: PushNotificationSchema): Promise<void> {
    const toast = await this.toastController.create({
      header: notification.title || 'تنبيه جديد',
      message: notification.body || '',
      duration: 6000,
      position: 'top',
      cssClass: 'notification-toast',
      buttons: [
        {
          text: 'فتح',
          handler: () => this.notificationNavigation.openFromPush(notification.data)
        },
        {
          text: 'إغلاق',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
