import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
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
    private readonly notificationWatcher: NotificationWatcherService,
    private readonly pushNotifications: PushNotificationsService
  ) {
    void this.pushNotifications.initialize();
    if (this.authApi.getAccessToken()) {
      // NotificationWatcherService.start() already fetches the list on its
      // first poll, which keeps the unread-count badge in sync - no need for
      // a second, separate refreshUnreadCount() call here.
      this.notificationWatcher.start();
    }
  }
}
