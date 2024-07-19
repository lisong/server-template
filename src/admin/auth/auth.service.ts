import { AdminUser } from '@prisma/clientAuthDB';
import { RedlockService } from '@anchan828/nest-redlock';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StatusEnum } from 'src/common/enums-defined';
import { AdminUserService } from 'src/modules/admin-user/admin-user.service';
import { EncryptionService } from 'src/modules/common/encryption.service';
import { TimeService } from 'src/modules/time/time.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly BASE_LOCK_TIME = 5 * 60 * 1000; // 1 分钟，以毫秒为单位

  constructor(
    private adminUserService: AdminUserService,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
    private readonly timeService: TimeService,
    private readonly redlockService: RedlockService,
  ) {}

  async changePassword(
    userId: bigint,
    oldPass: string,
    newPass: string,
  ): Promise<boolean> {
    console.log('newPass', newPass);
    if (!newPass || newPass.length < 6) {
      throw new UnauthorizedException(
        '新密码长度至少6位',
        'passwordLengthError',
      );
    }
    const isMatch = await this.checkUserPasswordById(userId, oldPass);
    if (!isMatch) {
      throw new UnauthorizedException('原始密码不正确', 'passwordNotMatch');
    }
    await this.adminUserService.changePassword(userId, newPass);
    return true;
  }

  async checkUserPasswordById(
    userId: bigint,
    pass: string,
  ): Promise<AdminUser | null> {
    let lock = null;
    try {
      lock = await this.redlockService
        .acquire([`lock`, `admin:auth2:${userId}`], 5000)
        .catch((error) => {
          this.logger.error(
            `验证用户密码获取锁失败username:${userId}, error:${error}`,
          );
        });
      if (!lock) {
        throw new InternalServerErrorException('服务器繁忙，请稍后再试！');
      }
      const user = await this.adminUserService.findById(userId);
      if (user) {
        return await this.checkUserPassword(user, pass);
      }
    } finally {
      lock?.release();
    }
    return null;
  }

  async checkUserPassword(user: AdminUser, pass: string): Promise<any> {
    if (user.lock_until && user.lock_until > new Date()) {
      throw new ForbiddenException(
        `账号已临时锁定，请于 ${this.timeService.format_YYYMMDD_HHmmss(user.lock_until)} 后尝试`,
      );
    }
    const isMatch = await this.encryptionService.comparePassword(
      pass,
      user.password,
    );
    if (isMatch) {
      await this.adminUserService.resetLoginAttempts(user.id);
      if (user.status == StatusEnum.NORMAL) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user; // 结构隐藏password 应用中传递
        return result;
      } else {
        throw new ForbiddenException('账号已经锁定！');
      }
    } else {
      const login_attempts = await this.adminUserService.incrementLoginAttempts(
        user.id,
      );
      const lockTime = this.timeService.calculateLockTime(
        login_attempts,
        AuthService.BASE_LOCK_TIME,
      );
      if (lockTime > 0) {
        await this.adminUserService.blockUserLockUntil(
          user.id,
          new Date(Date.now() + lockTime),
        );
      }
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    let lock = null;
    try {
      lock = await this.redlockService
        .acquire([`lock`, `admin:auth:${username}`], 5000)
        .catch((error) => {
          this.logger.error(
            `验证用户密码获取锁失败username:${username}, error:${error}`,
          );
        });
      if (!lock) {
        throw new InternalServerErrorException('服务器繁忙，请稍后再试！');
      }
      const user = await this.adminUserService.findByName(username);
      if (user) {
        return await this.checkUserPassword(user, pass);
      }
    } finally {
      lock?.release();
    }
    return null;
  }

  async login(userId: bigint, username: string, needTwoStep: boolean) {
    const payload = {
      id: Number(userId),
      name: username,
      role: 'admin',
      temporary: needTwoStep,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async checkTemporaryToken(userId: bigint, input: string): Promise<boolean> {
    return await this.adminUserService.checkTemporaryToken(userId, input);
  }

  /**
   * 校验用户状态 单点登录 等是否有效
   */
  async checkUserEveryRequest(userId: bigint): Promise<boolean> {
    const user = await this.adminUserService.findByIdFromCache(userId);
    if (user.status === StatusEnum.NORMAL) {
      return true;
    }
    return false;
  }
}
