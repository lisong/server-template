import { EncryptionService } from 'src/modules/common/encryption.service';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
  UnprocessableEntityException,
  UseInterceptors,
} from '@nestjs/common';
import { AdminUser, AdminUserTwoStepSetting } from '@prisma/clientAuthDB';
import {
  StatusEnum,
  TwoStepEnabledEnum,
  TwoStepMethodEnum,
} from 'src/common/enums-defined';
import { PrismaAuthDBService } from '../prisma/prisma-auth_db';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as _ from 'lodash';
import { TimeService } from '../time/time.service';
import { RedlockService } from '@anchan828/nest-redlock';
import {
  CACHE_MANAGER,
  CacheInterceptor,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
const digits = 6;
authenticator.options = { digits: digits };
@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  public static SUPPORT_TWO_STEP_METHOD = [TwoStepMethodEnum.TOTP];

  private static readonly BASE_LOCK_TIME = 5 * 60 * 1000; // 1 分钟，以毫秒为单位

  constructor(
    private prisma: PrismaAuthDBService,
    private encryption: EncryptionService,
    private readonly timeService: TimeService,
    private readonly redlockService: RedlockService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async pagination(page: number, pageSize: number) {
    const total = await this.prisma.adminUser.count();
    let items = [];
    if (total > 0) {
      items = await this.prisma.adminUser.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      });
    }

    return {
      total,
      items: items.map((it: AdminUser) => {
        const { password, ...rs } = it;
        return {
          ...rs,
          id: Number(it.id),
        };
      }),
      page,
      pageSize,
    };
  }

  async findByName(username: string): Promise<AdminUser | undefined> {
    if (!username || username === '') {
      return null;
    }
    return this.prisma.adminUser.findUnique({ where: { name: username } });
  }

  async findByIdFromCache(userId: bigint): Promise<AdminUser | undefined> {
    const key = `cache:findById:${userId}`;
    const cachedData = await this.cacheManager.get<AdminUser>(key);
    if (cachedData) {
      return cachedData;
    }
    const data = await this.findById(userId);
    await this.cacheManager.set(
      key,
      { ...data, id: String(data.id) },
      600 * 1000,
    );
    return data;
  }

  async findById(userId: bigint): Promise<AdminUser | undefined> {
    if (!userId || userId <= 0) {
      return null;
    }
    return this.prisma.adminUser.findUnique({ where: { id: userId } });
  }

  async checkTemporaryToken(userId: bigint, input: string): Promise<boolean> {
    const data = await this.prisma.adminUserTwoStepToken.findUnique({
      where: { user_id: userId },
    });
    if (!data) {
      return false;
    }
    if (
      input &&
      input != '' &&
      data.token == input &&
      data.expires_at > new Date()
    ) {
      return true;
    }
    return false;
  }

  async challengeTwoStep(
    userId: bigint,
    method: TwoStepMethodEnum,
    code: string,
  ): Promise<boolean> {
    if (!AdminUserService.SUPPORT_TWO_STEP_METHOD.includes(method)) {
      throw new NotImplementedException(`不支持该验证类型`);
    }
    const itemConfig = await this.prisma.adminUserTwoStepSetting.findUnique({
      where: { user_id_method: { user_id: userId, method } },
    });
    if (!itemConfig || itemConfig.enabled != TwoStepEnabledEnum.OPEN) {
      throw new NotImplementedException(`您还未配置该项验证`);
    }
    let lock = null;
    try {
      lock = await this.redlockService
        .acquire([`lock`, `admin:challenge:${userId}`], 5000)
        .catch((error) => {
          this.logger.error(`获取锁失败userId:${userId}, error:${error}`);
        });
      if (!lock) {
        throw new InternalServerErrorException('服务器繁忙，请稍后再试！');
      }
      const user = await this.prisma.adminUser.findUnique({
        where: { id: userId, status: StatusEnum.NORMAL },
      });
      if (!user) {
        this.logger.error(`用户已经锁定或者不存在`);
        return false;
      }
      if (user.two_step_lock_until && user.two_step_lock_until > new Date()) {
        throw new ForbiddenException(
          `您已受到限制，请于 ${this.timeService.format_YYYMMDD_HHmmss(user.two_step_lock_until)} 后尝试`,
        );
      }
      if (
        method == TwoStepMethodEnum.TOTP &&
        authenticator.check(code, itemConfig.secret)
      ) {
        await this.resetTwoStepAttempts(userId);
        return true;
      }
      const two_step_attempts = await this.incrementTwoStepAttempts(userId);

      const lockTime = this.timeService.calculateLockTime(
        two_step_attempts,
        AdminUserService.BASE_LOCK_TIME,
      );
      if (lockTime > 0) {
        await this.blockUserTwoStepLockUntil(
          userId,
          new Date(Date.now() + lockTime),
        );
      }
      return false;
    } finally {
      lock?.release();
    }
  }

  async resetTwoStepAttempts(userId: bigint) {
    return this.prisma.adminUser.update({
      where: { id: userId },
      data: { two_step_attempts: 0 },
    });
  }

  async incrementTwoStepAttempts(userId: bigint): Promise<number> {
    const data = await this.prisma.adminUser.update({
      where: { id: userId },
      data: { two_step_attempts: { increment: 1 } },
    });
    return data.two_step_attempts;
  }

  async blockUserTwoStepLockUntil(userId: bigint, lockUntil: Date) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { two_step_lock_until: lockUntil },
    });
  }

  async getConfigTOTP(userId: bigint) {
    const setting = await this.prisma.adminUserTwoStepSetting.findUnique({
      where: {
        user_id_method: { user_id: userId, method: TwoStepMethodEnum.TOTP },
      },
    });
    return {
      method: TwoStepMethodEnum.TOTP,
      enabled: setting?.enabled || TwoStepEnabledEnum.NOT_YET,
      opened_at: setting?.opened_at,
    };
  }

  async configTOTP(
    userId: bigint,
    enabled: TwoStepEnabledEnum,
    token,
  ): Promise<boolean> {
    if (enabled == TwoStepEnabledEnum.OPEN) {
      if (_.trim(token).length === 0) {
        throw new BadRequestException('必须提供验证码');
      }
      const setting = await this.prisma.adminUserTwoStepSetting.findUnique({
        where: {
          user_id_method: { user_id: userId, method: TwoStepMethodEnum.TOTP },
        },
      });
      if (!setting || _.trim(setting.draft_box_secret).length === 0) {
        throw new BadRequestException('未初始化设置，请重新配置');
      }
      const isValid = authenticator.check(token, setting.draft_box_secret);
      if (!isValid) {
        throw new BadRequestException('令牌不匹配，请重新输入');
      }
      await this.prisma.adminUserTwoStepSetting.update({
        where: {
          user_id_method: {
            user_id: userId,
            method: TwoStepMethodEnum.TOTP,
          },
        },
        data: {
          secret: setting.draft_box_secret,
          draft_box_secret: '',
          enabled,
          opened_at: new Date(),
        },
      });
    } else {
      await this.prisma.adminUserTwoStepSetting.update({
        where: {
          user_id_method: {
            user_id: userId,
            method: TwoStepMethodEnum.TOTP,
          },
        },
        data: {
          enabled,
          opened_at: null,
        },
      });
    }
    return true;
  }

  async genTOTPRraftBoxSecret(userId: bigint): Promise<any> {
    const draft_box_secret = authenticator.generateSecret(20).toLowerCase();
    await this.prisma.adminUserTwoStepSetting.upsert({
      where: {
        user_id_method: { user_id: userId, method: TwoStepMethodEnum.TOTP },
      },
      update: {
        draft_box_secret,
      },
      create: {
        user_id: userId,
        method: TwoStepMethodEnum.TOTP,
        draft_box_secret,
        enabled: TwoStepEnabledEnum.NOT_YET,
      },
    });
    return { secret: draft_box_secret, digits };
  }

  async twoStepConfig(
    userId: bigint,
    two_step_enabled: TwoStepEnabledEnum,
  ): Promise<any> {
    let two_step_opened_at = null;
    if (TwoStepEnabledEnum.OPEN == two_step_enabled) {
      two_step_opened_at = new Date();
    }
    await this.prisma.adminUser.update({
      where: {
        id: userId,
      },
      data: {
        two_step_enabled,
        two_step_opened_at,
      },
    });
    return { two_step_enabled, two_step_opened_at };
  }

  async listOpenedTwoStepSetting(userId: bigint): Promise<any[]> {
    const data = await this.prisma.adminUserTwoStepSetting.findMany({
      where: { user_id: userId, enabled: TwoStepEnabledEnum.OPEN },
    });
    return data.map((it: AdminUserTwoStepSetting) => {
      return {
        method: it.method,
        prompt: '',
      };
    });
  }

  async listAllTwoStepSetting(userId: bigint): Promise<any[]> {
    const data = await this.prisma.adminUserTwoStepSetting.findMany({
      where: { user_id: userId },
    });
    const methodMap = new Map();
    data
      .filter((item) =>
        AdminUserService.SUPPORT_TWO_STEP_METHOD.includes(item.method),
      )
      .forEach((item) => methodMap.set(item.method, item));
    const rs = [];
    AdminUserService.SUPPORT_TWO_STEP_METHOD.forEach((method) => {
      if (methodMap.has(method)) {
        const item = methodMap.get(method);
        rs.push({
          method: item.method,
          enabled: item.enabled,
          opened_at: item.opened_at,
        });
      } else {
        rs.push({
          method,
          enabled: TwoStepEnabledEnum.NOT_YET,
          opened_at: null,
        });
      }
    });
    return rs;
  }

  async resetLoginAttempts(userId: bigint) {
    return this.prisma.adminUser.update({
      where: { id: userId },
      data: { login_attempts: 0 },
    });
  }

  async incrementLoginAttempts(userId: bigint): Promise<number> {
    const data = await this.prisma.adminUser.update({
      where: { id: userId },
      data: { login_attempts: { increment: 1 } },
    });
    return data.login_attempts;
  }

  async blockUserLockUntil(userId: bigint, lockUntil: Date) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { lock_until: lockUntil },
    });
  }

  async updateUserStatus(userId: bigint, status: StatusEnum) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { status: status },
    });
  }

  async generateUserTwoStepToken(
    userId: bigint,
    expiredSeconds: number,
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.adminUserTwoStepToken.upsert({
      where: {
        user_id: userId,
      },
      update: {
        token,
        expires_at: new Date(Date.now() + expiredSeconds * 1000),
      },
      create: {
        user_id: userId,
        token,
        expires_at: new Date(Date.now() + expiredSeconds * 1000),
      },
    });
    return token;
  }

  async createAdminUser(username: string, password: string): Promise<bigint> {
    const exist = await this.prisma.adminUser.findUnique({
      where: { name: username },
    });

    if (exist) {
      throw new UnprocessableEntityException('用户名称重复');
    }
    const hash = await this.encryption.hashPassword(password);
    const user = await this.prisma.adminUser.create({
      data: {
        name: username,
        password: hash,
        status: StatusEnum.NORMAL,
      },
    });
    if (user) {
      return user.id;
    }
    return null;
  }

  async changePassword(
    userId: bigint,
    password: string,
  ): Promise<AdminUser | undefined> {
    const hash = await this.encryption.hashPassword(password);
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { password: hash, password_changed_at: new Date() },
    });
    return null;
  }
}
