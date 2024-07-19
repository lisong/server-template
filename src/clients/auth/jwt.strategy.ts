import { FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.createExtractor(configService),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('COOKIE_TOKEN_SECRET'),
    });
  }

  private static createExtractor(configService: ConfigService) {
    const authTokenKey = configService.get<string>('COOKIE_AUTH_NAME');
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

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
