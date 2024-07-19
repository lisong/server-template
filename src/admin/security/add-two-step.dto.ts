import { IsEnum, IsOptional } from 'class-validator';
import {
  TwoStepEnabledEnum,
  TwoStepMethodEnum,
} from 'src/common/enums-defined';

export class AddTwoStepDTO {
  /**
   * 两步验证类型
   */
  @IsEnum(TwoStepMethodEnum)
  method: TwoStepMethodEnum;

  /**
   *  是否开启
   */
  @IsEnum(TwoStepEnabledEnum)
  enabled: TwoStepEnabledEnum;

  /**
   * 验证码
   */
  @IsOptional()
  verifyCode: string;
}
