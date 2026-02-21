import { prisma } from "@/lib/prisma";
import { MEMBER_ROLE } from "@prisma/client";
import { UpdateGroupMemberDto } from "./group-member.service-validator";

export const GroupMemberService = {
  removeMember: async (userId: string, groupId: string, memberId: string) => {
    try {
      //check validation
      //role in group
      const members = await prisma.groupMember.findMany({
        where: {
          groupId: groupId,
          memberId: { in: [userId, memberId] },
        },
        select: {
          id: true,
          memberId: true,
          groupId: true,
          role: true,
        },
      });

      const requesterRole = members.find(
        (member) => member.memberId === memberId,
      )?.role;

      if (requesterRole === "VIEWER") throw new Error("Permission denied");

      if (members.length < 2) {
        throw new Error("Requester or member not found in group");
      }

      const { count } = await prisma.groupMember.deleteMany({
        where: {
          groupId: groupId,
          memberId: memberId,
        },
      });
      return count as number;
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
            role: MEMBER_ROLE.VIEWER,
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
            role: MEMBER_ROLE.OWNER,
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
          role: data.role,
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
};
