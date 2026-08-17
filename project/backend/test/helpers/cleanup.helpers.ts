import { PrismaService } from '../../prisma/prisma.service';

export const deleteUsersByEmails = (prisma: PrismaService, emails: string[]) =>
  prisma.user.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  });

export const deleteGroupsByIds = (prisma: PrismaService, ids: string[]) =>
  prisma.groupFamily.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

export const deleteGroupMembersByGroupIds = (
  prisma: PrismaService,
  groupIds: string[],
) =>
  prisma.groupMember.deleteMany({
    where: {
      groupId: {
        in: groupIds,
      },
    },
  });

export const deleteInvitesByTokens = (
  prisma: PrismaService,
  tokens: string[],
) =>
  prisma.invite.deleteMany({
    where: {
      token: {
        in: tokens,
      },
    },
  });

export const wipeTestData = async (prisma: PrismaService) => {
  await prisma.relationship.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.groupFamily.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
};

export const wipeFamilyMemberTestData = async (prisma: PrismaService) => {
  await prisma.relationship.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.album.deleteMany();
  await prisma.event.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.family.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.groupFamily.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
};
