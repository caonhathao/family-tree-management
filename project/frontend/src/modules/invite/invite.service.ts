import { prisma } from "@/lib/prisma";
import { CreateInviteDto } from "@/dto/create-invite.dto";

export const InviteService = {
  createInviteLink: async (userId: string, data: CreateInviteDto) => {
    const [user, group] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          memberId: userId,
          groupId: data.groupId,
        },
      }),

      prisma.groupFamily.findFirst({
        where: {
          id: data.groupId,
        },
      }),
    ]);

    if (!user) {
      throw new Error("Permission denied");
    }
    if (!group) {
      throw new Error("Group not found");
    }

    const invite = await prisma.invite.findFirst({
      where: {
        groupId: data.groupId,
        senderId: userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        token: true,
      },
    });

    if (invite) {
      const inviteLink = `/invite?token=${invite.token}`;
      return { inviteLink: inviteLink };
    }
    const payload = `${userId}-${data.groupId}-${Date.now()}`;
    const inviteToken = Buffer.from(payload).toString("base64");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await prisma.invite.create({
      data: {
        token: inviteToken,
        groupId: data.groupId,
        senderId: userId,
        expiresAt: expiresAt,
      },
    });

    const inviteLink = `${process.env.CLIENT_DOMAIN}/invite?token=${inviteToken}`;
    return { inviteLink: inviteLink };
  },
};
