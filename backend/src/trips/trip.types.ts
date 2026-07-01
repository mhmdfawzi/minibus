import { Prisma, Trip, TripStatus } from '@prisma/client';

export interface TripResponse {
  id: string;
  routeId: string;
  driverId: string;
  tripDate: string;
  startTime: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: string;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
  driverCar?: {
    model: string;
    plate: string;
    color: string;
  };
}

type TripWithDriver = Trip & {
  driver?: {
    carModel: string;
    carPlate: string;
    carColor: string;
  };
};

export function toTripResponse(trip: TripWithDriver): TripResponse {
  return {
    id: trip.id,
    routeId: trip.routeId,
    driverId: trip.driverId,
    tripDate: toDateOnly(trip.tripDate),
    startTime: toTimeOnly(trip.startTime),
    totalSeats: trip.totalSeats,
    availableSeats: trip.availableSeats,
    pricePerSeat: new Prisma.Decimal(trip.pricePerSeat).toFixed(2),
    status: trip.status,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    ...(trip.driver
      ? {
          driverCar: {
            model: trip.driver.carModel,
            plate: trip.driver.carPlate,
            color: trip.driver.carColor
          }
        }
      : {})
  };
}

export function parseTripDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function parseTripTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeOnly(date: Date): string {
  return date.toISOString().slice(11, 16);
}
