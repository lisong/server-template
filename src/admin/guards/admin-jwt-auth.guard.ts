import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('adminJwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // 处理用户请求和错误
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(`登录失效，请重新登录`, 'redirect-login')
      );
    }
    return user;
  }
}
