import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UpdateUserDto } from "./user.service-validator";

export const UserService = {
  updateUser: async (
    targetId: string,
    userId: string,
    data: UpdateUserDto,
    file?: File,
  ) => {
    if (targetId !== userId) {
      throw new Error("Permission denied");
    }

    const profileUpdate: Prisma.UserProfileUpdateInput = {};
    const userUpdate: Prisma.UserUpdateInput = {};
    const accountUpdate: Prisma.AccountUpdateInput = {};

    if (data.fullName) profileUpdate.fullName = data.fullName;
    if (data.biography) {
      try {
        profileUpdate.biography = JSON.parse(
          data.biography,
        ) as Prisma.InputJsonValue;
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

    if (data.email && data.email.trim() !== "") {
      const isEmailTaken = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });
      if (!isEmailTaken) {
        userUpdate.email = data.email;
      }
    }

    if (data.password && data.password.trim() !== "") {
      accountUpdate.password = await bcrypt.hash(data.password, 10);
    }

    if (file) {
      console.log("File upload is not implemented yet.");
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

        if (Object.keys(accountUpdate).length > 0) {
          await tx.account.update({
            where: { userId: targetId },
            data: accountUpdate,
          });
        }

        return {
          id: targetId,
          email: userResult?.email,
          userProfile: userProfileResult,
        };
      });

      return result;
    } catch (err) {
      console.log("transaction failed at update user: ", err);
      throw err;
    }
  },

  getUserDetail: async (targetId: string, userId: string) => {
    if (targetId !== userId) {
      throw new Error("User not found");
    }
    return await prisma.user.findUnique({
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
  },
};
