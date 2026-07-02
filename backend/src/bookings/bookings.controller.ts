import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingResponse } from './booking.types';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto
  ): Promise<BookingResponse> {
    return this.bookingsService.createBooking(user, dto);
  }

  @Get('my')
  listMyBookings(@CurrentUser() user: AuthenticatedUser): Promise<BookingResponse[]> {
    return this.bookingsService.listPassengerBookings(user);
  }

  @Patch(':id/accept')
  acceptBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string
  ): Promise<BookingResponse> {
    return this.bookingsService.acceptBooking(user, bookingId);
  }

  @Patch(':id/reject')
  rejectBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string
  ): Promise<BookingResponse> {
    return this.bookingsService.rejectBooking(user, bookingId);
  }

  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string
  ): Promise<BookingResponse> {
    return this.bookingsService.cancelBooking(user, bookingId);
  }
}
