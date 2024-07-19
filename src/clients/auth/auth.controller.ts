import { FastifyReply } from 'fastify';
import {
  Controller,
  Get,
  Inject,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { UsersService } from 'src/modules/users/users.service';
import { AuthService } from './auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedlockService } from '@anchan828/nest-redlock';
import { RedisService } from 'src/modules/redis/redis.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Cache } from 'cache-manager';
import { EncryptionService } from 'src/modules/common/encryption.service';

@Controller('clients/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private redlockService: RedlockService,
    private readonly redisService: RedisService,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) reply: FastifyReply) {
    const { access_token } = await this.authService.login(req.user);
    const cookieName = this.configService.get<string>('COOKIE_AUTH_NAME');
    if (cookieName && cookieName !== '') {
      reply.setCookie(cookieName, access_token, {
        sameSite: 'strict',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return { access_token };
  }

  @Get('profile')
  async profile(@Request() req) {
    return { user: req.user };
  }
}
