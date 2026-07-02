import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationsService } from '../api/notifications.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if ((notifications.unreadCount$ | async); as count) {
      @if (count > 0) {
        <span class="notification-badge">{{ count > 9 ? '9+' : count }}</span>
      }
    }
  `
})
export class NotificationBadgeComponent {
  constructor(readonly notifications: NotificationsService) {}
}
