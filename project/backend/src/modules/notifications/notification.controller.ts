import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications fetched successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllNotifications(
    @GetCurrentUserId() userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    const result = await this.notificationService.findAll(userId, query);
    return ResponseFactory.paginated({
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markNotificationAsRead(
    @GetCurrentUserId() userId: string,
    @Param('id') notificationId: string,
  ) {
    const result = await this.notificationService.markAsRead(
      userId,
      notificationId,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllNotificationsAsRead(
    @GetCurrentUserId() userId: string,
    @Query() query: QueryNotificationsDto,
  ) {
    const count = await this.notificationService.markAllAsRead(userId, query);
    return ResponseFactory.success({
      data: { count },
      message: ValidMessageResponse.UPDATED,
    });
  }
}
