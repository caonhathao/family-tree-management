import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';
import { HttpStatus } from 'src/common/constants/api';

@ApiTags('invite')
@ApiBearerAuth()
@Controller('invite')
@UseGuards(AtGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post()
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInvite(
    @GetCurrentUserId() userId: string,
    @Body() data: CreateInviteDto,
  ) {
    const invite = await this.inviteService.createInvite(userId, data);
    return ResponseFactory.success({
      data: invite,
      code: HttpStatus.CREATED,
      message: ValidMessageResponse.CREATED,
    });
  }
}
