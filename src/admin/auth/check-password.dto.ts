import { IsString, Length } from 'class-validator';

export class CheckPasswordDTO {
  /**
   * 密码
   */
  @Length(6)
  @IsString()
  password: string;
}
