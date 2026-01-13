//Verify the validity of the JWT in the requests sent from the frontend after a successful login.
// src/modules/auth/strategies/at.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { Request } from 'express';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(envConfig: EnvConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envConfig.jwtAccessKey,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(envConfig: EnvConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envConfig.jwtRefreshKey,
      passReqToCallback: true,
    });
  }
  validate(req: Request, payload: JwtPayload) {
    const refreshToken = (req.headers.authorization || '')
      .replace('Bearer ', '')
      .trim();

    console.log('payload:', payload);
    return {
      ...payload,
      refreshToken,
    };
  }
}
