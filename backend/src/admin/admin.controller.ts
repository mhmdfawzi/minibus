import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RouteResponse, RouteStopResponse } from '../routes/route.types';
import {
  AdminBookingResponse,
  AdminTripResponse,
  PaginatedResponse
} from './admin-oversight.types';
import { AdminService } from './admin.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateStopDto } from './dto/create-stop.dto';
import { DriverDecisionDto } from './dto/driver-decision.dto';
import { ListAdminBookingsDto } from './dto/list-admin-bookings.dto';
import { ListAdminTripsDto } from './dto/list-admin-trips.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('routes')
  listRoutes(): Promise<RouteResponse[]> {
    return this.adminService.listRoutes();
  }

  @Post('routes')
  createRoute(@Body() dto: CreateRouteDto): Promise<RouteResponse> {
    return this.adminService.createRoute(dto);
  }

  @Patch('routes/:id')
  updateRoute(@Param('id') routeId: string, @Body() dto: UpdateRouteDto): Promise<RouteResponse> {
    return this.adminService.updateRoute(routeId, dto);
  }

  @Get('routes/:id/stops')
  listStops(@Param('id') routeId: string): Promise<RouteStopResponse[]> {
    return this.adminService.listStops(routeId);
  }

  @Post('routes/:id/stops')
  createStop(@Param('id') routeId: string, @Body() dto: CreateStopDto): Promise<RouteStopResponse> {
    return this.adminService.createStop(routeId, dto);
  }

  @Patch('stops/:id')
  updateStop(@Param('id') stopId: string, @Body() dto: UpdateStopDto): Promise<RouteStopResponse> {
    return this.adminService.updateStop(stopId, dto);
  }

  @Get('trips')
  listTrips(@Query() query: ListAdminTripsDto): Promise<PaginatedResponse<AdminTripResponse>> {
    return this.adminService.listTrips(query);
  }

  @Get('bookings')
  listBookings(
    @Query() query: ListAdminBookingsDto
  ): Promise<PaginatedResponse<AdminBookingResponse>> {
    return this.adminService.listBookings(query);
  }

  @Get('drivers/pending')
  listPendingDrivers() {
    return this.adminService.listPendingDrivers();
  }

  @Get('drivers/active')
  listActiveDrivers() {
    return this.adminService.listActiveDrivers();
  }

  @Patch('drivers/:id/approve')
  approveDriver(@Param('id') driverId: string) {
    return this.adminService.approveDriver(driverId);
  }

  @Patch('drivers/:id/suspend')
  suspendDriver(@Param('id') driverId: string, @Body() dto: DriverDecisionDto) {
    return this.adminService.suspendDriver(driverId, dto);
  }

  @Patch('drivers/:id/reject')
  rejectDriver(@Param('id') driverId: string, @Body() dto: DriverDecisionDto) {
    return this.adminService.rejectDriver(driverId, dto);
  }
}
