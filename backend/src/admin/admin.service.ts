import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { DriverStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  RouteResponse,
  RouteStopResponse,
  toApiRoute,
  toApiRouteStop,
  toPrismaRouteDirection
} from '../routes/route.types';
import {
  AdminBookingResponse,
  AdminTripResponse,
  PaginatedResponse,
  toAdminBookingResponse,
  toAdminTripResponse
} from './admin-oversight.types';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateStopDto } from './dto/create-stop.dto';
import { DriverDecisionDto } from './dto/driver-decision.dto';
import { ListAdminBookingsDto } from './dto/list-admin-bookings.dto';
import { ListAdminTripsDto } from './dto/list-admin-trips.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoutes(): Promise<RouteResponse[]> {
    const routes = await this.prisma.route.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return routes.map(toApiRoute);
  }

  async createRoute(dto: CreateRouteDto): Promise<RouteResponse> {
    const route = await this.prisma.route.create({
      data: {
        name: dto.name,
        direction: toPrismaRouteDirection(dto.direction),
        isActive: dto.isActive ?? true
      }
    });

    return toApiRoute(route);
  }

  async updateRoute(routeId: string, dto: UpdateRouteDto): Promise<RouteResponse> {
    try {
      const route = await this.prisma.route.update({
        where: { id: routeId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.direction !== undefined
            ? { direction: toPrismaRouteDirection(dto.direction) }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
        }
      });

      return toApiRoute(route);
    } catch (error) {
      this.throwNotFoundOnMissing(error, 'Route not found');
      throw error;
    }
  }

  async listStops(routeId: string): Promise<RouteStopResponse[]> {
    await this.ensureRouteExists(routeId);

    const stops = await this.prisma.routeStop.findMany({
      where: { routeId },
      orderBy: [
        { orderIndex: 'asc' },
        { name: 'asc' }
      ]
    });

    return stops.map(toApiRouteStop);
  }

  async createStop(routeId: string, dto: CreateStopDto): Promise<RouteStopResponse> {
    await this.ensureRouteExists(routeId);

    try {
      const stop = await this.prisma.routeStop.create({
        data: {
          routeId,
          name: dto.name,
          orderIndex: dto.orderIndex,
          estimatedOffsetMinutes: dto.estimatedOffsetMinutes,
          isActive: dto.isActive ?? true
        }
      });

      return toApiRouteStop(stop);
    } catch (error) {
      this.throwConflictOnUniqueRouteOrder(error);
      throw error;
    }
  }

  async updateStop(stopId: string, dto: UpdateStopDto): Promise<RouteStopResponse> {
    try {
      const stop = await this.prisma.routeStop.update({
        where: { id: stopId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
          ...(dto.estimatedOffsetMinutes !== undefined
            ? { estimatedOffsetMinutes: dto.estimatedOffsetMinutes }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
        }
      });

      return toApiRouteStop(stop);
    } catch (error) {
      this.throwNotFoundOnMissing(error, 'Stop not found');
      this.throwConflictOnUniqueRouteOrder(error);
      throw error;
    }
  }

  async listTrips(query: ListAdminTripsDto): Promise<PaginatedResponse<AdminTripResponse>> {
    const { page, limit, skip } = this.pagination(query.page, query.limit);
    const where: Prisma.TripWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            tripDate: {
              ...(query.dateFrom ? { gte: this.parseDate(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: this.parseDate(query.dateTo) } : {})
            }
          }
        : {})
    };

    const [total, trips] = await this.prisma.$transaction([
      this.prisma.trip.count({ where }),
      this.prisma.trip.findMany({
        where,
        include: {
          route: {
            select: {
              id: true,
              name: true
            }
          },
          driver: {
            select: {
              id: true,
              carModel: true,
              carPlate: true,
              carColor: true,
              user: {
                select: {
                  fullName: true,
                  phone: true
                }
              }
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: [{ tripDate: 'desc' }, { startTime: 'desc' }],
        skip,
        take: limit
      })
    ]);

    return {
      data: trips.map(toAdminTripResponse),
      total,
      page,
      limit
    };
  }

  async listBookings(
    query: ListAdminBookingsDto
  ): Promise<PaginatedResponse<AdminBookingResponse>> {
    const { page, limit, skip } = this.pagination(query.page, query.limit);
    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.tripId ? { tripId: query.tripId } : {}),
      ...(query.passengerId ? { passengerId: query.passengerId } : {})
    };

    const [total, bookings] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          passenger: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          },
          trip: {
            select: {
              id: true,
              routeId: true,
              driverId: true,
              tripDate: true,
              startTime: true,
              route: {
                select: {
                  name: true
                }
              },
              driver: {
                select: {
                  user: {
                    select: {
                      fullName: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      data: bookings.map(toAdminBookingResponse),
      total,
      page,
      limit
    };
  }

  async listPendingDrivers() {
    return this.prisma.driver.findMany({
      where: { status: DriverStatus.pending },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async listActiveDrivers() {
    return this.prisma.driver.findMany({
      where: { status: DriverStatus.approved },
      include: { user: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async approveDriver(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!Array.isArray(driver.docUrls) || driver.docUrls.length < 2) {
      throw new BadRequestException('Driver must upload ID and license documents before approval');
    }

    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: DriverStatus.approved,
        rejectionReason: null
      },
      include: { user: true }
    });
  }

  async suspendDriver(driverId: string, dto: DriverDecisionDto) {
    return this.setDriverStatus(driverId, DriverStatus.suspended, dto.rejectionReason);
  }

  async rejectDriver(driverId: string, dto: DriverDecisionDto) {
    if (!dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.setDriverStatus(driverId, DriverStatus.rejected, dto.rejectionReason);
  }

  private async setDriverStatus(
    driverId: string,
    status: DriverStatus,
    rejectionReason?: string
  ) {
    try {
      return await this.prisma.driver.update({
        where: { id: driverId },
        data: { status, rejectionReason: rejectionReason ?? null },
        include: { user: true }
      });
    } catch (error) {
      this.throwNotFoundOnMissing(error, 'Driver not found');
      throw error;
    }
  }

  private async ensureRouteExists(routeId: string): Promise<void> {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
  }

  private pagination(page = 1, limit = 20): { page: number; limit: number; skip: number } {
    return {
      page,
      limit,
      skip: (page - 1) * limit
    };
  }

  private parseDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private throwConflictOnUniqueRouteOrder(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A stop with this order already exists on the route');
    }
  }

  private throwNotFoundOnMissing(error: unknown, message: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(message);
    }
  }
}
