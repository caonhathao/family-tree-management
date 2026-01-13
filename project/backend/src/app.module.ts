import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { envValidationSchema } from './common/env/env';
import config from './common/config/config';
import { EnvConfigService } from './common/config/env-config.service';
import { EnvConfigModule } from './common/config/env-config.module';
import { FamilyModule } from './modules/family/family.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [config],
      validationSchema: envValidationSchema,
    }),
    EnvConfigModule,
    PrismaModule,
    AuthModule,
    FamilyModule,
  ],
  controllers: [AppController],
  providers: [AppService, EnvConfigService],
  exports: [EnvConfigService],
})
export class AppModule {}
