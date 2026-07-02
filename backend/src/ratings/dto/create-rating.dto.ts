import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  tripId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rate!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
