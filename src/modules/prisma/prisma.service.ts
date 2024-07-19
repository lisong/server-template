import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    // prisma 不支持时区设置只能使用UTC，避免和mysql时区不一致，每次将会话时区设置为UTC
    await this.$queryRaw`SET time_zone = '+00:00';`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
