import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { UpdateUserInfoDto } from "./user.service-validator";
import { Exception } from "@/lib/messages/response.messages";
import { IResponseUserDto, IUserList } from "./user.dto";
import { validate as isUUID } from "uuid";
import { validator } from "../_common/validator";

export const UserService = {
  updateUserInfo: async (
    targetId: string,
    userId: string,
    data: UpdateUserInfoDto,
  ) => {
    if (!isUUID(targetId) || !isUUID(userId)) {
      throw new Error(Exception.ID_INVALID);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true },
    });

    if (targetId !== userId) {
      throw new Error("Permission denied");
    }

    if (!target) throw new Error(Exception.NOT_EXIST);

    const profileUpdate: Prisma.UserProfileUpdateInput = {};

    if (data.fullName) profileUpdate.fullName = data.fullName;
    if (data.biography) {
      try {
        profileUpdate.biography = data.biography;
      } catch (e) {
        console.log("Biography format is invalid JSON: ", e);
        throw new Error("Biography format is invalid JSON");
      }
    }
    if (data.dateOfBirth) {
      const date = new Date(data.dateOfBirth);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      } else {
        profileUpdate.dateOfBirth = date;
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const userProfileResult = await tx.userProfile.update({
          where: { userId: targetId },
          data: profileUpdate,
          select: {
            fullName: true,
            avatar: true,
            biography: true,
            dateOfBirth: true,
            gender: true,
          },
        });

        return {
          id: targetId,
          email: target.email,
          userProfile: userProfileResult,
        };
      });

      const userData = {
        ...result,
        userProfile: {
          ...result.userProfile,
          dateOfBirth:
            result.userProfile?.dateOfBirth instanceof Date
              ? result.userProfile.dateOfBirth.toISOString()
              : result.userProfile?.dateOfBirth,
        },
      };
      return userData as IResponseUserDto;
    } catch (err) {
      console.log("transaction failed at update user: ", err);
      throw err;
    }
  },

  getUserDetail: async (type: string, userId: string, targetId?: string) => {
    try {
      if (type === "self") {
        const user = await validator(userId, (id) =>
          prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  fullName: true,
                  avatar: true,
                  dateOfBirth: true,
                  biography: true,
                  gender: true,
                },
              },
            },
          }),
        );
        if (!user) throw new Error(Exception.NOT_EXIST);
        const userData = {
          ...user,
          userProfile: {
            ...user.userProfile,
            dateOfBirth:
              user.userProfile?.dateOfBirth instanceof Date
                ? user.userProfile.dateOfBirth.toISOString()
                : user.userProfile?.dateOfBirth,
          },
        };
        return userData as IResponseUserDto;
      } else if (type === "target" && targetId) {
        const target = await validator(targetId, (id) =>
          prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  fullName: true,
                  avatar: true,
                  dateOfBirth: true,
                  biography: true,
                  gender: true,
                },
              },
            },
          }),
        );
        if (!target) throw new Error(Exception.NOT_EXIST);
        const targetData = {
          ...target,
          userProfile: {
            ...target.userProfile,
            dateOfBirth:
              target.userProfile?.dateOfBirth instanceof Date
                ? target.userProfile.dateOfBirth.toISOString()
                : target.userProfile?.dateOfBirth,
          },
        };
        return targetData as IResponseUserDto;
      } else {
        console.log(type);
        throw new Error(Exception.BAD_REQUEST);
      }
    } catch (err: unknown) {
      console.log("error at get user detail service:", err);
      throw err;
    }
  },

  getAllUser: async (
    userId: string,
    page?: number,
    limit?: number,
    filter?: string,
    filterType?: string,
  ) => {
    const user = await validator(userId, (id) =>
      prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      }),
    );
    if (!user) throw new Error(Exception.NOT_EXIST);
    if (user.role !== "ADMIN") throw new Error(Exception.PEMRISSION);

    const whereClause: Prisma.UserWhereInput = {};
    if (filter && filterType) {
      if (filterType === "id") {
        if (!isUUID(filter)) throw new Error(Exception.ID_INVALID);
        whereClause.id = filter;
      }
      if (filterType === "email") {
        whereClause.email = { contains: filter, mode: "insensitive" };
      }
    }

    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * pageSize;

    const [totalCount, listUser] = await prisma.$transaction([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
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
        orderBy: { id: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: listUser as IUserList[],
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: currentPage,
        pageSize: pageSize,
      },
    };
  },
};
