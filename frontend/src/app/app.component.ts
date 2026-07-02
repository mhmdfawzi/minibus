import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NotificationsService } from './api/notifications.service';
import { AuthApiService } from './auth-api.service';
import { NotificationWatcherService } from './notification-watcher.service';
import { PushNotificationsService } from './push-notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: '<ion-app dir="rtl"><ion-router-outlet></ion-router-outlet></ion-app>'
})
export class AppComponent {
  constructor(
    private readonly authApi: AuthApiService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationWatcher: NotificationWatcherService,
    private readonly pushNotifications: PushNotificationsService
  ) {
    void this.pushNotifications.initialize();
    if (this.authApi.getAccessToken()) {
      this.notificationsService.refreshUnreadCount();
      this.notificationWatcher.start();
    }
  }
}
