import {
  Body,
  Controller,
  Post,
  UseGuards,
  Param,
  Get,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { FamilyDto, IFamilyDto } from './dto/create-family.dto';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AtGuard } from '../auth/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('family')
@ApiBearerAuth()
@Controller('family')
@UseGuards(AtGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post('/sync-data/:groupId')
  @UseGuards(AtGuard)
  @Roles('EDITOR', 'OWNER')
  @ApiOperation({ summary: 'Sync family data' })
  @ApiParam({ name: 'groupId', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Family data synced successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async syncFamilyData(
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Body() data: FamilyDto,
  ) {
    const syncFamily = await this.familyService.syncFamilyData(
      userId,
      groupId,
      data,
    );
    return ResponseFactory.success({
      data: syncFamily,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':groupId')
  @Roles('EDITOR', 'OWNER', 'VIEWER')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Get family data' })
  @ApiParam({ name: 'groupId', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Family data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFamilyData(
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
  ) {
    const familyData = await this.familyService.getFamilyData(userId, groupId);
    return ResponseFactory.success({
      data: familyData,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Put(':groupId')
  @Roles('OWNER', 'EDITOR')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Get family data' })
  @ApiParam({ name: 'groupId', description: 'Group family ID' })
  @ApiResponse({
    status: 200,
    description: 'Family data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateFamilyInfo(
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Body() data: IFamilyDto,
  ) {
    const familyData = await this.familyService.updateFamilyInfo(
      userId,
      groupId,
      data,
    );
    return ResponseFactory.success({
      data: familyData,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Delete(':groupId/:familyId')
  @Roles('OWNER', 'EDITOR')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Delete family data' })
  @ApiParam({ name: 'groupId', description: 'Group family ID' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: 200,
    description: 'Family data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFamilyData(
    @GetCurrentUserId() userId: string,
    @Param('groupId') groupId: string,
    @Param('familyId') familyId: string,
  ) {
    const familyData = await this.familyService.deleteFamilyData(
      userId,
      groupId,
      familyId,
    );
    return ResponseFactory.success({
      data: familyData,
      message: ValidMessageResponse.UPDATED,
    });
  }
}
