import { IsDateString, IsString } from 'class-validator';

export class SearchTripsDto {
  @IsString()
  pickupStopId!: string;

  @IsString()
  dropoffStopId!: string;

  @IsDateString()
  date!: string;
}
