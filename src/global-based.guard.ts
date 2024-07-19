import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminJwtAuthGuard } from './admin/guards/admin-jwt-auth.guard';
import { JwtAuthGuard } from './clients/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';

@Injectable()
export class GlobalBasedGuard implements CanActivate {
  private readonly logger = new Logger(GlobalBasedGuard.name);

  constructor(
    private reflector: Reflector,
    private adminGuard: AdminJwtAuthGuard,
    private userGuard: JwtAuthGuard,
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const uri: string = request.url;
    if (uri.startsWith('/admin')) {
      return this.adminGuard.canActivate(context);
    } else if (uri.startsWith('/clients')) {
      return this.userGuard.canActivate(context);
    }
    this.logger.warn(`not support uri ${uri}`);
    return false;
  }
}
