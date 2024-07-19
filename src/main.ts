import { CsrfInterceptor } from './common/interceptors/csrf/csrf.interceptor';
import { NestFactory } from '@nestjs/core';
import fastifyCsrf from '@fastify/csrf-protection';
import cookie from '@fastify/cookie';
import compression from '@fastify/compress';
import { AppModule } from './app.module';

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { CookieInterceptor } from './common/interceptors/cookie/cookie.interceptor';
import { ResultInterceptor } from './common/interceptors/result/result.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const cookieTokenSecret = configService.get('COOKIE_TOKEN_SECRET', '');
  if (cookieTokenSecret == '') {
    throw new Error('请先配置COOKIE_TOKEN_SECRET');
  }

  await app.register(cookie, {
    secret: cookieTokenSecret,
  });
  await app.register(fastifyCsrf, {
    cookieOpts: {
      signed: true,
      sameSite: 'strict',
      httpOnly: false,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  });

  await app.register(compression, { encodings: ['gzip', 'deflate'] });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(
    new CsrfInterceptor(),
    new CookieInterceptor(),
    new ResultInterceptor(),
  );
  await app.listen(configService.get('SERVER_PORT', 3000), '127.0.0.1');
}
bootstrap();
