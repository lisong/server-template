import { RedlockModule } from '@anchan828/nest-redlock';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  CustomConfigModuleOptions,
  CustomThrottlerAsyncOptions,
  RedisCacheOptions,
  RedlockOptions,
} from 'src/common/app-options.constants';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from './encryption.service';
import { TimeModule } from '../time/time.module';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync(CustomThrottlerAsyncOptions),
    CacheModule.registerAsync(RedisCacheOptions),
    ConfigModule.forRoot(CustomConfigModuleOptions),
    RedlockModule.registerAsync(RedlockOptions),
    RedisModule,
    PrismaModule,
    TimeModule,
  ],
  providers: [EncryptionService],
  exports: [
    RedlockModule,
    ThrottlerModule,
    CacheModule,
    ConfigModule,
    RedisModule,
    PrismaModule,
    EncryptionService,
    TimeModule,
  ],
})
export class CommonModule {}
