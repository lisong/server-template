import { Module } from '@nestjs/common';
import { TimeService } from './time.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [TimeService],
  exports: [TimeService],
})
export class TimeModule {}
