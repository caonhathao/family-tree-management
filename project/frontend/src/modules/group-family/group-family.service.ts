import { prisma } from "@/lib/prisma";
import { CreateGroupFamilyDto } from "@/dto/create-group-family.dto";
import { USER_ROLE } from "@prisma/client";
import { UpdateGroupFamilyDto } from "@/dto/update-group-family.dto";

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
    return newMember;
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
    return groups;
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

    return group;
  },

  updateGroup: async (userId: string, groupId: string, data: UpdateGroupFamilyDto) => {
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
          role: data.role as any || USER_ROLE.OWNER,
          isLeader: true,
        },
      });

      return newGroup;
    } catch (err) {
      console.log("err at create group family service:", err);
      throw err;
    }
  },
};
