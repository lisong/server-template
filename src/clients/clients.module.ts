import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

@Module({
  controllers: [],
  imports: [AuthModule],
  providers: [],
})
export class ClientsModule {}
