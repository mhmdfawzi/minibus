import { IsDateString, IsInt, IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreateTripDto {
  @IsString()
  routeId!: string;

  @IsDateString()
  tripDate!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @IsInt()
  @Min(1)
  totalSeats!: number;

  @IsNumber()
  @Min(0)
  pricePerSeat!: number;
}
