import { AdminMenu } from '@prisma/clientAuthDB';
import { RedlockService } from '@anchan828/nest-redlock';
import { Injectable } from '@nestjs/common';
import { StatusEnum } from 'src/common/enums-defined';
import { PrismaAuthDBService } from 'src/modules/prisma/prisma-auth_db';
import * as _ from 'lodash';
import { match } from 'path-to-regexp';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaAuthDBService,
    private readonly redlockService: RedlockService,
  ) {}

  buildTree(items: AdminMenu[], parentId: bigint = BigInt(0)) {
    return items
      .filter((item) => item.parent_id === BigInt(parentId))
      .map((item) => ({
        id: Number(item.id),
        name: item.name,
        link: item.link,
        icon: item.icon,
        children: this.buildTree(items, item.id),
      }));
  }

  async getUserMenuFormat(userId: bigint) {
    const menu = await this.getUserMenu(userId);
    return this.buildTree(menu);
  }

  async getUserMenu(userId: bigint) {
    const rolesMap = await this.prisma.adminUserRole.findMany({
      where: { user_id: userId },
    });
    if (rolesMap.length > 0) {
      const roles = await this.prisma.adminRole.findMany({
        where: {
          id: {
            in: rolesMap.map((it) => BigInt(it.role_id)),
          },
          status: StatusEnum.NORMAL,
        },
      });
      const roleIds = roles.map((it) => BigInt(it.id));
      if (roleIds.length) {
        const permission = await this.prisma.adminPermission.findMany({
          where: {
            role_id: {
              in: roleIds,
            },
          },
        });
        const menuIds = _.uniq(permission.map((it) => it.menu_id));
        const allMenu = await this.getAllMenuFromCatch();
        return allMenu.filter((it) => menuIds.includes(it.id));
      }
    }
    return [];
  }

  async getAllMenuFromCatch() {
    return await this.getAllMenu();
  }

  async getAllMenu() {
    return await this.prisma.adminMenu.findMany({
      where: {
        status: StatusEnum.NORMAL,
      },
    });
  }

  async getAllApiRouter() {
    return await this.prisma.adminApiRouter.findMany({
      where: {
        status: StatusEnum.NORMAL,
      },
    });
  }

  async getAllMenuApiRouterBindMap() {
    return await this.prisma.adminMenuApiRouterBindMap.findMany();
  }

  async getAllApiRouterFromCatch() {
    return await this.getAllApiRouter();
  }

  async getAllMenuApiRouterBindMapFromCatch() {
    return await this.getAllMenuApiRouterBindMap();
  }

  /**
   * 获取用户可访问的api列表
   */
  async getUserApiRouter(userId: bigint) {
    const menuIds = (await this.getUserMenu(userId)).map((it) => it.id);
    const apiIds = (await this.getAllMenuApiRouterBindMapFromCatch())
      .filter((it) => menuIds.includes(it.api_id))
      .map((it) => it.api_id);
    return (await this.getAllApiRouterFromCatch()).filter((it) =>
      apiIds.includes(it.id),
    );
  }

  async checkPermission(userId: bigint, method: string, path: string) {
    const apiInfoList = (await this.getUserApiRouter(userId)).filter(
      (it) => _.lowerCase(it.method) == _.lowerCase(method),
    );
    for (const apiInfo of apiInfoList) {
      const fn = match(apiInfo.path, { decode: decodeURIComponent });
      if (fn(path) !== false) {
        return true;
      }
    }
    return false;
  }
}
