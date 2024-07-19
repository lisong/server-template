import { ExecutionContext, Injectable } from '@nestjs/common';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

/**
 * 登录用户即可访问
 */
@Injectable()
export class AdminJwtAuthAllowedGuard extends AdminJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.supportAllowed = true;
    return super.canActivate(context);
  }
}
