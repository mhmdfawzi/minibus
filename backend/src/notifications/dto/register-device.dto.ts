import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @MinLength(16)
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}
