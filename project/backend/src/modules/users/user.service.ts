import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Exception } from 'src/common/messages/messages.response';
import * as bcrypt from 'bcrypt';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { Prisma } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private envConfig: EnvConfigService,
  ) {}

  async update(
    targetId: string,
    userId: string,
    data: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    if (!targetId) throw new ForbiddenException(Exception.ID_MISSING);
    if (targetId !== userId) throw new ForbiddenException(Exception.PEMRISSION);

    const profileUpdate: Prisma.UserProfileUpdateInput = {};
    const userUpdate: Prisma.UserUpdateInput = {};
    const accountUpdate: Prisma.AccountUpdateInput = {};

    if (data.fullName) profileUpdate.fullName = data.fullName;
    if (data.biography)
      try {
        const parsed =
          typeof data.biography === 'string'
            ? (JSON.parse(data.biography) as JsonValue)
            : data.biography;
        profileUpdate.biography = parsed as Prisma.InputJsonValue;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        throw new BadRequestException('Biography format is invalid JSON');
      }
    if (data.dateOfBirth)
      profileUpdate.dateOfBirth = new Date(data.dateOfBirth);

    if (data.email) userUpdate.email = data.email;

    if (data.password) {
      accountUpdate.password = await bcrypt.hash(data.password, 10);
    }

    if (file) {
      const upload: UploadApiResponse | UploadApiErrorResponse =
        await this.cloudinaryService.uploadFile(
          file,
          this.envConfig.folderFamilyName,
        );
      if ('secure_url' in upload && upload.secure_url) {
        profileUpdate.avatar = upload.secure_url as string;
      } else {
        throw new BadRequestException(Exception.UPLOAD_FAILED);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const userProfileResult = await tx.userProfile.update({
        where: { userId: targetId },
        data: profileUpdate,
        select: {
          fullName: true,
          avatar: true,
          biography: true,
          dateOfBirth: true,
        },
      });
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: targetId }, data: userUpdate });
      }
      if (Object.keys(accountUpdate).length > 0) {
        await tx.account.update({
          where: { userId: targetId },
          data: accountUpdate,
        });
      }
      return userProfileResult;
    });
  }

  async get(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
            dateOfBirth: true,
            biography: true,
          },
        },
      },
    });
  }
}
