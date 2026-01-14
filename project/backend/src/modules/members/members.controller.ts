import {
  Body,
  Controller,
  FileTypeValidator,
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
import { AtGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { MemberService } from './members.service';
import { USER_ROLE } from '@prisma/client';
import { MemberDto } from './dto/create-members.dto';
import { ResponseFactory } from 'src/common/factories/response.factory';
import { ValidMessageResponse } from 'src/common/messages/messages.response';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MemberUpdateDto } from './dto/update-members.dto';

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 2;
@Controller('member')
@UseGuards(AtGuard, RolesGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @UseInterceptors(FileInterceptor('avatar'))
  async createMember(
    @Body() data: MemberDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const member = await this.memberService.create(data, file);
    return ResponseFactory.success({
      data: member,
      message: ValidMessageResponse.CREATED,
    });
  }
  @Patch()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMember(
    @Body() data: MemberUpdateDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * maxFileSize }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const member = await this.memberService.update(data, file);
    return ResponseFactory.success({
      data: member,
      message: ValidMessageResponse.UPDATED,
    });
  }

  @Get(':id')
  async getOne(@Param('id') memberId: string) {
    const data = await this.memberService.getOne(memberId);
    return ResponseFactory.success({
      data: data,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Get(':familyId')
  async getAll(@Param('familyId') familyId: string) {
    const data = await this.memberService.getAll(familyId);
    return ResponseFactory.success({
      data: data,
      message: ValidMessageResponse.GETTED,
    });
  }

  @Delete(':id')
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  async remove(@Param('id') memberId: string) {
    await this.memberService.remove(memberId);
    return ResponseFactory.success({
      data: null,
      message: ValidMessageResponse.DELETED,
    });
  }
}
