import { BadRequestException } from '@nestjs/common';

export function assertSeatBounds(totalSeats: number, availableSeats: number): void {
  if (availableSeats < 0 || availableSeats > totalSeats) {
    throw new BadRequestException('Trip available seats must be between zero and total seats');
  }
}
