import {
  BadRequestException,
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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private envConfig: EnvConfigService,
  ) {}

  async register(
    data: RegisterDto,
    { ipAddress, userAgent }: { ipAddress: string; userAgent: string },
  ) {
    // console.log(data);
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
          expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
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
      //console.log('login data:', data);
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
          expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
        },
        create: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
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

  async loginGoogle(
    token: GoogleLoginDto,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ) {
    try {
      const client = new OAuth2Client(this.envConfig.googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: token.token,
        audience: this.envConfig.googleClientId,
      });

      const payload: TokenPayload | undefined = ticket.getPayload();
      if (!payload) throw new BadRequestException(Exception.BAD_REQUEST);

      //check user in database
      const user = await this.prisma.user.findFirst({
        where: {
          email: payload?.email,
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

      //if user is eixist, generate new token and session
      //if not, register account
      if (user) {
        const payload = {
          sub: user.id,
          email: user.email,
        };
        const tokens = await this.getTokens(payload);
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
            expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
          },
          create: {
            userId: user.id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
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
      } else {
        const newUser = await this.prisma.user.create({
          data: {
            email: payload.email as string,
            userProfile: {
              create: {
                fullName: payload.name as string,
                avatar: payload.picture as string,
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
              expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
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
    } catch (err) {
      console.log('error at login by google', err);
      throw err;
    }
  }

  async refresh(userId: string, refreshToken: string) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId: userId },
      });

      const currentSession = sessions.find((s) => s.token === refreshToken);

      if (!currentSession) {
        await this.prisma.session.deleteMany({ where: { userId } });
        throw new ForbiddenException(
          'Cảnh báo bảo mật: Phiên làm việc không hợp lệ',
        );
      }

      if (currentSession.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { id: currentSession.id } });
        throw new ForbiddenException('Phiên đăng nhập hết hạn');
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) throw new NotFoundException(Exception.NOT_EXIST);

      const tokens = await this.getTokens({ sub: user.id, email: user.email });

      await this.prisma.session.update({
        where: { id: currentSession.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + this.envConfig.refreshExpires),
        },
      });

      return { user, tokens };
    } catch (err) {
      console.log('error at refresh service:', err);
      throw err;
    }
  }

  async resetPassword(data: ResetPasswordDto) {
    try {
      //check user by email in database
      const user = await this.prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });
      if (!user) throw new NotFoundException(Exception.NOT_EXIST);
    } catch (err) {
      console.log(
        `error at reset password service with email: ${data.email}`,
        err,
      );
      throw err;
    }
  }

  async logout(userId: string, token: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException(Exception.NOT_EXIST);

        await tx.session.deleteMany({
          where: {
            userId: user.id,
            token: token,
          },
        });

        return { success: true };
      });
    } catch (err) {
      console.log('error at logout service:', err);
      throw err;
    }
  }

  private async getTokens(payload: Record<string, string>) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { payload },
        {
          secret: this.envConfig.jwtAccessKey,
          expiresIn: this.envConfig.accessExpires,
        },
      ),
      this.jwtService.signAsync(
        { payload },
        {
          secret: this.envConfig.jwtRefreshKey,
          expiresIn: this.envConfig.refreshExpires,
        },
      ),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}
