import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Exception } from 'src/common/messages/messages.response';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import { Prisma, USER_ROLE } from '@prisma/client';
import { isUUID } from 'class-validator';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import {
  AuthLogListData,
  AuthProviderData,
  UserListData,
  UserResponseData,
} from './types/user-response.type';

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
  ): Promise<UserResponseData> {
    console.log('data in update user service:', data);
    console.log('file in user update serivce:', file);
    if (!isUUID(targetId)) throw new NotFoundException(Exception.NOT_EXIST);
    if (targetId !== userId) throw new ForbiddenException(Exception.PEMRISSION);

    const profileUpdate: Prisma.UserProfileUpdateInput = {};
    const userUpdate: Prisma.UserUpdateInput = {};

    if (data.fullName) profileUpdate.fullName = data.fullName;
    if (data.biography) profileUpdate.biography = data.biography;
    if (data.memorableName !== undefined)
      profileUpdate.memorableName = data.memorableName;
    if (data.address !== undefined) profileUpdate.address = data.address;
    if (data.dateOfBirth) {
      const date = new Date(data.dateOfBirth);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Định dạng ngày tháng không hợp lệ');
      } else {
        profileUpdate.dateOfBirth = date;
      }
    }

    if (file) {
      const upload: UploadApiResponse | UploadApiErrorResponse =
        await this.cloudinaryService.uploadFile(
          file,
          this.envConfig.folderUserName,
        );
      if ('secure_url' in upload && upload.secure_url) {
        profileUpdate.avatar = upload.secure_url as string;
      } else {
        throw new BadRequestException(Exception.UPLOAD_FAILED);
      }
    }
    try {
      const result = await this.prisma.$transaction(async (tx) => {
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

        let userResult: { email: string } | null;
        if (Object.keys(userUpdate).length > 0) {
          userResult = await tx.user.update({
            where: { id: targetId },
            data: userUpdate,
            select: { email: true },
          });
        } else {
          userResult = await tx.user.findUnique({
            where: { id: targetId },
            select: { email: true },
          });
        }

        return {
          id: targetId,
          email: userResult?.email,
          userProfile: {
            ...userProfileResult,
            dateOfBirth: userProfileResult.dateOfBirth?.toISOString() ?? null,
          },
        };
      });

      return result;
    } catch (err) {
      console.log('transaction failed at update user: ', err);
      throw err;
    }
  }

  async get(
    targetId: string,
    userId: string,
    type = 'self',
  ): Promise<UserResponseData> {
    // console.log(targetId, userId);
    if (!isUUID(targetId, 'all'))
      throw new NotFoundException(Exception.NOT_EXIST);

    if (type === 'self') {
      if (targetId !== userId) {
        throw new NotFoundException(Exception.NOT_EXIST);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          userProfile: {
            select: {
              fullName: true,
              memorableName: true,
              avatar: true,
              address: true,
              dateOfBirth: true,
              biography: true,
              gender: true,
            },
          },
        },
      });

      if (!user) throw new NotFoundException(Exception.NOT_EXIST);
      if (!user.userProfile) throw new NotFoundException(Exception.NOT_EXIST);

      const [groups, invites] = await this.prisma.$transaction([
        this.prisma.groupFamily.count({
          where: {
            groupMembers: {
              some: {
                memberId: userId,
              },
            },
          },
        }),
        this.prisma.invite.count({
          where: {
            targetId: userId,
            expiresAt: {
              gt: new Date(),
            },
          },
        }),
      ]);

      return {
        id: user.id,
        email: user.email,
        userProfile: {
          ...user.userProfile,
          dateOfBirth: user.userProfile.dateOfBirth?.toISOString() ?? null,
        },
        groups,
        invites,
      };
    } else if (type === 'target') {
      const target = await this.prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          email: true,
          userProfile: {
            select: {
              fullName: true,
              memorableName: true,
              avatar: true,
              address: true,
              dateOfBirth: true,
              biography: true,
              gender: true,
            },
          },
        },
      });

      if (!target) throw new NotFoundException(Exception.NOT_EXIST);
      if (!target.userProfile) throw new NotFoundException(Exception.NOT_EXIST);

      return {
        id: target.id,
        email: target.email,
        userProfile: {
          ...target.userProfile,
          dateOfBirth: target.userProfile.dateOfBirth?.toISOString() ?? null,
        },
      };
    } else {
      throw new BadRequestException(Exception.BAD_REQUEST);
    }
  }

  async getAll(
    userId: string,
    page?: number,
    limit?: number,
    filter?: string,
    filterType?: string,
  ): Promise<UserListData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new NotFoundException(Exception.NOT_EXIST);
    if (user.role !== USER_ROLE.ADMIN)
      throw new ForbiddenException(Exception.PEMRISSION);

    const whereClause: Prisma.UserWhereInput = {};
    if (filter && filterType) {
      if (filterType === 'id') {
        if (!isUUID(filter))
          throw new BadRequestException(Exception.ID_INVALID);
        whereClause.id = filter;
      }
      if (filterType === 'email') {
        whereClause.email = { contains: filter, mode: 'insensitive' };
      }
    }

    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * pageSize;

    const [totalCount, listUser] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          userProfile: {
            select: { fullName: true, avatar: true },
          },
          createdAt: true,
        },
        skip: skip,
        take: pageSize,
        orderBy: { id: 'asc' },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: listUser,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: currentPage,
        pageSize: pageSize,
      },
    };
  }

  async getAuthProviders(
    targetId: string,
    userId: string,
  ): Promise<AuthProviderData[]> {
    if (!isUUID(targetId, 'all'))
      throw new BadRequestException(Exception.ID_INVALID);
    if (targetId !== userId) throw new ForbiddenException(Exception.PEMRISSION);

    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        accounts: {
          select: {
            authProvider: {
              select: {
                accountId: true,
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException(Exception.NOT_EXIST);

    return user.accounts.map((value) => {
      return {
        id: value.authProvider?.accountId,
        provider: value.authProvider?.provider,
      };
    });
  }

  async getAuthLogs(
    targetId: string,
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<AuthLogListData> {
    if (!isUUID(targetId, 'all'))
      throw new BadRequestException(Exception.ID_INVALID);
    if (targetId !== userId) throw new ForbiddenException(Exception.PEMRISSION);

    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * pageSize;

    const [totalCount, logs] = await this.prisma.$transaction([
      this.prisma.authLog.count({ where: { userId: targetId } }),
      this.prisma.authLog.findMany({
        where: { userId: targetId },
        select: {
          id: true,
          accountId: true,
          authBy: true,
          type: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: logs,
      pagination: {
        currentPage: currentPage,
        totalItems: totalCount,
        pageSize: pageSize,
        totalPages: totalPages,
      },
    };
  }
}
