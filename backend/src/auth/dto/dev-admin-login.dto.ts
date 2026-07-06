import { IsOptional, IsString } from 'class-validator';

export class DevAdminLoginDto {
  @IsOptional()
  @IsString()
  deviceId?: string;
}
