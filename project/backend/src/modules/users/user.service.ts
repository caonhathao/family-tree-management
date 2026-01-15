import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserUpdateDto } from './dto/update-user.dto';
import { Exception } from 'src/common/messages/messages.response';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserServices {
  constructor(private prisma: PrismaService) {}

  async update(userId: string, data: UserUpdateDto) {
    if (!userId || userId === '') {
      throw new ForbiddenException(Exception.ID_MISSING);
    }
    if (data.email) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: data.email },
      });
    }
    if (data.password) {
      const hashedPW = await bcrypt.hash(data.password, 10);
      await this.prisma.account.update({
        where: { userId: userId },
        data: { password: hashedPW },
      });
    }
  }

  async get(userId: string) {
    //check user is exist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(Exception.NOT_EXIST);
    }

    return await this.prisma.user.findUnique({
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
  }
}
