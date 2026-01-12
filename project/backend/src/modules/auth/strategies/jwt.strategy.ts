//Verify the validity of the JWT in the requests sent from the frontend after a successful login.
// src/modules/auth/strategies/at.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { EnvConfigService } from 'src/common/config/env-config.service';

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
