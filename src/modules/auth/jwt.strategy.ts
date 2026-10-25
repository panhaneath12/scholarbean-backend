import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'scholarbean-dev-jwt-secret-key-32charsmin!',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid authentication token');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
