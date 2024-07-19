import { MenuService } from './../menu/menu.service';
import { FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'adminJwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly menuService: MenuService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AdminJwtStrategy.createExtractor(configService),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ADMIN_COOKIE_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  private static createExtractor(configService: ConfigService) {
    const authTokenKey = configService.get<string>('ADMIN_COOKIE_AUTH_NAME');
    if (authTokenKey && authTokenKey != '') {
      return (req: FastifyRequest): string | null => {
        if (
          req.cookies &&
          authTokenKey in req.cookies &&
          req.cookies[authTokenKey].length > 0
        ) {
          return req.cookies[authTokenKey];
        }
        return null;
      };
    }
  }

  async validate(req: Request, payload: any) {
    if (payload.role != 'admin') {
      throw new UnauthorizedException(`登录用户非后台用户，请重新登陆`);
    }
    const supportTemporary = req['supportTemporary'];
    if (!supportTemporary && payload.temporary) {
      throw new UnauthorizedException(`临时授权无法访问所有功能`);
    }

    if (supportTemporary && payload.temporary) {
      // 临时授权还需要校验token是否有效
      const isValid = await this.authService.checkTemporaryToken(
        payload.id,
        req['token'],
      );
      if (!isValid) {
        throw new UnauthorizedException(
          `token已失效，请重新登陆`,
          'redirect-login',
        );
      }
      return payload;
    }

    const supportSecurity = req['supportSecurity'];
    const loginExp = Date.now() / 1000 - payload.iat;
    if (supportSecurity) {
      if (loginExp > 30 * 60) {
        throw new UnauthorizedException(
          `需要密码登录重新验证`,
          'challenge-password',
        );
      }
      return payload;
    }
    // 校验用户信息
    const checkUser = await this.authService.checkUserEveryRequest(payload.id);
    if (!checkUser) {
      throw new UnauthorizedException(`用户登录过期`, 'redirect-login');
    }

    const supportAllowed = req['supportAllowed'];
    if (supportAllowed) {
      // 无需校验菜单权限
      return payload;
    }
    const url: string = req.url || '';
    const uri = url.split('?')[0];
    // 校验菜单权限
    const check = await this.menuService.checkPermission(
      payload.id,
      req.method,
      uri,
    );
    if (!check) {
      throw new UnauthorizedException(`无权限访问`, 'no-menu-privilege');
    }
    return payload;
  }
}
