import { Notification, NotificationType, Prisma } from '@prisma/client';

export type NotificationData = {
  bookingId?: string;
  tripId?: string;
  targetRole?: 'driver' | 'passenger';
};

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data: NotificationData;
  isRead: boolean;
  createdAt: Date;
}

export function toNotificationResponse(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    data: toNotificationData(notification.data),
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
}

function toNotificationData(value: Prisma.JsonValue): NotificationData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const data = value as Record<string, unknown>;
  return {
    ...(typeof data.bookingId === 'string' ? { bookingId: data.bookingId } : {}),
    ...(typeof data.tripId === 'string' ? { tripId: data.tripId } : {}),
    ...(data.targetRole === 'driver' || data.targetRole === 'passenger'
      ? { targetRole: data.targetRole }
      : {})
  };
}
