import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiRouteDirection } from '../../routes/route.types';

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(['outbound', 'return'])
  direction?: ApiRouteDirection;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
