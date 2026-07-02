import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingStatus, NotificationType } from '@prisma/client';
import { FirebaseAdminService } from '../auth/firebase-admin.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationResponse, toNotificationResponse } from './notification.types';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdmin: FirebaseAdminService
  ) {}

  async registerDevice(user: AuthenticatedUser, dto: RegisterDeviceDto) {
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId: user.id,
        token: dto.token,
        platform: dto.platform,
        lastSeenAt: new Date()
      },
      update: {
        userId: user.id,
        platform: dto.platform,
        lastSeenAt: new Date()
      }
    });
  }

  async deleteDevice(user: AuthenticatedUser, token: string): Promise<{ deleted: boolean }> {
    const result = await this.prisma.deviceToken.deleteMany({
      where: { userId: user.id, token }
    });

    return { deleted: result.count > 0 };
  }

  async listNotifications(user: AuthenticatedUser): Promise<NotificationResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return notifications.map(toNotificationResponse);
  }

  async markRead(user: AuthenticatedUser, notificationId: string): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== user.id) {
      throw new ForbiddenException('Notification does not belong to this user');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return toNotificationResponse(updated);
  }

  async notifyBookingCreated(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passenger: { select: { fullName: true } },
        trip: { include: { driver: true, route: true } }
      }
    });

    if (!booking) return;

    await this.createAndSend({
      userId: booking.trip.driver.userId,
      title: 'طلب حجز جديد',
      body: `${booking.passenger.fullName ?? 'راكب'} طلب حجز ${booking.seatsCount} مقعد على رحلة ${booking.trip.route.name}`,
      type: NotificationType.booking_created
    });
  }

  async notifyBookingAccepted(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { include: { route: true } } }
    });

    if (!booking) return;

    await this.createAndSend({
      userId: booking.passengerId,
      title: 'تم قبول الحجز',
      body: `تم قبول حجزك على رحلة ${booking.trip.route.name}`,
      type: NotificationType.booking_accepted
    });
  }

  async notifyBookingRejected(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { include: { route: true } } }
    });

    if (!booking) return;

    await this.createAndSend({
      userId: booking.passengerId,
      title: 'تم رفض الحجز',
      body: `تم رفض طلب حجزك على رحلة ${booking.trip.route.name}`,
      type: NotificationType.booking_rejected
    });
  }

  async notifyTripCancelled(tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bookings: {
          where: { status: { in: [BookingStatus.pending, BookingStatus.accepted] } },
          select: { passengerId: true }
        }
      }
    });

    if (!trip) return;

    await this.createAndSendMany(
      trip.bookings.map((booking) => ({
        userId: booking.passengerId,
        title: 'تم إلغاء الرحلة',
        body: `تم إلغاء رحلة ${trip.route.name}`,
        type: NotificationType.trip_cancelled
      }))
    );
  }

  async notifyTripStarted(tripId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bookings: {
          where: { status: BookingStatus.accepted },
          select: { passengerId: true }
        }
      }
    });

    if (!trip) return;

    await this.createAndSendMany(
      trip.bookings.map((booking) => ({
        userId: booking.passengerId,
        title: 'بدأت الرحلة',
        body: `بدأت رحلة ${trip.route.name}`,
        type: NotificationType.trip_started
      }))
    );
  }

  private async createAndSendMany(payloads: NotificationPayload[]): Promise<void> {
    for (const payload of payloads) {
      await this.createAndSend(payload);
    }
  }

  private async createAndSend(payload: NotificationPayload): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        isRead: false
      }
    });

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: payload.userId }
    });

    if (tokens.length === 0) return;

    try {
      const response = await this.firebaseAdmin.sendEachForMulticast({
        tokens: tokens.map((token) => token.token),
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: {
          type: payload.type
        }
      });

      const staleTokens = response.responses
        .map((sendResponse, index) => ({ sendResponse, token: tokens[index] }))
        .filter(({ sendResponse }) => this.isStaleTokenError(sendResponse.error?.code))
        .map(({ token }) => token.token);

      if (staleTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: staleTokens } }
        });
      }
    } catch (error) {
      this.logger.warn(`Push send failed after notification persisted: ${this.errorMessage(error)}`);
    }
  }

  private isStaleTokenError(code?: string): boolean {
    return (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token'
    );
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
