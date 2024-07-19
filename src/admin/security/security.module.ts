import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { AdminUserModule } from 'src/modules/admin-user/admin-user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AdminUserModule, AuthModule],
  controllers: [SecurityController],
})
export class SecurityModule {}
