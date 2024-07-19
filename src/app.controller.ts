import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller()
export class AppController {
  @UseGuards(ThrottlerGuard)
  @Public()
  @Get(['csrf/token', 'admin/csrf/token', 'clients/csrf/token'])
  async csrfToken(): Promise<any> {
    // CsrfInterceptor 自动下发
    return {};
  }
}
