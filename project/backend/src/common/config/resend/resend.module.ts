import { Module } from '@nestjs/common';
import { ResendService } from './resend.service';
import { EnvConfigModule } from '../env/env-config.module';

@Module({
  imports: [EnvConfigModule],
  providers: [ResendService],
  exports: [ResendService],
})
export class ResendModule {}
