import { prisma } from "@/lib/prisma";
import { UpdateGroupMemberDto } from "@/dto/update-group-member.dto";
import { USER_ROLE } from "@prisma/client";

export const GroupMemberService = {
  removeMember: async (
    userId: string,
    groupId: string,
    memberId: string,
  ) => {
    try {
      const members = await prisma.groupMember.findMany({
        where: {
          groupId: groupId,
          memberId: { in: [userId, memberId] },
        },
      });

      if (members.length < 2) {
        throw new Error("Requester or member not found in group");
      }

      return await prisma.groupMember.deleteMany({
        where: {
          groupId: groupId,
          memberId: memberId,
        },
      });
    } catch (err) {
      console.log("remove member service", err);
      throw err;
    }
  },

  changeLeader: async (
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) => {
    const [newLeader, groupMember] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: data.id,
        },
      }),
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          memberId: userId,
        },
        select: {
          memberId: true,
          isLeader: true,
        },
      }),
    ]);

    if (!newLeader) {
      throw new Error("New leader not found in group");
    }
    if (!groupMember) {
      throw new Error("Requester not found in group");
    }

    if (groupMember.isLeader) {
      return await prisma.$transaction(async (tx) => {
        await tx.groupMember.updateMany({
          where: {
            groupId: groupId,
            memberId: userId,
          },
          data: {
            isLeader: false,
            role: USER_ROLE.VIEWER,
          },
        });
        const newLeader = await tx.groupMember.update({
          where: {
            memberId_groupId: {
              groupId: groupId,
              memberId: data.id,
            },
          },
          data: {
            isLeader: true,
            role: USER_ROLE.OWNER,
          },
          select: {
            id: true,
            memberId: true,
            groupId: true,
            role: true,
            isLeader: true,
          },
        });
        return newLeader;
      });
    }
    throw new Error("User is not a leader of this group");
  },

  updateRole: async (
    userId: string,
    groupId: string,
    data: UpdateGroupMemberDto,
  ) => {
    try {
      const [requester, targetMember] = await Promise.all([
        prisma.groupMember.findFirst({
          where: { groupId, memberId: userId },
        }),
        prisma.groupMember.findFirst({
          where: { groupId, memberId: data.id },
        }),
      ]);

      if (!targetMember) {
        throw new Error("Target member not found");
      }

      if (!requester) {
        throw new Error("Requester not found");
      }

      return await prisma.groupMember.update({
        where: {
          memberId_groupId: {
            groupId: groupId,
            memberId: data.id,
          },
        },
        data: {
          role: data.role as any,
        },
        select: {
          id: true,
          memberId: true,
          groupId: true,
          role: true,
          isLeader: true,
        },
      });
    } catch (err) {
      console.log("group member service failed: ", err);
      throw err;
    }
  },

  deleteGroupMember: async (
    userId: string,
    groupId: string,
    memberId: string,
  ) => {
    try {
      const requester = await prisma.groupMember.findFirst({
        where: {
          groupId,
          memberId: userId,
        },
      });

      if (!requester) {
        throw new Error("Requester not found in group");
      }

      if (!requester.isLeader && requester.role !== USER_ROLE.OWNER) {
        throw new Error("Permission denied");
      }

      return await prisma.groupMember.delete({
        where: {
          memberId_groupId: {
            groupId,
            memberId,
          },
        },
      });
    } catch (err) {
      console.log("delete group member service failed: ", err);
      throw err;
    }
  },

  removeFromGroup: async (groupId: string, memberId: string) => {
    try {
      return await prisma.groupMember.deleteMany({
        where: {
          groupId: groupId,
          memberId: memberId,
        },
      });
    } catch (err) {
      console.log("remove from group service failed: ", err);
      throw err;
    }
  },
};
