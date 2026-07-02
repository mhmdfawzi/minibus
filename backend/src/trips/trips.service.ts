import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { BookingStatus, DriverStatus, TripStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import {
  TripResponse,
  parseTripDate,
  parseTripTime,
  toTripResponse
} from './trip.types';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async createTrip(user: AuthenticatedUser, dto: CreateTripDto): Promise<TripResponse> {
    const driver = await this.getApprovedDriver(user);
    await this.ensureActiveRoute(dto.routeId);

    const trip = await this.prisma.trip.create({
      data: {
        driverId: driver.id,
        routeId: dto.routeId,
        tripDate: parseTripDate(dto.tripDate),
        startTime: parseTripTime(dto.startTime),
        totalSeats: dto.totalSeats,
        availableSeats: dto.totalSeats,
        pricePerSeat: dto.pricePerSeat,
        status: TripStatus.open
      },
      include: { driver: true }
    });

    return toTripResponse(trip);
  }

  async listMyTrips(user: AuthenticatedUser): Promise<TripResponse[]> {
    const driver = await this.getDriverForUser(user);
    if (!driver) {
      throw new ForbiddenException('Driver profile is required');
    }

    const trips = await this.prisma.trip.findMany({
      where: { driverId: driver.id },
      include: { driver: true },
      orderBy: [{ tripDate: 'desc' }, { startTime: 'desc' }]
    });

    return trips.map(toTripResponse);
  }

  async getTrip(tripId: string): Promise<TripResponse> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return toTripResponse(trip);
  }

  async searchTrips(query: SearchTripsDto): Promise<TripResponse[]> {
    const pickupStop = await this.prisma.routeStop.findUnique({
      where: { id: query.pickupStopId }
    });
    const dropoffStop = await this.prisma.routeStop.findUnique({
      where: { id: query.dropoffStopId }
    });

    if (!pickupStop || !dropoffStop || pickupStop.routeId !== dropoffStop.routeId) {
      return [];
    }

    if (pickupStop.orderIndex >= dropoffStop.orderIndex) {
      return [];
    }

    const trips = await this.prisma.trip.findMany({
      where: {
        routeId: pickupStop.routeId,
        tripDate: parseTripDate(query.date),
        status: TripStatus.open,
        availableSeats: { gt: 0 }
      },
      include: { driver: true },
      orderBy: { startTime: 'asc' }
    });

    return trips.map(toTripResponse);
  }

  async updateTrip(
    user: AuthenticatedUser,
    tripId: string,
    dto: UpdateTripDto
  ): Promise<TripResponse> {
    const driver = await this.getApprovedDriver(user);
    const trip = await this.getOwnedTrip(tripId, driver.id);

    if (trip.status !== TripStatus.open) {
      throw new BadRequestException('Only open trips can be edited');
    }

    const activeBookingCount = await this.prisma.booking.count({
      where: {
        tripId,
        status: { in: [BookingStatus.pending, BookingStatus.accepted] }
      }
    });

    if (activeBookingCount > 0) {
      throw new BadRequestException('Trips with active bookings cannot be edited');
    }

    const nextTotalSeats = dto.totalSeats ?? trip.totalSeats;
    this.assertSeatBounds(nextTotalSeats, nextTotalSeats);

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(dto.tripDate !== undefined ? { tripDate: parseTripDate(dto.tripDate) } : {}),
        ...(dto.startTime !== undefined ? { startTime: parseTripTime(dto.startTime) } : {}),
        ...(dto.totalSeats !== undefined
          ? { totalSeats: dto.totalSeats, availableSeats: dto.totalSeats }
          : {}),
        ...(dto.pricePerSeat !== undefined ? { pricePerSeat: dto.pricePerSeat } : {})
      },
      include: { driver: true }
    });

    return toTripResponse(updatedTrip);
  }

  async startTrip(user: AuthenticatedUser, tripId: string): Promise<TripResponse> {
    const driver = await this.getApprovedDriver(user);
    const trip = await this.getOwnedTrip(tripId, driver.id);

    if (trip.status !== TripStatus.open) {
      throw new BadRequestException('Only open trips can be started');
    }

    const updatedTrip = await this.updateStatus(tripId, TripStatus.started);
    await this.safeNotify('trip_started', () => this.notifications.notifyTripStarted(tripId));
    return updatedTrip;
  }

  async completeTrip(user: AuthenticatedUser, tripId: string): Promise<TripResponse> {
    const driver = await this.getApprovedDriver(user);
    const trip = await this.getOwnedTrip(tripId, driver.id);

    if (trip.status !== TripStatus.started) {
      throw new BadRequestException('Only started trips can be completed');
    }

    return this.completeTripAndBookings(tripId);
  }

  async cancelTrip(user: AuthenticatedUser, tripId: string): Promise<TripResponse> {
    const driver = await this.getApprovedDriver(user);
    const trip = await this.getOwnedTrip(tripId, driver.id);

    const cancellableStatuses: TripStatus[] = [TripStatus.open, TripStatus.started];
    if (!cancellableStatuses.includes(trip.status)) {
      throw new BadRequestException('Only open or started trips can be cancelled');
    }

    const updatedTrip = await this.updateStatus(tripId, TripStatus.cancelled);
    await this.safeNotify('trip_cancelled', () =>
      this.notifications.notifyTripCancelled(tripId)
    );
    return updatedTrip;
  }

  private async updateStatus(tripId: string, status: TripStatus): Promise<TripResponse> {
    const trip = await this.prisma.trip.update({
      where: { id: tripId },
      data: { status },
      include: { driver: true }
    });

    return toTripResponse(trip);
  }

  private async completeTripAndBookings(tripId: string): Promise<TripResponse> {
    const trip = await this.prisma.$transaction(async (tx) => {
      const completedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.completed },
        include: { driver: true }
      });

      await tx.booking.updateMany({
        where: {
          tripId,
          status: BookingStatus.accepted
        },
        data: {
          status: BookingStatus.completed,
          holdExpiresAt: null
        }
      });

      return completedTrip;
    });

    return toTripResponse(trip);
  }

  private async getApprovedDriver(user: AuthenticatedUser) {
    if (!user.isActive || user.role !== UserRole.driver) {
      throw new ForbiddenException('Only active driver accounts can manage trips');
    }

    const driver = await this.getDriverForUser(user);
    if (!driver || driver.status !== DriverStatus.approved) {
      throw new ForbiddenException('Only approved drivers can manage trips');
    }

    return driver;
  }

  private getDriverForUser(user: AuthenticatedUser) {
    return this.prisma.driver.findUnique({
      where: { userId: user.id }
    });
  }

  private async ensureActiveRoute(routeId: string): Promise<void> {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, isActive: true }
    });

    if (!route) {
      throw new NotFoundException('Active route not found');
    }
  }

  private async getOwnedTrip(tripId: string, driverId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.driverId !== driverId) {
      throw new ForbiddenException('Trip does not belong to the authenticated driver');
    }

    this.assertSeatBounds(trip.totalSeats, trip.availableSeats);
    return trip;
  }

  private assertSeatBounds(totalSeats: number, availableSeats: number): void {
    if (availableSeats < 0 || availableSeats > totalSeats) {
      throw new BadRequestException('Trip available seats must be between zero and total seats');
    }
  }

  private async safeNotify(eventName: string, send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch (error) {
      this.logger.warn(
        `Notification event ${eventName} failed after trip state changed: ${this.errorMessage(error)}`
      );
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
