import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { redisOptionsProvider } from 'src/common/app-options.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, redisOptionsProvider],
  exports: [RedisService],
})
export class RedisModule {}
