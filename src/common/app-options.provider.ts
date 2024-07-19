import { ConfigService } from '@nestjs/config';

export const redisOptionsProvider = {
  provide: 'REDIS_OPTIONS',
  useFactory: (configService: ConfigService) => ({
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
    password: configService.get<string>('REDIS_PASSWORD'),
  }),
  inject: [ConfigService],
};
