import { UserRole } from '@prisma/client';
import { IsEnum, IsIn, IsLocale, IsOptional, IsString, MinLength } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEnum(UserRole)
  @IsIn([UserRole.passenger, UserRole.driver])
  role!: UserRole;

  @IsOptional()
  @IsLocale()
  preferredLocale?: string;
}
