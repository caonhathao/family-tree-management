import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Exception } from 'src/common/messages/messages.response';
import { EnvConfigService } from 'src/common/config/env/env-config.service';

@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly envConfig: EnvConfigService,
  ) {}

  async createInvite(userId: string, data: CreateInviteDto) {
    //check user authorization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new ForbiddenException(Exception.UNAUTHORIZED);
    }

    //check group is existed
    const group = await this.prisma.groupFamily.findFirst({
      where: {
        id: data.groupId,
      },
    });

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
      const inviteLink = `${this.envConfig.domain}?token=${invite.token}`;

      return { inviteLink: inviteLink };
    }
    //generate invite token
    //using userId (sender) and goupId to generate unique token
    const payload = `${userId}-${data.groupId}-${Date.now()}`;
    const inviteToken = Buffer.from(payload).toString('base64');
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

    const inviteLink = `${this.envConfig.domain}?token=${inviteToken}`;
    return { inviteLink: inviteLink };
  }
}
