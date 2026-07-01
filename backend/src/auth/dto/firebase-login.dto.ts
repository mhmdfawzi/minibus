import { IsOptional, IsString, MinLength } from 'class-validator';

export class FirebaseLoginDto {
  @IsString()
  @MinLength(20)
  firebaseIdToken!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
