import { Body, Controller, Post, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { FamilyDto } from './dto/create-family.dto';
import { GetCurrentUserId } from 'src/common/decorators/get-user-id.decorator';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AtGuard } from '../auth/guards/auth.guard';

@ApiTags('family')
@ApiBearerAuth()
@Controller('family')
@UseGuards(AtGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post('/sync-data/:groupId')
  @UseGuards(AtGuard)
  @ApiOperation({ summary: 'Sync family data' })
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
}
