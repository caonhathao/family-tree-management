import {
  Controller,
  Param,
  UseGuards,
  Body,
  Get,
  UseInterceptors,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 2;

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUser(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
    @Body() data: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const user = await this.userService.update(id, userId, data, file);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(@Param('id') id: string) {
    const user = await this.userService.get(id);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.GETTED,
    });
  }
}
