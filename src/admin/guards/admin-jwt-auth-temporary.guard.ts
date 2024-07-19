import { ExecutionContext, Injectable } from '@nestjs/common';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

/**
 * 临时验证，还需要两部验证
 */
@Injectable()
export class AdminJwtAuthTemporaryGuard extends AdminJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.supportTemporary = true;
    request.token = request.query.token;
    return super.canActivate(context);
  }
}
