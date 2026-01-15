import { Controller, Post, UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { AtGuard } from '../auth/guards/auth.guard';

@Controller('invite')
@UseGuards(AtGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}
  @Post()
  async createInvite(
    @GetCurrentUserId() userId: string,
    data: CreateInviteDto,
  ) {
    const invite = await this.inviteService.createInvite(userId, data);
    return ResponseFactory.success({
      data: invite,
      message: ValidMessageResponse.CREATED,
    });
  }
}
