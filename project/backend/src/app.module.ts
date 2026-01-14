import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { envValidationSchema } from './common/config/env/env';
import config from './common/config/env/config';
import { EnvConfigService } from './common/config/env/env-config.service';
import { FamilyModule } from './modules/family/family.module';
import { EnvConfigModule } from './common/config/env/env-config.module';
import { MemberModule } from './modules/members/members.module';
import { CloudinaryModule } from './common/config/cloudinary/cloudinary.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: '.env',
      load: [config],
      validationSchema: envValidationSchema,
    }),
    EnvConfigModule,
    PrismaModule,
    AuthModule,
    FamilyModule,
    MemberModule,
    CloudinaryModule,
    RelationshipsModule,
  ],
  controllers: [AppController],
  providers: [AppService, EnvConfigService],
  exports: [EnvConfigService],
})
export class AppModule {}
