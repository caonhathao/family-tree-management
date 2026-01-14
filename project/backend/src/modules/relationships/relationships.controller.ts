import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RelationshipService } from './relationships.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { RelationshipCreateDto } from './dto/create-relationships.dto';
import { RelationshipUpdateDto } from './dto/update-relationship.dto';

@Controller('relationship')
@UseGuards(AtGuard, RolesGuard)
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipService) {}

  @Post()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async createRelationship(
    @GetCurrentUserId() userId: string,
    @Body() relationshipDto: RelationshipCreateDto,
  ) {
    const relationship = await this.relationshipsService.create(
      userId,
      relationshipDto,
    );
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Put(':id')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async updateRelationship(
    @GetCurrentUserId() userId: string,
    @Param('id') relationshipId: string,
    @Body() relationshipUpdateDto: RelationshipUpdateDto,
  ) {
    const relationship = await this.relationshipsService.update(
      userId,
      relationshipId,
      relationshipUpdateDto,
    );
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Delete(':id/:familyId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async deleteRelationship(
    @GetCurrentUserId() userId: string,
    @Param('id') relationshipId: string,
    @Param('familyId') familyId: string,
  ) {
    const relationship = await this.relationshipsService.delete(
      userId,
      relationshipId,
      familyId,
    );
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.DELETED,
    });
  }
}
