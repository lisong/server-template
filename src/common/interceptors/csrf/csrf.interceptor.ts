import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    // 生成 CSRF 令牌
    const csrfToken = request.cookies['_csrf'];
    if (!csrfToken || csrfToken.length == 0) {
      reply.generateCsrf({ path: '/' });
    }

    // 如果是其他类型的请求，验证 CSRF 令牌
    if (
      process.env.NODE_ENV === 'production' &&
      (request.method === 'POST' ||
        request.method === 'PUT' ||
        request.method === 'DELETE')
    ) {
      const csrfHeader = request.headers['_csrf'];
      if (!csrfToken || !csrfHeader || csrfToken !== csrfHeader) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    return next.handle();
  }
}
