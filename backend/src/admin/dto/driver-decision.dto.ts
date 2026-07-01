import { IsOptional, IsString, MinLength } from 'class-validator';

export class DriverDecisionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  rejectionReason?: string;
}
