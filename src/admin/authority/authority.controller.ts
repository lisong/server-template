import { RedlockService } from '@anchan828/nest-redlock';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AdminUserService } from 'src/modules/admin-user/admin-user.service';
import * as _ from 'lodash';
import { AuthorityService } from './authority.service';
import { RoleChangeDTO } from './role-change.dto';

@Controller('admin/authority')
export class AuthorityController {
  constructor(
    private adminUserService: AdminUserService,
    private readonly redlockService: RedlockService,
    private authorityService: AuthorityService,
  ) {}

  @Get('user/list')
  async userList(@Request() req, @Query() params) {
    const pagination = await this.adminUserService.pagination(
      _.defaultTo(Number(params.page), 1),
      _.defaultTo(Number(params.pageSize), 20),
    );
    const userIds = pagination.items.map((it) => BigInt(it.id));
    const roleMap = await this.authorityService.getUserRole(userIds);
    return {
      ...pagination,
      items: pagination.items.map((item) => {
        return { ...item, role: roleMap[item.id] || [] };
      }),
    };
  }

  @Post('user/create')
  async userCreate(@Request() req, @Body() params) {
    if (!params.username || params.username.length < 4) {
      throw new UnprocessableEntityException('用户名至少4个字符');
    }
    if (!params.password || params.password.length < 6) {
      throw new UnprocessableEntityException('密码长度不能小于6个字符');
    }
    const userId = await this.adminUserService.createAdminUser(
      params.username,
      params.password,
    );
    return Number(userId);
  }

  @Post('user/change')
  async userChange(@Request() req, @Body() params) {
    const userId = _.defaultTo(parseInt(params.userId), 0);
    if (userId <= 0) {
      throw new UnprocessableEntityException('用户id必须是数字');
    }
    const exist = await this.adminUserService.findById(userId);
    if (!exist) {
      throw new UnprocessableEntityException('用户不存在');
    }
    if (params.status) {
      await this.adminUserService.updateUserStatus(exist.id, params.status);
    }
    return true;
  }

  @Get('role/list')
  async roleList(@Request() req, @Query() params) {
    const pagination = await this.authorityService.paginationRole(
      _.defaultTo(Number(params.page), 1),
      _.defaultTo(Number(params.pageSize), 20),
    );
    return pagination;
  }

  @Post('role/create')
  async roleCreate(@Request() req, @Body() params) {
    if (!params.name || params.name.length < 2) {
      throw new UnprocessableEntityException('角色名称至少2个字符');
    }
    const roleId = await this.authorityService.createRole(
      params.name,
      params.description,
    );
    return Number(roleId);
  }

  @Post('role/change')
  async roleChange(@Request() req, @Body() params: RoleChangeDTO) {
    const roleId = _.defaultTo(parseInt(params.roleId), 0);
    if (roleId <= 0) {
      throw new UnprocessableEntityException('角色ID必须是数字');
    }
    const exist = await this.authorityService.findRoleById(roleId);
    if (!exist) {
      throw new UnprocessableEntityException('角色不存在');
    }
    return await this.authorityService.updateRole(exist.id, params);
  }
}
