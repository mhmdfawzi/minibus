import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { configuration } from './config/configuration';
import { DriversModule } from './drivers/drivers.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { RatingsModule } from './ratings/ratings.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../.env']
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DriversModule,
    RoutesModule,
    TripsModule,
    BookingsModule,
    RatingsModule,
    NotificationsModule,
    AdminModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
