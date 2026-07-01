import { IsDateString, IsInt, IsNumber, IsOptional, Matches, Min } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsDateString()
  tripDate?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalSeats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerSeat?: number;
}
