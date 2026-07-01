import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RouteResponse, RouteStopResponse, toApiRoute, toApiRouteStop } from './route.types';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveRoutes(): Promise<RouteResponse[]> {
    const routes = await this.prisma.route.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: 'asc' }]
    });

    return routes.map(toApiRoute);
  }

  async listActiveStops(routeId: string): Promise<RouteStopResponse[]> {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, isActive: true }
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const stops = await this.prisma.routeStop.findMany({
      where: { routeId, isActive: true },
      orderBy: { orderIndex: 'asc' }
    });

    return stops.map(toApiRouteStop);
  }
}
