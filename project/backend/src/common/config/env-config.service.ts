import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService {
  constructor(private configService: ConfigService) {}
  get post(): number {
    return this.configService.getOrThrow<number>('port');
  }
  get database(): string {
    return this.configService.getOrThrow<string>('database.url');
  }
  get jwtAccessKey(): string {
    return this.configService.getOrThrow<string>('jwt.accessSecret');
  }
  get jwtRefreshKey(): string {
    return this.configService.getOrThrow<string>('jwt.refreshSecret');
  }
  get accessExpires(): number {
    return this.configService.getOrThrow<number>('jwt.accessExpires');
  }
  get refreshExpires(): number {
    return this.configService.getOrThrow<number>('jwt.refreshExpires');
  }
}
