import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { BookingStatus, Prisma, TripStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponse, toRatingResponse } from './rating.types';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRating(
    user: AuthenticatedUser,
    dto: CreateRatingDto
  ): Promise<RatingResponse> {
    this.ensurePassenger(user);

    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: {
        id: true,
        driverId: true,
        status: true
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.status !== TripStatus.completed) {
      throw new BadRequestException('Only completed trips can be rated');
    }

    const acceptedBooking = await this.prisma.booking.findFirst({
      where: {
        tripId: dto.tripId,
        passengerId: user.id,
        status: { in: [BookingStatus.accepted, BookingStatus.completed] }
      },
      select: { id: true }
    });

    if (!acceptedBooking) {
      throw new ForbiddenException('Only passengers accepted on this trip can rate it');
    }

    const existingRating = await this.prisma.rating.findUnique({
      where: {
        tripId_passengerId: {
          tripId: dto.tripId,
          passengerId: user.id
        }
      }
    });

    if (existingRating) {
      throw new ConflictException('Passenger already rated this trip');
    }

    try {
      const rating = await this.prisma.rating.create({
        data: {
          tripId: dto.tripId,
          passengerId: user.id,
          driverId: trip.driverId,
          rate: dto.rate,
          comment: dto.comment?.trim() || null
        }
      });

      return toRatingResponse(rating);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Passenger already rated this trip');
      }
      throw error;
    }
  }

  async listDriverRatings(driverId: string): Promise<RatingResponse[]> {
    await this.ensureDriverExists(driverId);

    const ratings = await this.prisma.rating.findMany({
      where: { driverId },
      include: {
        passenger: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return ratings.map(toRatingResponse);
  }

  private ensurePassenger(user: AuthenticatedUser): void {
    if (!user.isActive || user.role !== UserRole.passenger) {
      throw new ForbiddenException('Only active passenger accounts can rate trips');
    }
  }

  private async ensureDriverExists(driverId: string): Promise<void> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true }
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
  }
}
