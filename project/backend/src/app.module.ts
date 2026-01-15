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
import { MemberModule } from './modules/family-members/family-members.module';
import { CloudinaryModule } from './common/config/cloudinary/cloudinary.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';
import { GroupFamilyModule } from './modules/group-family/group-family.module';
import { UserModule } from './modules/users/user.module';
import { GroupMemberModule } from './modules/group-member/group-member.module';
import { InviteModule } from './modules/invite/invite.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './schedule/task-schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: '.env',
      load: [config],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    EnvConfigModule,
    PrismaModule,
    AuthModule,
    FamilyModule,
    MemberModule,
    CloudinaryModule,
    RelationshipsModule,
    GroupFamilyModule,
    UserModule,
    GroupMemberModule,
    InviteModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService, EnvConfigService],
  exports: [EnvConfigService],
})
export class AppModule {}
