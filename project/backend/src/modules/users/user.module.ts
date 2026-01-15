import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserServices } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserServices],
})
export class UserModule {}
