import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Exception } from 'src/common/messages/messages.response';
import { isUUID } from 'class-validator';

@Injectable()
export class InviteService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvite(userId: string, data: CreateInviteDto) {
    // console.log('body at invite controller: ', data);
    if (!isUUID(data.groupId))
      throw new BadRequestException(Exception.BAD_REQUEST);

    const [user, group] = await Promise.all([
      //check if user is a member of group
      this.prisma.groupMember.findFirst({
        where: {
          memberId: userId,
          groupId: data.groupId,
        },
      }),

      //check group is existed
      this.prisma.groupFamily.findFirst({
        where: {
          id: data.groupId,
        },
      }),
    ]);

    if (!user) throw new ForbiddenException(Exception.PEMRISSION);
    if (!group) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    //check if invite was created and not expire
    const invite = await this.prisma.invite.findFirst({
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
    //generate invite token
    const inviteToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    //store invite in db
    await this.prisma.invite.create({
      data: {
        token: inviteToken,
        groupId: data.groupId,
        senderId: userId,
        expiresAt: expiresAt,
      },
    });

    const inviteLink = `/invite?token=${inviteToken}`;
    return { inviteLink: inviteLink };
  }
}
