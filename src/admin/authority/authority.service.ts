import { AdminRole } from '@prisma/clientAuthDB';
import { RedlockService } from '@anchan828/nest-redlock';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaAuthDBService } from 'src/modules/prisma/prisma-auth_db';
import { TimeService } from 'src/modules/time/time.service';
import { StatusEnum } from 'src/common/enums-defined';
import * as _ from 'lodash';

@Injectable()
export class AuthorityService {
  constructor(
    private prisma: PrismaAuthDBService,
    private readonly timeService: TimeService,
    private readonly redlockService: RedlockService,
  ) {}
  async getUserRole(userIds: bigint[]) {
    if (userIds.length <= 0) {
      return [];
    }
    const roleMapList = await this.prisma.adminUserRole.findMany({
      where: { user_id: { in: userIds } },
    });
    const roleIds = roleMapList.map((it) => it.role_id);
    if (roleIds.length > 0) {
      const roleInfoList = await this.prisma.adminRole.findMany({
        where: { id: { in: roleIds } },
      });
      const roleInfoMap = roleInfoList.reduce((acc, item) => {
        acc[String(item.id)] = item;
        return acc;
      }, {});
      return roleMapList.reduce((acc, item) => {
        if (!acc[String(item.user_id)]) {
          acc[String(item.user_id)] = [];
        }
        acc[String(item.user_id)].push({
          roleId: String(item.role_id),
          name: roleInfoMap[String(item.role_id)]?.name || item.role_id,
          status: roleInfoMap[String(item.role_id)]?.status || 0,
        });
        return acc;
      }, {});
    }
    return [];
  }
  async updateRole(roleId: bigint, params: any) {
    params = _.omitBy(params, _.isNull);
    params = _.omit(params, ['roleId']);
    await this.prisma.adminRole.update({
      where: { id: roleId },
      data: params,
    });
    return params;
  }

  async findRoleById(roleId: bigint): Promise<AdminRole | undefined> {
    if (!roleId || roleId <= 0) {
      return null;
    }
    return this.prisma.adminRole.findUnique({ where: { id: roleId } });
  }

  async paginationRole(page: number, pageSize: number) {
    const total = await this.prisma.adminRole.count();
    let items = [];
    if (total > 0) {
      items = await this.prisma.adminRole.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      });
    }

    return {
      total,
      items: items.map((it: AdminRole) => {
        return {
          ...it,
          id: Number(it.id),
        };
      }),
      page,
      pageSize,
    };
  }

  async createRole(name: string, description: string): Promise<bigint> {
    const exist = await this.prisma.adminRole.findUnique({
      where: { name: name },
    });

    if (exist) {
      throw new UnprocessableEntityException('角色名称重复');
    }
    const user = await this.prisma.adminRole.create({
      data: {
        name: name,
        description,
        status: StatusEnum.NORMAL,
      },
    });
    if (user) {
      return user.id;
    }
    return null;
  }
}
