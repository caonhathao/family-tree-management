import { prisma } from "@/lib/prisma";
import { USER_ROLE } from "@prisma/client";
import {
  IResponseGroupFamiliesDto,
  IResponseJoinGroupDto,
  ResponseGroupFamilyDetailDto,
} from "./group-family.dto";
import {
  CreateGroupFamilyDto,
  UpdateGroupFamilyDto,
} from "./group-family.service-validator";

export const GroupFamilyService = {
  joinGroup: async (token: string, getterId: string) => {
    const invite = await prisma.invite.findUnique({
      where: { token },
      select: {
        groupId: true,
        expiresAt: true,
      },
    });
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (new Date() > invite.expiresAt) {
      throw new Error("Invite expired");
    }

    const getter = await prisma.user.findFirst({
      where: { id: getterId },
      select: {
        id: true,
      },
    });
    if (!getter) {
      throw new Error("User not found");
    }
    const existedGetter = await prisma.groupMember.findFirst({
      where: {
        memberId: getterId,
        groupId: invite.groupId,
      },
      select: {
        id: true,
      },
    });

    if (existedGetter) {
      return await prisma.groupMember.findFirst({
        where: {
          memberId: getterId,
          groupId: invite.groupId,
        },
        select: {
          id: true,
          groupId: true,
          memberId: true,
          role: true,
          isLeader: true,
        },
      });
    }

    const group = await prisma.groupFamily.findUnique({
      where: {
        id: invite.groupId,
      },
      select: {
        id: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId: invite.groupId,
        memberId: getterId,
        role: USER_ROLE.VIEWER,
        isLeader: false,
      },
      select: {
        id: true,
        groupId: true,
        memberId: true,
        role: true,
        isLeader: true,
      },
    });
    if (!newMember) {
      throw new Error("Could not create member");
    }
    return newMember as IResponseJoinGroupDto;
  },

  getAll: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const groups = await prisma.groupFamily.findMany({
      where: { groupMembers: { some: { memberId: userId } } },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return groups as IResponseGroupFamiliesDto[];
  },

  getDetail: async (userId: string, groupId: string) => {
    const group = await prisma.groupFamily.findFirst({
      where: {
        id: groupId,
        groupMembers: {
          some: { memberId: userId },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        family: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        groupMembers: {
          select: {
            member: {
              select: {
                userProfile: {
                  select: {
                    id: true,
                    userId: true,
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
            role: true,
            isLeader: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    return group as ResponseGroupFamilyDetailDto;
  },

  updateGroup: async (
    userId: string,
    groupId: string,
    data: UpdateGroupFamilyDto,
  ) => {
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        memberId: userId,
        groupId: groupId,
      },
      select: {
        isLeader: true,
      },
    });

    if (!groupMember || !groupMember.isLeader) {
      throw new Error("User is not a leader of this group");
    }

    if (data.name === "") {
      throw new Error("Name cannot be empty");
    }

    const updatedGroup = await prisma.groupFamily.update({
      where: { id: groupId },
      data: {
        ...data,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return updatedGroup;
  },

  createGroup: async (userId: string, data: CreateGroupFamilyDto) => {
    try {
      const newGroup = await prisma.groupFamily.create({
        data: {
          name: data.name,
          description: data.description,
        },
        select: { id: true, name: true, description: true },
      });

      await prisma.groupMember.create({
        data: {
          groupId: newGroup.id,
          memberId: userId,
          role: data.role || USER_ROLE.OWNER,
          isLeader: true,
        },
      });

      return newGroup;
    } catch (err) {
      console.log("err at create group family service:", err);
      throw err;
    }
  },

  quitGroup: async (userId: string, groupId: string) => {
    try {
      //check validation
      //check userId (requester) is in the group (groupId) or not
      const member = await prisma.groupMember.findFirst({
        where: {
          memberId: userId,
          groupId: groupId,
        },
        select: {
          id: true,
          role: true,
          isLeader: true,
        },
      });
      if (!member) {
        throw new Error("User is not in the group");
      }

      if (member.isLeader) throw new Error("User is the leader of the group");
      if (member.role !== USER_ROLE.VIEWER)
        throw new Error("User has the special role in the group");

      const res = await prisma.groupMember.delete({
        where: {
          memberId_groupId: {
            memberId: userId,
            groupId: groupId,
          },
        },
        select: {
          id: true,
          memberId: true,
        },
      });
      return res;
    } catch (err: unknown) {
      console.log("error at quit group service:", err);
      throw err;
    }
  },
};
