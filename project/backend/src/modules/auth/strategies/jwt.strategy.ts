import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';
import { EnvConfigService } from 'src/common/config/env/env-config.service';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(envConfigService: EnvConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        envConfigService.jwtAccessKey ||
        process.env.JWT_ACCESS_SECRET_KEY ||
        '',
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(envConfigService: EnvConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        envConfigService.jwtRefreshKey ||
        process.env.JWT_REFRESH_SECRET_KEY ||
        '',
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: JwtPayload) {
    const refreshToken = (req.headers.authorization || '')
      .replace('Bearer ', '')
      .trim();

    // console.log('payload:', payload);
    return {
      ...payload,
      refreshToken,
    };
  }
}
