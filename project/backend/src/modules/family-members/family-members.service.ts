import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MemberDto } from './dto/create-members.dto';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { MemberUpdateDto } from './dto/update-members.dto';
import { Exception } from 'src/common/messages/messages.response';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private envConfig: EnvConfigService,
  ) {}
  async create(
    userId: string,
    groupId: string,
    data: MemberDto,
    file?: Express.Multer.File,
  ) {
    //check group exist
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: groupId,
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);

    let avatarUrl: string = '';
    if (file) {
      const upload: UploadApiResponse | UploadApiErrorResponse =
        await this.cloudinaryService.uploadFile(
          file,
          this.envConfig.folderFamilyName,
        );

      if (upload.secure_url) avatarUrl = upload.secure_url as string;
    } else throw new NotFoundException(Exception.FILE_BUFFER_MISSING);

    if (avatarUrl === '')
      throw new BadRequestException(Exception.UPLOAD_FAILED);

    const newMember = await this.prisma.familyMember.create({
      data: {
        ...data,
        avatarUrl: avatarUrl,
      },
      select: {
        id: true,
        fullName: true,
        generation: true,
        isAlive: true,
        avatarUrl: true,
      },
    });

    return newMember;
  }
  async update(
    userId: string,
    groupId: string,
    data: MemberUpdateDto,
    file?: Express.Multer.File,
  ) {
    //check user authorization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    //check if user is in group that have family member or not
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        family: {
          groupFamilyId: groupId,
        },
      },
    });

    if (!group) throw new NotFoundException(Exception.NOT_EXIST);

    let avatarUrl: string = '';
    //check if form has file (image), destroy old image and upload new
    const member = await this.prisma.familyMember.findFirst({
      where: {
        id: data.id,
      },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    if (!member) {
      throw new ForbiddenException(Exception.ID_MISSING);
    }
    if (file) {
      if (member.avatarUrl !== null) {
        const resultDestroy: { result: string } =
          await this.cloudinaryService.destroyFile(
            member.avatarUrl,
            this.envConfig.folderFamilyName,
          );

        if (resultDestroy.result === 'ok') {
          const upload: UploadApiResponse | UploadApiErrorResponse =
            await this.cloudinaryService.uploadFile(
              file,
              this.envConfig.folderFamilyName,
            );

          if (upload.secure_url) avatarUrl = upload.secure_url as string;
        }
      }
    } else throw new NotFoundException(Exception.FILE_BUFFER_MISSING);

    if (avatarUrl === '')
      throw new BadRequestException(Exception.UPLOAD_FAILED);
    const updateData = Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null),
    );

    return await this.prisma.familyMember.update({
      where: { id: data.id },
      data: { ...updateData, avatarUrl: avatarUrl },
      select: {
        id: true,
        fullName: true,
        generation: true,
        isAlive: true,
        avatarUrl: true,
      },
    });
  }

  async getOne(userId: string, familyId: string, memberId: string) {
    //check user authorization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    //check if user is in group that have family member or not
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        family: {
          id: familyId,
        },
      },
    });

    if (!group) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    const data = await this.prisma.familyMember.findFirst({
      where: {
        id: memberId,
      },
      select: {
        id: true,
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        gender: true,
        dateOfBirth: true,
        dateOfDeath: true,
        isAlive: true,
        avatarUrl: true,
        biography: true,
        generation: true,
        relationshipsFrom: {
          select: {
            fromMember: {
              select: {
                id: true,
                fullName: true,
              },
            },
            type: true,
          },
        },
        relationshipsTo: {
          select: {
            toMember: {
              select: {
                id: true,
                fullName: true,
              },
            },
            type: true,
          },
        },
      },
    });
    return data;
  }
  async getAll(userId: string, familyId: string) {
    //check user authorization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    //check if user is in group that have family member or not
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        family: {
          id: familyId,
        },
      },
    });

    if (!group) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }

    return await this.prisma.familyMember.findMany({
      where: {
        familyId: familyId,
      },
      select: {
        id: true,
        fullName: true,
        isAlive: true,
        avatarUrl: true,
      },
    });
  }
  async remove(userId: string, memberId: string, familyId: string) {
    //check user authorization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException(Exception.UNAUTHORIZED);
    }

    //check if user is in group that have family member or not
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        family: {
          id: familyId,
        },
      },
    });

    if (!group) {
      throw new ForbiddenException(Exception.PEMRISSION);
    }
    const member = await this.prisma.familyMember.findFirst({
      where: { id: memberId, familyId: familyId },
    });
    if (!member) {
      throw new ForbiddenException(Exception.NOT_EXIST);
    }
    return await this.prisma.familyMember.delete({
      where: { id: memberId, familyId: familyId },
    });
  }
}
