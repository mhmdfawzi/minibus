import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationData, NotificationType, NotificationView } from './api/notifications.service';

@Injectable({ providedIn: 'root' })
export class NotificationNavigationService {
  constructor(private readonly router: Router) {}

  open(notification: NotificationView): void {
    void this.router.navigateByUrl(this.urlFor(notification.type, notification.data));
  }

  openFromPush(data: Record<string, unknown> | undefined): void {
    const type = typeof data?.['type'] === 'string' ? (data['type'] as NotificationType) : undefined;
    if (!type) return;

    this.open({
      id: '',
      userId: '',
      title: '',
      body: '',
      type,
      data: {
        ...(typeof data?.['bookingId'] === 'string' ? { bookingId: data['bookingId'] as string } : {}),
        ...(typeof data?.['tripId'] === 'string' ? { tripId: data['tripId'] as string } : {}),
        ...(data?.['targetRole'] === 'driver' || data?.['targetRole'] === 'passenger'
          ? { targetRole: data['targetRole'] }
          : {})
      },
      isRead: true,
      createdAt: new Date().toISOString()
    });
  }

  urlFor(type: NotificationType, data: NotificationData): string {
    if ((type === 'booking_created' || data.targetRole === 'driver') && data.tripId) {
      return `/driver/trips/${data.tripId}`;
    }

    if (data.bookingId) {
      return `/passenger/bookings/${data.bookingId}/status`;
    }

    if (data.tripId) {
      return `/passenger/trips/${data.tripId}/book`;
    }

    return '/notifications';
  }
}
