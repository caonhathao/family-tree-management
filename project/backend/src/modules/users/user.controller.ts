import { Controller, Param, Put, UseGuards, Body } from '@nestjs/common';
import { AtGuard } from '../auth/guards/auth.guard';
import { UserServices } from './user.services';
import { UserUpdateDto } from './dto/update-user.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';

@Controller('users')
@UseGuards(AtGuard)
export class UserController {
  constructor(private readonly userServices: UserServices) {}

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: UserUpdateDto) {
    const user = await this.userServices.update(id, data);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.CREATED,
    });
  }
}
