import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from '../users/dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginBaseDto } from './dto/login.dto';
import { InvalidMessageResponse } from 'src/common/messages/messages.response';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    data: RegisterDto,
    { ipAddress, userAgent }: { ipAddress: string; userAgent: string },
  ) {
    const hashedPW = await bcrypt.hash(data.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        accounts: {
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
        role: true,
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
      const profile: UserProfileDto[] = newUser.userProfile as UserProfileDto[];

      const payload = { sub: newUser.id, email: newUser.email };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET_KEY'),
        expiresIn: this.configService.getOrThrow<number>(
          'ACCESS_TOKEN_EXPIRES_IN',
        ),
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET_KEY'),
        expiresIn: this.configService.getOrThrow<number>(
          'REFRESH_TOKEN_EXPIRES_IN',
        ),
      });

      await this.prisma.session.create({
        data: {
          userId: newUser.id,
          token: refreshToken,
          expiresAt: new Date(
            Date.now() +
              Number(
                this.configService.getOrThrow<number>(
                  'REFRESH_TOKEN_EXPIRES_IN',
                ),
              ),
          ),
          userAgent: userAgent,
          ipAddress: ipAddress,
        },
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          userProfile: profile[0],
        },
        token: {
          accessToken,
          refreshToken,
        },
      };
    }
  }

  async loginBase(
    data: LoginBaseDto,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
      include: {
        accounts: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    const account = user?.accounts[0];
    if (!user || !account?.password) {
      throw new UnauthorizedException(InvalidMessageResponse.EMAIL_INCORRECT);
    } else {
      const isPWValid = await bcrypt.compare(data.password, account?.password);
      if (!isPWValid) {
        throw new UnauthorizedException(
          InvalidMessageResponse.PASSWORD_INCORRECT,
        );
      }
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(
          Date.now() +
            Number(
              this.configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRES_IN'),
            ),
        ),
        userAgent: userAgent,
        ipAddress: ipAddress,
      },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        userProfile: user.userProfile[0],
      },
      tokens,
    };
  }

  private async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}
