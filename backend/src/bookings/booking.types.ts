import { Booking, BookingStatus, Prisma } from '@prisma/client';

export interface BookingResponse {
  id: string;
  tripId: string;
  passengerId: string;
  pickupStopId: string;
  dropoffStopId: string;
  seatsCount: number;
  price: string;
  status: BookingStatus;
  holdExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toBookingResponse(booking: Booking): BookingResponse {
  return {
    id: booking.id,
    tripId: booking.tripId,
    passengerId: booking.passengerId,
    pickupStopId: booking.pickupStopId,
    dropoffStopId: booking.dropoffStopId,
    seatsCount: booking.seatsCount,
    price: new Prisma.Decimal(booking.price).toFixed(2),
    status: booking.status,
    holdExpiresAt: booking.holdExpiresAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
}
