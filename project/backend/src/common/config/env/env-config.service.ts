import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService {
  constructor(private configService: ConfigService) {}
  get post(): number {
    return (
      this.configService?.get<number>('port') ||
      Number(process.env.PORT) ||
      3000
    );
  }
  get database(): string {
    return (
      this.configService?.get<string>('database.url') ||
      process.env.DATABASE_URL ||
      ''
    );
  }
  get jwtAccessKey(): string {
    return (
      this.configService?.get<string>('jwt.accessSecret') ||
      process.env.JWT_ACCESS_SECRET_KEY ||
      ''
    );
  }
  get jwtRefreshKey(): string {
    return (
      this.configService?.get<string>('jwt.refreshSecret') ||
      process.env.JWT_REFRESH_SECRET_KEY ||
      ''
    );
  }
  get accessExpires(): number {
    return (
      this.configService?.get<number>('jwt.accessExpires') ||
      Number(process.env.ACCESS_TOKEN_EXPIRES_IN) ||
      900
    );
  }
  get refreshExpires(): number {
    return (
      this.configService?.get<number>('jwt.refreshExpires') ||
      Number(process.env.JWT_ACCESS_SECRET_KEY) ||
      604800
    );
  }
  get maxFileSize(): number {
    return (
      this.configService?.get<number>('maxFileSize') ||
      Number(process.env.MAX_FILE_SIZE) ||
      2
    );
  }
  get folderAlbumName(): string {
    return (
      this.configService?.get<string>('cloudinary.folderAlbum') ||
      process.env.FOLDER_ALBUM ||
      'album'
    );
  }
  get folderUserName(): string {
    return (
      this.configService?.get<string>('cloudinary.folderUser') ||
      process.env.FOLDER_USER ||
      'user'
    );
  }
  get folderFamilyName(): string {
    return (
      this.configService?.get<string>('cloudinary.folderFamily') ||
      process.env.FOLDER_FAMILY ||
      'family'
    );
  }
  get cloudinaryApiKey(): string {
    return (
      this.configService?.get<string>('cloudinary.apiKey') ||
      process.env.CLOUDINARY_API_KEY ||
      ''
    );
  }
  get cloudinaryApiSecret(): string {
    return (
      this.configService?.get<string>('cloudinary.apiSecret') ||
      process.env.CLOUDINARY_API_SECRET ||
      ''
    );
  }
  get cloudinaryUrl(): string {
    return (
      this.configService?.get<string>('cloudinary.url') ||
      process.env.CLOUDINARY_URL ||
      ''
    );
  }
  get cloudinaryName(): string {
    return (
      this.configService?.get<string>('cloudinary.cloudName') ||
      process.env.CLOUDINARY_NAME ||
      ''
    );
  }
  get serverDomain(): string {
    return (
      this.configService?.get<string>('domain.serverDomain') ||
      process.env.SERVER_DOMAIN ||
      ''
    );
  }
  get clientDomain(): string {
    return (
      this.configService?.get<string>('domain.clientDomain') ||
      process.env.CLIENT_DOMAIN ||
      ''
    );
  }
  get googleClientId(): string {
    return (
      this.configService?.get<string>('google.clientId') ||
      process.env.GOOGLECLIENT_ID ||
      ''
    );
  }
  get allEnvVariables() {
    return {
      port: this.post,
      database: this.database,
      jwtAccessKey: this.jwtAccessKey,
      jwtRefreshKey: this.jwtRefreshKey,
      accessExpires: this.accessExpires,
      refreshExpires: this.refreshExpires,
      maxFileSize: this.maxFileSize,
      folderAlbumName: this.folderAlbumName,
      folderUserName: this.folderUserName,
      folderFamilyName: this.folderFamilyName,
      cloudinaryApiKey: this.cloudinaryApiKey,
      cloudinaryApiSecret: this.cloudinaryApiSecret,
      cloudinaryUrl: this.cloudinaryUrl,
      cloudinaryName: this.cloudinaryName,
      serverDomain: this.serverDomain,
      clientDomain: this.clientDomain,
      googleClientId: this.googleClientId,
    };
  }
}
