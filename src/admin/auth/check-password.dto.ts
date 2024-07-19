import { IsString } from 'class-validator';

export class CheckPasswordDTO {
  /**
   * 密码
   */
  @IsString()
  password: string;
}
