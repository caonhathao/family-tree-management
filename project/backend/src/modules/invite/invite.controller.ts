import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';
import { HttpStatus } from 'src/common/constants/api';
import {
  InviteInfoResponse,
  InviteResponse,
} from './types/invite-response.type';

@ApiTags('invite')
@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post()
  @ApiBearerAuth()
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInvite(
    @GetCurrentUserId() userId: string,
    @Body() data: CreateInviteDto,
  ): Promise<InviteResponse> {
    const invite = await this.inviteService.createInvite(userId, data);
    return ResponseFactory.success({
      data: invite,
      code: HttpStatus.CREATED,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get group info by invitation token' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Group info retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Invitation expired' })
  async getInviteInfo(
    @Param('token') token: string,
  ): Promise<InviteInfoResponse> {
    const info = await this.inviteService.getInviteInfo(token);
    return ResponseFactory.success({
      data: info,
      message: ValidMessageResponse.GETTED,
    });
  }
}
