import { Controller, Param, Put, UseGuards, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/auth.guard';
import { UserServices } from './user.service';
import { UserUpdateDto } from './dto/update-user.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AtGuard)
export class UserController {
  constructor(private readonly userServices: UserServices) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUser(@Param('id') id: string, @Body() data: UserUpdateDto) {
    const user = await this.userServices.update(id, data);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(@Param('id') id: string) {
    const user = await this.userServices.get(id);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.GETTED,
    });
  }
}
