import { Module } from '@nestjs/common';
import { AuthorityController } from './authority.controller';
import { AuthorityService } from './authority.service';
import { AdminUserModule } from 'src/modules/admin-user/admin-user.module';

@Module({
  imports: [AdminUserModule],
  controllers: [AuthorityController],
  providers: [AuthorityService],
})
export class AuthorityModule {}
