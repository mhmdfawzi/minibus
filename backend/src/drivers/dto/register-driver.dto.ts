import { IsString, MinLength } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @MinLength(6)
  nationalId!: string;

  @IsString()
  @MinLength(4)
  licenseNumber!: string;

  @IsString()
  @MinLength(2)
  carModel!: string;

  @IsString()
  @MinLength(2)
  carPlate!: string;

  @IsString()
  @MinLength(2)
  carColor!: string;
}
