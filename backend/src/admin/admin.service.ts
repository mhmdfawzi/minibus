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
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateStopDto } from './dto/create-stop.dto';
import { DriverDecisionDto } from './dto/driver-decision.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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

  async listPendingDrivers() {
    return this.prisma.driver.findMany({
      where: { status: DriverStatus.pending },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
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
