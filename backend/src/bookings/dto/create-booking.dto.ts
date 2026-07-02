import { IsInt, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tripId!: string;

  @IsString()
  pickupStopId!: string;

  @IsString()
  dropoffStopId!: string;

  @IsInt()
  @Min(1)
  seatsCount!: number;
}
