import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { StatusEnum } from 'src/common/enums-defined';

export class RoleChangeDTO {
  /**
   * 角色id
   */
  @IsPositive()
  @IsNumber()
  roleId: string;

  /**
   * 状态
   */
  @IsOptional()
  @IsEnum(StatusEnum)
  status: StatusEnum;

  /**
   * 名称
   */
  @Length(2)
  @IsOptional()
  @IsString()
  name: string;

  /**
   * 描述
   */
  @IsOptional()
  @Length(1, 100)
  @IsString()
  description: string;
}
