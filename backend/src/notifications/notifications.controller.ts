import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationResponse } from './notification.types';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('devices/register')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(user, dto);
  }

  @Delete('devices/:token')
  deleteDevice(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.notificationsService.deleteDevice(user, token);
  }

  @Get('notifications')
  listNotifications(@CurrentUser() user: AuthenticatedUser): Promise<NotificationResponse[]> {
    return this.notificationsService.listNotifications(user);
  }

  @Patch('notifications/:id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') notificationId: string
  ): Promise<NotificationResponse> {
    return this.notificationsService.markRead(user, notificationId);
  }
}
