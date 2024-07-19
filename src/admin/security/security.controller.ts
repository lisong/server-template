import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  PreconditionFailedException,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthSecurityGuard } from '../guards/admin-jwt-auth-security.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminUserService } from 'src/modules/admin-user/admin-user.service';
import {
  TwoStepEnabledEnum,
  TwoStepMethodEnum,
} from 'src/common/enums-defined';
import { AddTwoStepDTO } from './add-two-step.dto';
import { authenticator } from 'otplib';
import { ChangePasswordDTO } from './change-password.dto';
import { AuthService } from '../auth/auth.service';

@Public()
@UseGuards(AdminJwtAuthSecurityGuard)
@Controller('admin/security')
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(
    private adminUserService: AdminUserService,
    private authService: AuthService,
  ) {}

  /**
   * 开启关闭两步验证
   */
  @Post('two-step/config')
  async twoStepConfig(@Request() req: { user: any }, @Body() param) {
    const userId = req.user.id;
    if (param.two_step_enabled === true) {
      return await this.adminUserService.twoStepConfig(
        userId,
        TwoStepEnabledEnum.OPEN,
      );
    } else if (param.two_step_enabled === false) {
      return await this.adminUserService.twoStepConfig(
        userId,
        TwoStepEnabledEnum.CLOSE,
      );
    }
  }

  /**
   * 单项两步验证配置
   */
  @Post('two-step/item/config')
  async twoStepItemConfig(
    @Request() req: { user: any },
    @Body() param: AddTwoStepDTO,
  ) {
    if (!AdminUserService.SUPPORT_TWO_STEP_METHOD.includes(param.method)) {
      throw new PreconditionFailedException('method类型不支持');
    }

    const userId = req.user.id;
    if (param.method == TwoStepMethodEnum.TOTP) {
      await this.adminUserService.configTOTP(
        userId,
        param.enabled,
        param.verifyCode,
      );
    }
    return true;
  }

  /**
   * 获取配置项信息
   */
  @Get('two-step/item/config')
  async getTwoStepItemConfig(@Request() req: { user: any }, @Query() params) {
    const userId = req.user.id;
    if (params.method == TwoStepMethodEnum.TOTP) {
      return await this.adminUserService.getConfigTOTP(userId);
    }
    return {};
  }

  /**
   * totp 两步验证生成密码-放置临时草稿箱
   */
  @Post('two-step/totp/draft-box-secret')
  async twoStepItemSecret(@Request() req: { user: any }) {
    const useId = req.user.id;
    const { secret, digits } =
      await this.adminUserService.genTOTPRraftBoxSecret(useId);
    const qrcode = authenticator.keyuri(req.user.name, 'cms', secret);
    return { qrcode, secret, digits };
  }

  /**
   * 修改密码
   */
  @Post('password/change')
  async passwordChange(
    @Request() req: { user: any },
    @Body() param: ChangePasswordDTO,
  ) {
    const useId = req.user.id;
    await this.authService.changePassword(
      useId,
      param.currentPassword,
      param.newPassword,
    );
    return true;
  }
}
