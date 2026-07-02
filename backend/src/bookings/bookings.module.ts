import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsController, DriverBookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [BookingsController, DriverBookingsController],
  providers: [BookingsService]
})
export class BookingsModule {}
