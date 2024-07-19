import { AdminUser } from '@prisma/clientAuthDB';
import { FastifyReply } from 'fastify';
import {
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AdminLocalAuthGuard } from '../guards/admin-local-auth.guard';
import { AdminUserService } from 'src/modules/admin-user/admin-user.service';
import { StatusEnum, TwoStepEnabledEnum } from 'src/common/enums-defined';
import { RedlockService } from '@anchan828/nest-redlock';
import { AdminJwtAuthTemporaryGuard } from '../guards/admin-jwt-auth-temporary.guard';
import { CheckPasswordDTO } from './check-password.dto';
import { CheckTwoStepDTO } from './check-two-step.dto';
import { AdminJwtAuthAllowedGuard } from '../guards/admin-jwt-auth-allowed.guard';

@Controller('admin/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private adminUserService: AdminUserService,
    private readonly redlockService: RedlockService,
  ) {}

  @Public()
  @Get('logout')
  async logout(
    @Request() req: { user: AdminUser },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.configService.get<string>('ADMIN_COOKIE_AUTH_NAME');
    if (cookieName && cookieName !== '') {
      reply.clearCookie(cookieName);
    }
  }

  @Public()
  @UseGuards(AdminLocalAuthGuard)
  @Post('login')
  async login(
    @Request() req: { user: AdminUser },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const userId = req.user.id;
    return this.loginInner(userId, reply);
  }

  async loginInner(userId: bigint, reply: FastifyReply) {
    let lock = null;
    try {
      lock = await this.redlockService
        .acquire([`lock`, `admin:login:${userId}`], 5000)
        .catch((error) => {
          this.logger.error(`获取登录锁失败 userId:${userId}, error:${error}`);
        });
      if (!lock) {
        throw new InternalServerErrorException('服务器繁忙，请稍后再试！');
      }
      const user = await this.adminUserService.findById(userId);
      if (!user || user.status == StatusEnum.DELETE) {
        throw new InternalServerErrorException('用户不存在！');
      }

      const two_step_method =
        await this.adminUserService.listOpenedTwoStepSetting(userId);
      let needTwoStep = false;
      let two_step_token = null;
      if (
        user.two_step_enabled == TwoStepEnabledEnum.OPEN &&
        two_step_method.length > 0
      ) {
        two_step_token = await this.adminUserService.generateUserTwoStepToken(
          userId,
          10 * 60,
        );
        needTwoStep = true;
      }
      // 登录下发 access_token
      const { access_token } = await this.authService.login(
        userId,
        user.name,
        needTwoStep,
      );
      const cookieName = this.configService.get<string>(
        'ADMIN_COOKIE_AUTH_NAME',
      );
      if (cookieName && cookieName !== '') {
        reply.setCookie(cookieName, access_token, {
          sameSite: 'strict',
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        });
      }
      return {
        access_token,
        two_step_token,
        two_step_enabled: user.two_step_enabled,
        two_step_method,
      };
    } finally {
      lock?.release();
    }
  }

  /**
   * 密码验证挑战
   */
  @Public()
  @UseGuards(AdminJwtAuthAllowedGuard)
  @Post('challenge/pwd')
  async challengePassword(
    @Request() req,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body() body: CheckPasswordDTO,
  ) {
    const userId = req.user.id;
    const user = await this.authService.checkUserPasswordById(
      userId,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('密码不正确');
    }
    return this.loginInner(userId, reply);
  }

  /**
   * 二次验证挑战
   */
  @Public()
  @UseGuards(AdminJwtAuthTemporaryGuard)
  @Post('challenge/two-step')
  async challenge(
    @Request() req,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body() body: CheckTwoStepDTO,
  ) {
    const userId = req.user.id;
    const isValid = await this.adminUserService.challengeTwoStep(
      userId,
      body.method,
      body.code,
    );
    if (!isValid) {
      throw new UnauthorizedException(`验证码有误`);
    }
    const { access_token } = await this.authService.login(
      userId,
      req.user.name,
      false,
    );
    const cookieName = this.configService.get<string>('ADMIN_COOKIE_AUTH_NAME');
    if (cookieName && cookieName !== '') {
      reply.setCookie(cookieName, access_token, {
        sameSite: 'strict',
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return {
      access_token,
    };
  }

  @Public()
  @UseGuards(AdminJwtAuthAllowedGuard)
  @Get('config/list')
  async twoStepConfigList(@Request() req) {
    const userId = req.user.id;
    const user = await this.adminUserService.findById(userId);
    const two_step_method =
      await this.adminUserService.listAllTwoStepSetting(userId);
    return {
      two_step_enabled: user.two_step_enabled,
      two_step_opened_at: user.two_step_opened_at,
      password_changed_at: user.password_changed_at,
      two_step_method: two_step_method,
    };
  }

  @Public()
  @UseGuards(AdminJwtAuthAllowedGuard)
  @Get('profile')
  async profile(@Request() req) {
    const userId = req.user.id;
    const user = await this.adminUserService.findById(userId);
    return {
      id: user.id.toString(),
      name: user.name,
    };
  }
}
