// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfigModule } from 'src/common/config/env/env-config.module';
import { AtStrategy, RtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [JwtModule.register({}), EnvConfigModule],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
