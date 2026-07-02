import { Booking, Trip } from '@prisma/client';
import { toTripResponse, TripResponse } from '../trips/trip.types';
import { BookingResponse, toBookingResponse } from '../bookings/booking.types';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminTripResponse extends TripResponse {
  route?: {
    id: string;
    name: string;
  };
  driver?: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
  bookingCount: number;
}

type AdminTrip = Trip & {
  route: {
    id: string;
    name: string;
  };
  driver: {
    id: string;
    carModel: string;
    carPlate: string;
    carColor: string;
    user: {
      fullName: string | null;
      phone: string | null;
    };
  };
  _count: {
    bookings: number;
  };
};

export function toAdminTripResponse(trip: AdminTrip): AdminTripResponse {
  return {
    ...toTripResponse(trip),
    route: {
      id: trip.route.id,
      name: trip.route.name
    },
    driver: {
      id: trip.driver.id,
      fullName: trip.driver.user.fullName,
      phone: trip.driver.user.phone
    },
    bookingCount: trip._count.bookings
  };
}

export interface AdminBookingResponse extends BookingResponse {
  passenger?: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
  trip?: {
    id: string;
    routeId: string;
    routeName: string;
    driverId: string;
    driverName: string | null;
    tripDate: string;
    startTime: string;
  };
}

type AdminBooking = Booking & {
  trip: {
    id: string;
    routeId: string;
    driverId: string;
    tripDate: Date;
    startTime: Date;
    route: {
      name: string;
    };
    driver: {
      user: {
        fullName: string | null;
      };
    };
  };
  passenger: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
};

export function toAdminBookingResponse(booking: AdminBooking): AdminBookingResponse {
  return {
    ...toBookingResponse(booking),
    passenger: {
      id: booking.passenger.id,
      fullName: booking.passenger.fullName,
      phone: booking.passenger.phone
    },
    trip: {
      id: booking.trip.id,
      routeId: booking.trip.routeId,
      routeName: booking.trip.route.name,
      driverId: booking.trip.driverId,
      driverName: booking.trip.driver.user.fullName,
      tripDate: booking.trip.tripDate.toISOString().slice(0, 10),
      startTime: booking.trip.startTime.toISOString().slice(11, 16)
    }
  };
}
