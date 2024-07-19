import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaAuthDBService } from './prisma-auth_db';

@Module({
  providers: [PrismaService, PrismaAuthDBService],
  exports: [PrismaService, PrismaAuthDBService],
})
export class PrismaModule {}
