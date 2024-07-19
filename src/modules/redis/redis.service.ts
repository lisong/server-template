import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { redisOptionsProvider } from 'src/common/app-options.provider';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClient;

  constructor(@Inject(redisOptionsProvider.provide) private readonly options) {}

  onModuleInit() {
    this.redisClient = new Redis(this.options);
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }

  async get(key: string): Promise<string> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  // 其他 Redis 操作方法
}
