import { Notification, NotificationType } from '@prisma/client';

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
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
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
}
