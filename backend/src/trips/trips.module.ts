import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [TripsController],
  providers: [TripsService]
})
export class TripsModule {}
