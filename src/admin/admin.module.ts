import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { AuthorityModule } from './authority/authority.module';
import { MenuModule } from './menu/menu.module';
@Module({
  controllers: [],
  imports: [AuthModule, SecurityModule, MenuModule, AuthorityModule],
  providers: [],
})
export class AdminModule {}
