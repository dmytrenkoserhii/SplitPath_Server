import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '@/modules/users/enums/role.enum';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtAccessPayload } from '../types/jwt-access-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as JwtAccessPayload;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
