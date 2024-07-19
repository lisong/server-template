import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersCommandModule } from './commands/users.module';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { AdminModule } from './admin/admin.module';
import { ClientsModule } from './clients/clients.module';
import { CommonModule } from './modules/common/common.module';
import { APP_GUARD } from '@nestjs/core';
import { GlobalBasedGuard } from './global-based.guard';
import { JwtAuthGuard } from './clients/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from './admin/guards/admin-jwt-auth.guard';
@Module({
  imports: [CommonModule, UsersCommandModule, AdminModule, ClientsModule],
  controllers: [AppController],
  providers: [
    AppService,
    AdminJwtAuthGuard,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: GlobalBasedGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // 为所有路由应用 LoggerMiddleware
  }
}
