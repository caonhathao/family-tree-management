import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RelationshipService } from './relationships.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from '@prisma/client';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { RelationshipCreateDto } from './dto/create-relationships.dto';
import { RelationshipUpdateDto } from './dto/update-relationship.dto';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';

@ApiTags('relationship')
@ApiBearerAuth()
@Controller('relationship')
@UseGuards(AtGuard, RolesGuard)
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipService) {}

  @Post(':groupId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Create a new relationship' })
  @ApiResponse({
    status: 201,
    description: 'Relationship created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRelationship(@Body() relationshipDto: RelationshipCreateDto) {
    const relationship =
      await this.relationshipsService.create(relationshipDto);
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Get(':groupId/:familyId')
  @ApiOperation({ summary: 'Get all relationship' })
  @ApiResponse({
    status: 200,
    description: 'Get all relationships successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRelationshipMap(
    @GetCurrentUserId() userId: string,
    @Param('familyId') familyId: string,
    @Param('groupId') groupId: string,
  ) {
    const relationships = await this.relationshipsService.getRelationshipMap(
      userId,
      familyId,
      groupId,
    );
    return ResponseFactory.success({
      data: relationships,
      message: ValidMessageResponse.CREATED,
    });
  }

  @Patch(':groupId/:relationshipId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Update a relationship' })
  @ApiParam({ name: 'relationshipId', description: 'Relationship ID' })
  @ApiResponse({
    status: 200,
    description: 'Relationship updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateRelationship(
    @Param('relationshipId') relationshipId: string,
    @Body() relationshipUpdateDto: RelationshipUpdateDto,
  ) {
    const relationship = await this.relationshipsService.update(
      relationshipId,
      relationshipUpdateDto,
    );
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Delete(':groupId/:familyId/:relationshipId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Delete a relationship' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiParam({ name: 'relationshipId', description: 'Relationship ID' })
  @ApiResponse({
    status: 200,
    description: 'Relationship deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteRelationship(
    @Param('relationshipId') relationshipId: string,
    @Param('familyId') familyId: string,
  ) {
    const relationship = await this.relationshipsService.delete(
      relationshipId,
      familyId,
    );
    return ResponseFactory.success({
      data: relationship,
      message: ValidMessageResponse.DELETED,
    });
  }
}
