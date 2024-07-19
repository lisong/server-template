import { AdminRole } from '@prisma/clientAuthDB';
import { RedlockService } from '@anchan828/nest-redlock';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaAuthDBService } from 'src/modules/prisma/prisma-auth_db';
import { TimeService } from 'src/modules/time/time.service';
import { StatusEnum } from 'src/common/enums-defined';

@Injectable()
export class AuthorityService {
  constructor(
    private prisma: PrismaAuthDBService,
    private readonly timeService: TimeService,
    private readonly redlockService: RedlockService,
  ) {}

  async updateRoleStatus(roleId: bigint, status: StatusEnum) {
    await this.prisma.adminRole.update({
      where: { id: roleId },
      data: { status: status },
    });
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
