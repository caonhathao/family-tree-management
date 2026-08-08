import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { EventService } from './event.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';

@ApiTags('event')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'Create an event (OWNER/EDITOR only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEvent(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateEventDto,
  ) {
    const result = await this.eventService.create(userId, dto);
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List events of a group (or all my groups)' })
  @ApiResponse({ status: 200, description: 'Events fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllEvents(
    @GetCurrentUserId() userId: string,
    @Query() query: QueryEventsDto,
  ) {
    const result = await this.eventService.findAll(userId, query);
    return ResponseFactory.paginated({
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event detail' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event detail fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEvent(
    @GetCurrentUserId() userId: string,
    @Param('id') eventId: string,
  ) {
    const result = await this.eventService.getById(userId, eventId);
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':id/instances')
  @ApiOperation({ summary: 'List occurrences (instances) of an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Instances fetched successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEventInstances(
    @GetCurrentUserId() userId: string,
    @Param('id') eventId: string,
    @Query() query: QueryEventsDto,
  ) {
    const result = await this.eventService.listInstances(
      userId,
      eventId,
      query,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event (OWNER/EDITOR only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateEvent(
    @GetCurrentUserId() userId: string,
    @Param('id') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    const result = await this.eventService.update(userId, eventId, dto);
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Patch(':id/instances/:instanceId')
  @ApiOperation({ summary: 'Cancel an occurrence (OWNER/EDITOR only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiParam({ name: 'instanceId', description: 'Instance ID' })
  @ApiResponse({ status: 200, description: 'Instance updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event or instance not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelInstance(
    @GetCurrentUserId() userId: string,
    @Param('id') eventId: string,
    @Param('instanceId') instanceId: string,
  ) {
    const result = await this.eventService.cancelInstance(
      userId,
      eventId,
      instanceId,
    );
    return ResponseFactory.success({
      data: result,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event (OWNER/EDITOR only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteEvent(
    @GetCurrentUserId() userId: string,
    @Param('id') eventId: string,
  ) {
    await this.eventService.remove(userId, eventId);
    return ResponseFactory.success({
      message: ValidMessageResponse.DELETED,
    });
  }
}
