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
  get maxFileSize(): number {
    return this.configService.getOrThrow<number>('maxFileSize');
  }
  get folderAlbumName(): string {
    return this.configService.getOrThrow<string>('cloudinary.folderAlbum');
  }
  get folderUserName(): string {
    return this.configService.getOrThrow<string>('cloudinary.folderUser');
  }
  get folderFamilyName(): string {
    return this.configService.getOrThrow<string>('cloudinary.folderFamily');
  }
  get cloudinaryApiKey(): string {
    return this.configService.getOrThrow<string>('cloudinary.apiKey');
  }
  get cloudinaryApiSecret(): string {
    return this.configService.getOrThrow<string>('cloudinary.apiSecret');
  }
  get cloudinaryUrl(): string {
    return this.configService.getOrThrow<string>('cloudinary.url');
  }
  get cloudinaryName(): string {
    return this.configService.getOrThrow<string>('cloudinary.cloudName');
  }
  get domain(): string {
    return this.configService.getOrThrow<string>('DOMAIN');
  }
}
