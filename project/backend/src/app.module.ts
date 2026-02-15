import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { envValidationSchema } from './common/config/env/env';
import config from './common/config/env/config';
import { FamilyModule } from './modules/family/family.module';
import { EnvConfigModule } from './common/config/env/env-config.module';

import { CloudinaryModule } from './common/config/cloudinary/cloudinary.module';
import { GroupFamilyModule } from './modules/group-family/group-family.module';
import { UserModule } from './modules/users/user.module';
import { GroupMemberModule } from './modules/group-members/group-members.module';
import { InviteModule } from './modules/invite/invite.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './schedule/task-schedule.module';
import { PassportModule } from '@nestjs/passport';
import { HealthCheckModule } from './modules/health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env'],
      load: [config],
      validationSchema: envValidationSchema,
    }),
    EnvConfigModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    FamilyModule,
    CloudinaryModule,
    GroupFamilyModule,
    UserModule,
    GroupMemberModule,
    InviteModule,
    TaskModule,
    PassportModule,
    HealthCheckModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
