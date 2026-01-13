import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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

const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 2;
@Controller('member')
@UseGuards(AtGuard, RolesGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles(USER_ROLE.EDITOR, USER_ROLE.OWNER)
  @UseInterceptors(FileInterceptor('avatar'))
  async createMember(
    @Body() memberDto: MemberDto,
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
    const member = await this.memberService.create(memberDto, file);
    return ResponseFactory.success({
      data: member,
      message: ValidMessageResponse.CREATED,
    });
  }
}
