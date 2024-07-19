import { IsEnum, IsString } from 'class-validator';
import { TwoStepMethodEnum } from 'src/common/enums-defined';

export class CheckTwoStepDTO {
  /**
   * 两步验证类型
   */
  @IsEnum(TwoStepMethodEnum)
  method: TwoStepMethodEnum;
  /**
   * 验证码
   */
  @IsString()
  code: string;
}
