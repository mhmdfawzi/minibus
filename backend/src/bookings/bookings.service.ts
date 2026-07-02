import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common';
import {
  BookingStatus,
  DriverStatus,
  Prisma,
  TripStatus,
  UserRole
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { calculateFlatBookingPrice } from './booking-price';
import { BookingResponse, toBookingResponse } from './booking.types';
import { CreateBookingDto } from './dto/create-booking.dto';

interface LockedTrip {
  id: string;
  route_id: string;
  driver_id: string;
  total_seats: number;
  available_seats: number;
  price_per_seat: Prisma.Decimal;
  status: TripStatus;
}

interface SeatMutationResult<T> {
  result: T;
  seatDelta: number;
}

type BookingTx = Prisma.TransactionClient;

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsService.name);
  private readonly holdMinutes = 15;
  private expiryTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    void this.expirePendingBookings();
    this.expiryTimer = setInterval(() => {
      void this.expirePendingBookings();
    }, 60_000);
    this.expiryTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
    }
  }

  async createBooking(
    user: AuthenticatedUser,
    dto: CreateBookingDto
  ): Promise<BookingResponse> {
    this.ensurePassenger(user);

    const booking = await this.prisma.$transaction(async (tx) =>
      this.withLockedTripSeatMutation(tx, dto.tripId, async (trip) => {
        const pickupStop = await tx.routeStop.findUnique({
          where: { id: dto.pickupStopId }
        });
        const dropoffStop = await tx.routeStop.findUnique({
          where: { id: dto.dropoffStopId }
        });

        if (!pickupStop || pickupStop.routeId !== trip.route_id) {
          throw new BadRequestException('Pickup stop is not on this trip route');
        }
        if (!dropoffStop || dropoffStop.routeId !== trip.route_id) {
          throw new BadRequestException('Dropoff stop is not on this trip route');
        }
        if (pickupStop.orderIndex >= dropoffStop.orderIndex) {
          throw new BadRequestException('Pickup stop must come before dropoff stop');
        }
        if (trip.status !== TripStatus.open) {
          throw new BadRequestException('Trip is not open for booking');
        }
        if (trip.available_seats < dto.seatsCount) {
          throw new BadRequestException('Not enough seats available');
        }

        const activeBooking = await tx.booking.findFirst({
          where: {
            tripId: dto.tripId,
            passengerId: user.id,
            status: { in: [BookingStatus.pending, BookingStatus.accepted] }
          }
        });
        if (activeBooking) {
          throw new BadRequestException('Passenger already has an active booking on this trip');
        }

        const createdBooking = await tx.booking.create({
          data: {
            tripId: dto.tripId,
            passengerId: user.id,
            pickupStopId: dto.pickupStopId,
            dropoffStopId: dto.dropoffStopId,
            seatsCount: dto.seatsCount,
            price: calculateFlatBookingPrice(dto.seatsCount, trip.price_per_seat),
            status: BookingStatus.pending,
            holdExpiresAt: this.holdExpiryDate()
          }
        });

        return {
          result: createdBooking,
          seatDelta: -dto.seatsCount
        };
      })
    );

    return toBookingResponse(booking);
  }

  async listPassengerBookings(user: AuthenticatedUser): Promise<BookingResponse[]> {
    this.ensurePassenger(user);
    const bookings = await this.prisma.booking.findMany({
      where: { passengerId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map(toBookingResponse);
  }

  async listDriverBookings(user: AuthenticatedUser): Promise<BookingResponse[]> {
    const driver = await this.getDriverForUser(user);
    const bookings = await this.prisma.booking.findMany({
      where: {
        trip: {
          driverId: driver.id
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map(toBookingResponse);
  }

  async acceptBooking(user: AuthenticatedUser, bookingId: string): Promise<BookingResponse> {
    const driver = await this.getDriverForUser(user);

    const booking = await this.prisma.$transaction(async (tx) => {
      const bookingRef = await this.getBookingRef(tx, bookingId);

      return this.withLockedTripSeatMutation(tx, bookingRef.tripId, async (trip) => {
        this.ensureDriverOwnsTrip(driver.id, trip);
        const existingBooking = await this.getBookingForUpdate(tx, bookingId);
        if (existingBooking.status !== BookingStatus.pending) {
          throw new BadRequestException('Only pending bookings can be accepted');
        }

        const acceptedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.accepted,
            holdExpiresAt: null
          }
        });

        return {
          result: acceptedBooking,
          seatDelta: 0
        };
      });
    });

    return toBookingResponse(booking);
  }

  async rejectBooking(user: AuthenticatedUser, bookingId: string): Promise<BookingResponse> {
    const driver = await this.getDriverForUser(user);

    const booking = await this.prisma.$transaction(async (tx) => {
      const bookingRef = await this.getBookingRef(tx, bookingId);

      return this.withLockedTripSeatMutation(tx, bookingRef.tripId, async (trip) => {
        this.ensureDriverOwnsTrip(driver.id, trip);
        const existingBooking = await this.getBookingForUpdate(tx, bookingId);
        if (existingBooking.status !== BookingStatus.pending) {
          throw new BadRequestException('Only pending bookings can be rejected');
        }

        const rejectedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.rejected,
            holdExpiresAt: null
          }
        });

        return {
          result: rejectedBooking,
          seatDelta: existingBooking.seatsCount
        };
      });
    });

    return toBookingResponse(booking);
  }

  async cancelBooking(user: AuthenticatedUser, bookingId: string): Promise<BookingResponse> {
    const driver = user.role === UserRole.driver ? await this.getDriverForUser(user) : null;

    const booking = await this.prisma.$transaction(async (tx) => {
      const bookingRef = await this.getBookingRef(tx, bookingId);

      return this.withLockedTripSeatMutation(tx, bookingRef.tripId, async (trip) => {
        const existingBooking = await this.getBookingForUpdate(tx, bookingId);
        const canPassengerCancel = existingBooking.passengerId === user.id;
        const canDriverCancel = driver?.id === trip.driver_id;

        if (!canPassengerCancel && !canDriverCancel) {
          throw new ForbiddenException('Booking does not belong to this user');
        }

        const cancellableStatuses: BookingStatus[] = [
          BookingStatus.pending,
          BookingStatus.accepted
        ];
        if (!cancellableStatuses.includes(existingBooking.status)) {
          throw new BadRequestException('Only pending or accepted bookings can be cancelled');
        }

        const cancelledBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.cancelled,
            holdExpiresAt: null
          }
        });

        return {
          result: cancelledBooking,
          seatDelta: existingBooking.seatsCount
        };
      });
    });

    return toBookingResponse(booking);
  }

  async expirePendingBookings(): Promise<number> {
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.pending,
        holdExpiresAt: {
          lte: new Date()
        }
      },
      select: {
        id: true,
        tripId: true
      },
      take: 50
    });

    let expiredCount = 0;
    for (const booking of expiredBookings) {
      const didExpire = await this.prisma.$transaction(async (tx) =>
        this.withLockedTripSeatMutation(tx, booking.tripId, async () => {
          const currentBooking = await this.getBookingForUpdate(tx, booking.id);

          if (!currentBooking || currentBooking.status !== BookingStatus.pending) {
            return { result: false, seatDelta: 0 };
          }

          const expiredBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.expired,
              holdExpiresAt: null
            }
          });

          return {
            result: expiredBooking.status === BookingStatus.expired,
            seatDelta: currentBooking.seatsCount
          };
        })
      );

      if (didExpire) {
        expiredCount += 1;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} pending booking hold(s)`);
    }

    return expiredCount;
  }

  private async withLockedTripSeatMutation<T>(
    tx: BookingTx,
    tripId: string,
    operation: (trip: LockedTrip) => Promise<SeatMutationResult<T>>
  ): Promise<T> {
    const [trip] = await tx.$queryRawUnsafe<LockedTrip[]>(
      'SELECT id, route_id, driver_id, total_seats, available_seats, price_per_seat, status FROM trips WHERE id = $1::uuid FOR UPDATE',
      tripId
    );

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    this.assertSeatBounds(trip.total_seats, trip.available_seats);
    const { result, seatDelta } = await operation(trip);
    const nextAvailableSeats = trip.available_seats + seatDelta;
    this.assertSeatBounds(trip.total_seats, nextAvailableSeats);

    if (seatDelta !== 0) {
      await tx.trip.update({
        where: { id: tripId },
        data: { availableSeats: nextAvailableSeats }
      });
    }

    return result;
  }

  private async getBookingRef(tx: BookingTx, bookingId: string): Promise<{ tripId: string }> {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { tripId: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  private async getBookingForUpdate(tx: BookingTx, bookingId: string) {
    const lockedRows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM bookings WHERE id = $1::uuid FOR UPDATE',
      bookingId
    );

    if (lockedRows.length === 0) {
      throw new NotFoundException('Booking not found');
    }

    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  private ensurePassenger(user: AuthenticatedUser): void {
    if (!user.isActive || user.role !== UserRole.passenger) {
      throw new ForbiddenException('Only active passenger accounts can book trips');
    }
  }

  private async getDriverForUser(user: AuthenticatedUser) {
    if (!user.isActive || user.role !== UserRole.driver) {
      throw new ForbiddenException('Only active driver accounts can manage bookings');
    }

    const driver = await this.prisma.driver.findUnique({
      where: { userId: user.id }
    });

    if (!driver || driver.status !== DriverStatus.approved) {
      throw new ForbiddenException('Only approved drivers can manage bookings');
    }

    return driver;
  }

  private ensureDriverOwnsTrip(driverId: string, trip: LockedTrip): void {
    if (trip.driver_id !== driverId) {
      throw new ForbiddenException('Booking does not belong to this driver');
    }
  }

  private holdExpiryDate(): Date {
    return new Date(Date.now() + this.holdMinutes * 60 * 1000);
  }

  private assertSeatBounds(totalSeats: number, availableSeats: number): void {
    if (availableSeats < 0 || availableSeats > totalSeats) {
      throw new BadRequestException('Trip available seats must be between zero and total seats');
    }
  }
}
