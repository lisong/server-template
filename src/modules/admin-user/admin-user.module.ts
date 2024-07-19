import { Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';

@Module({
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
