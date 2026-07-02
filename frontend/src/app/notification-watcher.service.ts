import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { NotificationView, NotificationsService } from './api/notifications.service';
import { AuthApiService } from './auth-api.service';
import { NotificationNavigationService } from './notification-navigation.service';

@Injectable({ providedIn: 'root' })
export class NotificationWatcherService {
  private knownUnreadIds = new Set<string>();
  private timer: number | null = null;
  private isPolling = false;
  private isPrimed = false;

  constructor(
    private readonly authApi: AuthApiService,
    private readonly notificationNavigation: NotificationNavigationService,
    private readonly notificationsService: NotificationsService,
    private readonly toastController: ToastController
  ) {
    this.authApi.sessionStored$.subscribe(() => this.start());
  }

  start(): void {
    if (!this.authApi.getAccessToken() || this.timer !== null) {
      return;
    }

    void this.poll();
    this.timer = window.setInterval(() => void this.poll(), 8000);
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.knownUnreadIds.clear();
    this.isPrimed = false;
  }

  private async poll(): Promise<void> {
    if (this.isPolling || !this.authApi.getAccessToken()) {
      return;
    }

    this.isPolling = true;
    try {
      const notifications = await firstValueFrom(this.notificationsService.list());
      const unread = notifications.filter((notification) => !notification.isRead);
      const incoming = unread.filter((notification) => !this.knownUnreadIds.has(notification.id));

      this.knownUnreadIds = new Set(unread.map((notification) => notification.id));

      if (!this.isPrimed) {
        this.isPrimed = true;
        return;
      }

      for (const notification of incoming.reverse()) {
        await this.showToast(notification);
      }
    } catch {
      // Keep polling; auth refresh or network recovery may make the next tick succeed.
    } finally {
      this.isPolling = false;
    }
  }

  private async showToast(notification: NotificationView): Promise<void> {
    const toast = await this.toastController.create({
      header: notification.title,
      message: notification.body,
      duration: 7000,
      position: 'top',
      cssClass: 'notification-toast',
      buttons: [
        {
          text: 'فتح',
          handler: () => this.openNotification(notification)
        },
        {
          text: 'إغلاق',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  private openNotification(notification: NotificationView): void {
    this.notificationsService.markRead(notification.id).subscribe({ error: () => undefined });
    this.notificationNavigation.open(notification);
  }
}
