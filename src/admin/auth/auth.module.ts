import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AdminJwtStrategy } from './admin.jwt.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUserModule } from 'src/modules/admin-user/admin-user.module';
import { AdminLocalStrategy } from './admin.local.strategy';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [
    AdminUserModule,
    MenuModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ADMIN_COOKIE_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ADMIN_COOKIE_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AdminLocalStrategy, AdminJwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
