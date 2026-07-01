import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RouteResponse, RouteStopResponse } from './route.types';
import { RoutesService } from './routes.service';

@Controller('routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  listRoutes(): Promise<RouteResponse[]> {
    return this.routesService.listActiveRoutes();
  }

  @Get(':id/stops')
  listStops(@Param('id') routeId: string): Promise<RouteStopResponse[]> {
    return this.routesService.listActiveStops(routeId);
  }
}
