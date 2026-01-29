import {
  Body,
  Controller,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { MemberService } from './family-members.service';
import { USER_ROLE } from '@prisma/client';
import { MemberDto } from './dto/create-members.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MemberUpdateDto } from './dto/update-members.dto';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 2;
@ApiTags('family-member')
@ApiBearerAuth()
@Controller('family-member')
@UseGuards(AtGuard, RolesGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post(':groupId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.VIEWER)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Create a new family member' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        familyId: { type: 'string', description: 'Family ID' },
        fullName: { type: 'string', description: 'Member full name' },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Member gender',
        },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          description: 'Date of birth',
        },
        dateOfDeath: {
          type: 'string',
          format: 'date',
          description: 'Date of death (optional)',
        },
        isAlive: { type: 'boolean', description: 'Is member alive' },
        biography: {
          type: 'string',
          description: 'Member biography (optional)',
        },
        generation: { type: 'number', description: 'Generation number' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Member avatar image (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMember(
    @Body() data: MemberDto,
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const member = await this.memberService.create(userId, groupId, data, file);
    return ResponseFactory.success({
      data: member,
      message: ValidMessageResponse.CREATED,
    });
  }
  @Patch(':groupId/:familyId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update a family member' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', description: 'Member full name' },
        gender: {
          type: 'string',
          enum: ['MALE', 'FEMALE', 'OTHER'],
          description: 'Member gender',
        },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          description: 'Date of birth',
        },
        dateOfDeath: {
          type: 'string',
          format: 'date',
          description: 'Date of death',
        },
        isAlive: { type: 'boolean', description: 'Is member alive' },
        biography: { type: 'string', description: 'Member biography' },
        generation: { type: 'number', description: 'Generation number' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Member avatar image (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMember(
    @Body() data: MemberUpdateDto,
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Param('familyId') familyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    console.log(`familyIdL ${familyId}`);
    const member = await this.memberService.update(
      userId,
      groupId,
      familyId,
      data,
      file,
    );
    return ResponseFactory.success({
      data: member,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':familyId/:memberId')
  @ApiOperation({ summary: 'Get a family member by ID' })
  @ApiParam({ name: 'familyId', description: 'family ID' })
  @ApiParam({
    name: 'memberId',
    description: 'Member ID in family (not group member)',
  })
  @ApiResponse({ status: 200, description: 'Member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOne(
    @GetCurrentUserId() userId: string,
    @Param('memberId') memberId: string,
    @Param('familyId') familyId: string,
  ) {
    const data = await this.memberService.getOne(userId, familyId, memberId);
    return ResponseFactory.success({
      data: data,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':familyId')
  @ApiOperation({ summary: 'Get all family members by family ID' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Family not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAll(
    @Param('familyId') familyId: string,
    @GetCurrentUserId() userId: string,
  ) {
    const data = await this.memberService.getAll(userId, familyId);
    return ResponseFactory.success({
      data: data,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Delete(':groupId/:familyId/:memberId')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @ApiOperation({ summary: 'Delete a family member' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async remove(
    @GetCurrentUserId() userId: string,
    @Param('memberId') memberId: string,
    @Param('familyId') familyId: string,
    @Param('groupId') groupId: string,
  ) {
    await this.memberService.remove(userId, memberId, familyId, groupId);
    return ResponseFactory.success({
      data: null,
      message: ValidMessageResponse.DELETED,
    });
  }
}
