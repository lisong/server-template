import { RedlockModuleOptions } from '@anchan828/nest-redlock';
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigurableModuleAsyncOptions } from '@nestjs/common';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import { ThrottlerAsyncOptions } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-yet';
import { Redis } from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

export const RedisCacheOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      url: configService.get<string>('REDIS_URL'),
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};

export const RedlockOptions: ConfigurableModuleAsyncOptions<
  RedlockModuleOptions,
  'create'
> = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    // See https://github.com/mike-marcacci/node-redlock#configuration
    clients: [new Redis(configService.get<string>('REDIS_URL'))],
    settings: {
      driftFactor: 0.01,
      retryCount: 1,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    },
    // Default duration to use with Redlock decorator
    duration: 1000,
  }),
  inject: [ConfigService],
};

export const CustomConfigModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  envFilePath: ['.env.development.local', '.env'],
};

export const CustomThrottlerAsyncOptions: ThrottlerAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    throttlers: [
      {
        ttl: configService.get('THROTTLE_TTL'),
        limit: configService.get('THROTTLE_LIMIT'),
      },
    ],
    storage: new ThrottlerStorageRedisService(
      configService.get<string>('REDIS_URL'),
    ),
  }),
};
