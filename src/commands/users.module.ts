import { Module } from '@nestjs/common';
import { UsersCommand } from './users.command';

@Module({
  providers: [UsersCommand],
})
export class UsersCommandModule {}
