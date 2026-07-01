import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user?.isActive || request.user.role !== UserRole.admin) {
      throw new ForbiddenException('Admin role is required');
    }

    return true;
  }
}
