import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TimeService {
  constructor(private readonly configService: ConfigService) {
    dayjs.tz.setDefault(
      this.configService.get<string>('TIME_ZONE', 'Asia/Shanghai'),
    );
  }

  getCurrentTime(): string {
    return dayjs().tz().format();
  }

  formatDate(date: Date): string {
    return dayjs(date).tz().format();
  }

  parseDate(dateString: string): Date {
    return dayjs.tz(dateString).toDate();
  }

  format_YYYMMDD_HHmmss(date: Date): string {
    return dayjs(date).tz().format('YYYY-MM-DD HH:mm:ss');
  }

  calculateLockTime(attempts: number, baseLockTime: number): number {
    const MAX_ATTEMPTS = 3;
    if (attempts <= MAX_ATTEMPTS) {
      return 0;
    }
    return baseLockTime * (Math.pow(2, attempts - MAX_ATTEMPTS) - 1);
  }
}
