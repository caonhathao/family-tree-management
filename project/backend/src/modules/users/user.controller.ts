import {
  Controller,
  Param,
  Query,
  UseGuards,
  Body,
  Get,
  UseInterceptors,
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
import { CustomFileExtensionValidator } from 'src/common/validators/file-type.validator';
import {
  AuthLogListResponse,
  UserListResponse,
  UserProvidersResponse,
  UserResponse,
} from './types/user-response.type';
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
          new CustomFileExtensionValidator({
            allowedExtensions: ['.jpg', '.jpeg', '.webp'],
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<UserResponse> {
    const user = await this.userService.update(id, userId, data, file);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers(
    @GetCurrentUserId() userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: string,
    @Query('filterType') filterType?: string,
  ): Promise<UserListResponse> {
    const users = await this.userService.getAll(
      userId,
      page,
      limit,
      filter,
      filterType,
    );
    return ResponseFactory.success({
      data: users,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@GetCurrentUserId() userId: string): Promise<UserResponse> {
    const user = await this.userService.get(userId, userId, 'self');
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':targetId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'targetId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUser(
    @Param('targetId') id: string,
    @GetCurrentUserId() userId: string,
    @Query('type') type?: string,
  ): Promise<UserResponse> {
    const user = await this.userService.get(id, userId, type);
    return ResponseFactory.success({
      data: user,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':targetId/auth-providers')
  @ApiOperation({ summary: 'Get all linked auth providers of user' })
  @ApiParam({ name: 'targetId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuthProviders(
    @Param('targetId') id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<UserProvidersResponse> {
    const providers = await this.userService.getAuthProviders(id, userId);
    return ResponseFactory.success({
      data: providers,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':targetId/auth-logs')
  @ApiOperation({ summary: 'Get all auth logs of user' })
  @ApiParam({ name: 'targetId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Auth logs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuthLogs(
    @Param('targetId') id: string,
    @GetCurrentUserId() userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<AuthLogListResponse> {
    const logs = await this.userService.getAuthLogs(id, userId, page, limit);
    return ResponseFactory.success({
      data: logs,
      message: ValidMessageResponse.GETTED,
    });
  }
}
