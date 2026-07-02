import { Prisma } from '@prisma/client';

export function calculateFlatBookingPrice(
  seatsCount: number,
  pricePerSeat: Prisma.Decimal
): Prisma.Decimal {
  return pricePerSeat.mul(seatsCount);
}
