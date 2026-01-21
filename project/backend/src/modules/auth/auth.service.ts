import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginBaseDto } from './dto/login.dto';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import {
  Exception,
  InvalidMessageResponse,
} from 'src/common/messages/messages.response';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private envCofig: EnvConfigService,
  ) {}

  async register(
    data: RegisterDto,
    { ipAddress, userAgent }: { ipAddress: string; userAgent: string },
  ) {
    const email = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (email) throw new ConflictException(Exception.CONFLICT);

    const hashedPW = await bcrypt.hash(data.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        account: {
          create: {
            password: hashedPW,
          },
        },
        userProfile: {
          create: {
            fullName: data.fullName,
          },
        },
      },
      select: {
        id: true,
        email: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!newUser.userProfile) {
      throw new Error('can not create new user profile');
    } else {
      const profile: UserProfileDto = newUser.userProfile as UserProfileDto;
      const payload = {
        sub: newUser.id,
        email: newUser.email,
      };
      const tokens = await this.getTokens(payload);

      await this.prisma.session.create({
        data: {
          userId: newUser.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.envCofig.refreshExpires),
          userAgent: userAgent,
          ipAddress: ipAddress,
        },
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          userProfile: profile,
        },
        tokens,
      };
    }
  }

  async loginBase(
    data: LoginBaseDto,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ) {
    try {
      console.log('login data:', data);
      const user = await this.prisma.user.findUnique({
        where: {
          email: data.email,
        },
        select: {
          id: true,
          email: true,
          account: {
            select: { password: true },
          },
          userProfile: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      });
      if (!user) throw new NotFoundException(Exception.NOT_EXIST);
      if (user?.account) {
        if (!user.account?.password) {
          throw new UnauthorizedException(
            InvalidMessageResponse.EMAIL_INCORRECT,
          );
        } else {
          const isPWValid = await bcrypt.compare(
            data.password,
            user.account?.password,
          );
          if (!isPWValid) {
            throw new UnauthorizedException(
              InvalidMessageResponse.PASSWORD_INCORRECT,
            );
          }
        }
      }
      const payload = { sub: user.id, email: user.email };
      const tokens = await this.getTokens(payload);
      //udpate session if login again in same device
      //in testing, userAgent is undefined, so we will set a variable before update session
      const safeUserAgent = userAgent || 'unknow';
      await this.prisma.session.upsert({
        where: {
          userId_userAgent: {
            userId: user.id,
            userAgent: safeUserAgent,
          },
        },
        update: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.envCofig.refreshExpires),
        },
        create: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.envCofig.refreshExpires),
          userAgent: userAgent,
          ipAddress: ipAddress,
        },
      });
      return {
        user: {
          id: user.id,
          email: user.email,
          userProfile: user.userProfile as UserProfileDto,
        },
        tokens,
      };
    } catch (err) {
      console.log('login falied: ', err);
      throw err;
    }
  }

  async refresh(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException(InvalidMessageResponse.USER_NOT_FOUND);
    }
    const session = await this.prisma.session.findFirst({
      where: {
        userId: user?.id,
        token: token,
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
      },
    });

    // console.log('session', session);
    // console.log('token', token);

    if (!session || session.expiresAt < new Date()) {
      if (session)
        await this.prisma.session.delete({ where: { id: session.id } });
      throw new ForbiddenException(InvalidMessageResponse.SESSION_BAD_ACCESS);
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const tokens = await this.getTokens(payload);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + this.envCofig.refreshExpires),
      },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        userProfile: user.userProfile,
      },
      tokens,
    };
  }

  private async getTokens(payload: Record<string, string>) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { payload },
        {
          secret: this.envCofig.jwtAccessKey,
          expiresIn: this.envCofig.accessExpires,
        },
      ),
      this.jwtService.signAsync(
        { payload },
        {
          secret: this.envCofig.jwtRefreshKey,
          expiresIn: this.envCofig.refreshExpires,
        },
      ),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}
