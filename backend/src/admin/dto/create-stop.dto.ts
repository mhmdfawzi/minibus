import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateStopDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsInt()
  @Min(0)
  estimatedOffsetMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
