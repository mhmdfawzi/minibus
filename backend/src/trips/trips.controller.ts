import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripResponse } from './trip.types';
import { TripsService } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  createTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTripDto
  ): Promise<TripResponse> {
    return this.tripsService.createTrip(user, dto);
  }

  @Get('my')
  listMyTrips(@CurrentUser() user: AuthenticatedUser): Promise<TripResponse[]> {
    return this.tripsService.listMyTrips(user);
  }

  @Get(':id')
  getTrip(@Param('id') tripId: string): Promise<TripResponse> {
    return this.tripsService.getTrip(tripId);
  }

  @Patch(':id')
  updateTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tripId: string,
    @Body() dto: UpdateTripDto
  ): Promise<TripResponse> {
    return this.tripsService.updateTrip(user, tripId, dto);
  }

  @Patch(':id/start')
  startTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tripId: string
  ): Promise<TripResponse> {
    return this.tripsService.startTrip(user, tripId);
  }

  @Patch(':id/complete')
  completeTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tripId: string
  ): Promise<TripResponse> {
    return this.tripsService.completeTrip(user, tripId);
  }

  @Patch(':id/cancel')
  cancelTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') tripId: string
  ): Promise<TripResponse> {
    return this.tripsService.cancelTrip(user, tripId);
  }
}
