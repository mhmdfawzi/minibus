import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiRouteDirection } from '../../routes/route.types';

export class CreateRouteDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['outbound', 'return'])
  direction!: ApiRouteDirection;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
