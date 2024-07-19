import { ExecutionContext, Injectable } from '@nestjs/common';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

/**
 * 安全权限校验，必须密码登录验证后10分钟内有效
 */
@Injectable()
export class AdminJwtAuthSecurityGuard extends AdminJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().supportSecurity = true;
    return super.canActivate(context);
  }
}
