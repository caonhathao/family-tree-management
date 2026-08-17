import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginBaseDto } from './dto/login.dto';
import { EnvConfigService } from 'src/common/config/env/env-config.service';
import { BusinessException } from 'src/common/errors/business.exception';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { HttpStatus } from 'src/common/constants/api';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';
import { CreateBaseAuthDto } from './dto/create-base-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { UnlinkProviderDto } from './dto/unlink-provider.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { VerifyGoogleDto } from './dto/verify-google.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AUTH_TYPE, MEMBER_ROLE, Prisma, PROVIDERS } from '@prisma/client';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
import {
  AuthActionData,
  AuthLoginInfoData,
  AuthResult,
  AuthStatusData,
  AuthTokens,
} from './types/auth-response.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private envConfig: EnvConfigService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async register(
    data: RegisterDto,
    { ipAddress, userAgent }: { ipAddress: string; userAgent: string },
  ): Promise<AuthResult> {
    // console.log(data);
    const email = await this.prisma.user.findFirst({
      where: {
        email: { equals: data.email, mode: 'insensitive' },
      },
    });

    if (email) throw new BusinessException(ErrorCode.CONFLICT);

    const accountEmail = await this.prisma.account.findFirst({
      where: {
        email: { equals: data.email, mode: 'insensitive' },
      },
    });

    if (accountEmail) throw new BusinessException(ErrorCode.CONFLICT);

    const hashedPW = await bcrypt.hash(data.password, 10);
    const newUser = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          accounts: {
            create: {
              email: data.email,
              password: hashedPW,
              authProvider: {
                create: {
                  provider: PROVIDERS.USER,
                },
              },
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
          accounts: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!createdUser.userProfile || !createdUser.accounts) {
        throw new Error('can not create new user profile');
      }

      const payload = {
        id: createdUser.id,
        role: createdUser.role,
      };
      const tokens = await this.getTokens(payload);

      await this.issueSession(tx, {
        userId: createdUser.id,
        accountId: createdUser.accounts[0].id,
        authBy: PROVIDERS.USER,
        type: AUTH_TYPE.REGISTER,
        tokens,
        userAgent,
        ipAddress,
      });

      return {
        user: {
          id: createdUser.id,
          role: createdUser.role,
          userProfile: createdUser.userProfile,
        },
        tokens,
      };
    });

    return newUser;
  }

  async loginBase(
    data: LoginBaseDto,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ): Promise<AuthResult> {
    try {
      //console.log('login data:', data);
      const user = await this.prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              email: { equals: data.email, mode: 'insensitive' },
              authProvider: {
                provider: PROVIDERS.USER,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          accounts: {
            where: {
              authProvider: {
                provider: PROVIDERS.USER,
              },
            },
            select: {
              id: true,
              password: true,
            },
          },
          userProfile: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);
      if (user?.accounts) {
        if (!user.accounts[0].password) {
          throw new BusinessException(ErrorCode.EMAIL_INCORRECT, {
            httpStatus: HttpStatus.UNAUTHORIZED,
          });
        } else {
          const isPWValid = await bcrypt.compare(
            data.password,
            user.accounts[0].password,
          );
          if (!isPWValid) {
            throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
              httpStatus: HttpStatus.UNAUTHORIZED,
            });
          }
        }
      }
      const payload = { id: user.id, role: user.role };
      const tokens = await this.getTokens(payload);
      // Create a fresh session per login so multiple devices can be active.
      await this.prisma.$transaction(async (tx) => {
        await this.issueSession(tx, {
          userId: user.id,
          accountId: user.accounts[0].id,
          authBy: PROVIDERS.USER,
          type: AUTH_TYPE.LOGIN,
          tokens,
          userAgent,
          ipAddress,
        });
      });

      return {
        user: {
          id: user.id,
          role: user.role,
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
  ): Promise<AuthResult> {
    try {
      const payload = await this.verifyGoogleToken(token.token);
      const googleEmail = payload.email as string;

      // 1. Tìm user đã có tài khoản Google với email này
      const existing = await this.prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              email: { equals: googleEmail, mode: 'insensitive' },
              authProvider: { provider: PROVIDERS.GOOGLE },
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
          accounts: {
            where: {
              authProvider: {
                provider: PROVIDERS.GOOGLE,
              },
            },
            select: {
              id: true,
            },
          },
        },
      });

      // Đã tồn tại → cấp token + session
      if (existing) {
        const jwtPayload = {
          id: existing.id,
          role: existing.role,
        };
        const tokens = await this.getTokens(jwtPayload);
        let accountId = existing.accounts[0]?.id;

        await this.prisma.$transaction(async (tx) => {
          // Phòng hờ account Google chưa có email (dữ liệu cũ)
          if (!accountId) {
            const linked = await tx.account.create({
              data: {
                userId: existing.id,
                email: googleEmail,
                authProvider: {
                  create: { provider: PROVIDERS.GOOGLE },
                },
              },
              select: { id: true },
            });
            accountId = linked.id;
          }

          await this.issueSession(tx, {
            userId: existing.id,
            accountId,
            authBy: PROVIDERS.GOOGLE,
            type: AUTH_TYPE.LOGIN,
            tokens,
            userAgent,
            ipAddress,
          });
        });
        return {
          user: {
            id: existing.id,
            role: existing.role,
            userProfile: existing.userProfile as UserProfileDto,
          },
          tokens,
        };
      }

      // 2. Chưa có tài khoản Google → user đã đăng ký base auth cùng email → link thêm
      const baseUser = await this.prisma.user.findFirst({
        where: {
          accounts: {
            some: {
              email: { equals: googleEmail, mode: 'insensitive' },
              authProvider: { provider: PROVIDERS.USER },
            },
          },
        },
        select: { id: true },
      });

      if (baseUser) {
        return this.linkGoogleAccount(baseUser.id, payload, {
          userAgent,
          ipAddress,
        });
      }

      // 3. Tạo user + tài khoản Google mới
      const newUser = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: googleEmail,
            userProfile: {
              create: {
                fullName: payload.name as string,
                avatar: payload.picture as string,
              },
            },
            accounts: {
              create: {
                email: googleEmail,
                authProvider: {
                  create: {
                    provider: PROVIDERS.GOOGLE,
                  },
                },
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
            accounts: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!createdUser.userProfile || !createdUser.accounts) {
          throw new Error('can not create new user profile');
        }

        const jwtPayload = {
          id: createdUser.id,
          role: createdUser.role,
        };
        const tokens = await this.getTokens(jwtPayload);

        await this.issueSession(tx, {
          userId: createdUser.id,
          accountId: createdUser.accounts[0].id,
          authBy: PROVIDERS.GOOGLE,
          type: AUTH_TYPE.LOGIN,
          tokens,
          userAgent,
          ipAddress,
        });

        return {
          user: {
            id: createdUser.id,
            role: createdUser.role,
            userProfile: createdUser.userProfile,
          },
          tokens,
        };
      });

      return newUser;
    } catch (err) {
      console.log('error at login by google', err);
      throw err;
    }
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthResult> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId: userId },
      });

      const currentSession = sessions.find((s) => s.token === refreshToken);

      if (!currentSession) {
        throw new BusinessException(ErrorCode.SESSION_BAD_ACCESS, {
          httpStatus: HttpStatus.FORBIDDEN,
        });
      }

      if (currentSession.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { id: currentSession.id } });
        throw new BusinessException(ErrorCode.EXPIRED, {
          httpStatus: HttpStatus.FORBIDDEN,
        });
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
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

      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

      const tokens = await this.getTokens({ id: user.id, role: user.role });

      await this.prisma.session.update({
        where: { id: currentSession.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(
            Date.now() + this.envConfig.refreshExpires * 1000,
          ),
        },
      });

      return {
        user: {
          id: user.id,
          role: user.role,
          userProfile: user.userProfile as UserProfileDto,
        },
        tokens,
      };
    } catch (err) {
      console.log('error at refresh service:', err);
      throw err;
    }
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    try {
      //check user by email in database
      const user = await this.prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);
    } catch (err) {
      console.log(
        `error at reset password service with email: ${data.email}`,
        err,
      );
      throw err;
    }
  }

  async createBaseAuth(
    data: CreateBaseAuthDto,
    userId: string,
  ): Promise<AuthActionData> {
    try {
      if (data.password !== data.confirmPassword) {
        throw new BusinessException(ErrorCode.BAD_REQUEST);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          accounts: {
            where: {
              authProvider: { provider: PROVIDERS.USER },
            },
            select: {
              id: true,
              password: true,
            },
          },
        },
      });

      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

      const baseAccount = user.accounts[0];
      if (baseAccount?.password) {
        throw new BusinessException(ErrorCode.EXISTED);
      }

      const hashedPW = await bcrypt.hash(data.password, 10);
      if (baseAccount) {
        await this.prisma.account.update({
          where: { id: baseAccount.id },
          data: { password: hashedPW },
        });
      } else {
        await this.prisma.account.create({
          data: {
            userId: user.id,
            email: user.email,
            password: hashedPW,
            authProvider: {
              create: {
                provider: PROVIDERS.USER,
              },
            },
          },
        });
      }

      return { success: true, message: 'ok' };
    } catch (err) {
      console.log('error at create base auth service:', err);
      throw err;
    }
  }

  async changePassword(
    userId: string,
    data: ChangePasswordDto,
    currentToken: string,
  ): Promise<AuthActionData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          accounts: {
            where: { authProvider: { provider: PROVIDERS.USER } },
            select: { id: true, password: true },
          },
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);
      const baseAccount = user.accounts[0];
      if (!baseAccount || !baseAccount.password)
        throw new BusinessException(ErrorCode.NOT_EXIST);

      if (data.newPassword !== data.confirmPassword)
        throw new BusinessException(ErrorCode.BAD_REQUEST);
      if (data.oldPassword === data.newPassword)
        throw new BusinessException(ErrorCode.BAD_REQUEST);

      const isMatch = await bcrypt.compare(
        data.oldPassword,
        baseAccount.password,
      );
      if (!isMatch)
        throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
          httpStatus: HttpStatus.UNAUTHORIZED,
        });

      const hashedPW = await bcrypt.hash(data.newPassword, 10);

      await this.prisma.$transaction([
        this.prisma.account.update({
          where: { id: baseAccount.id },
          data: { password: hashedPW },
        }),
        // Đăng xuất các thiết bị khác, giữ thiết bị hiện tại
        this.prisma.session.deleteMany({
          where: { userId: user.id, token: { not: currentToken } },
        }),
      ]);

      return { success: true, message: 'ok' };
    } catch (err) {
      console.log('error at change password service:', err);
      throw err;
    }
  }

  async changeEmail(
    userId: string,
    data: ChangeEmailDto,
    currentToken: string,
  ): Promise<AuthActionData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          accounts: {
            where: { authProvider: { provider: PROVIDERS.USER } },
            select: { id: true, email: true, password: true },
          },
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);
      const baseAccount = user.accounts[0];
      if (!baseAccount || !baseAccount.password)
        throw new BusinessException(ErrorCode.NOT_EXIST);

      const isMatch = await bcrypt.compare(data.password, baseAccount.password);
      if (!isMatch)
        throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
          httpStatus: HttpStatus.UNAUTHORIZED,
        });

      const newEmail = data.newEmail.trim();

      // Email không được thuộc account/user khác
      const accountConflict = await this.prisma.account.findFirst({
        where: {
          email: { equals: newEmail, mode: 'insensitive' },
          userId: { not: userId },
        },
      });
      if (accountConflict) throw new BusinessException(ErrorCode.CONFLICT);

      const userConflict = await this.prisma.user.findFirst({
        where: {
          email: { equals: newEmail, mode: 'insensitive' },
          id: { not: userId },
        },
      });
      if (userConflict) throw new BusinessException(ErrorCode.CONFLICT);

      await this.prisma.$transaction([
        this.prisma.account.update({
          where: { id: baseAccount.id },
          data: { email: newEmail },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { email: newEmail },
        }),
        // Đăng xuất các thiết bị khác, giữ thiết bị hiện tại
        this.prisma.session.deleteMany({
          where: { userId, token: { not: currentToken } },
        }),
      ]);

      return { success: true, message: 'ok' };
    } catch (err) {
      console.log('error at change email service:', err);
      throw err;
    }
  }

  async unlinkProvider(
    userId: string,
    data: UnlinkProviderDto,
  ): Promise<AuthActionData> {
    try {
      const account = await this.prisma.account.findFirst({
        where: { id: data.accountId, userId },
        select: {
          id: true,
          authProvider: { select: { provider: true } },
        },
      });
      if (!account || !account.authProvider)
        throw new BusinessException(ErrorCode.NOT_EXIST);

      // Không được xóa phương thức đăng nhập cuối cùng
      const providerCount = await this.prisma.authProvider.count({
        where: { account: { userId } },
      });
      if (providerCount <= 1) {
        throw new BusinessException(ErrorCode.BAD_REQUEST);
      }

      await this.prisma.$transaction([
        this.prisma.authProvider.deleteMany({
          where: { accountId: account.id },
        }),
        this.prisma.account.delete({ where: { id: account.id } }),
      ]);

      return { success: true, message: 'ok' };
    } catch (err) {
      console.log('error at unlink provider service:', err);
      throw err;
    }
  }

  async linkGoogle(
    userId: string,
    data: GoogleLoginDto,
  ): Promise<AuthActionData> {
    try {
      const payload = await this.verifyGoogleToken(data.token);
      const googleEmail = payload.email as string;

      // Đã link Google email này rồi → no-op
      const existing = await this.prisma.authProvider.findFirst({
        where: {
          provider: PROVIDERS.GOOGLE,
          account: {
            userId,
            email: { equals: googleEmail, mode: 'insensitive' },
          },
        },
        select: { id: true },
      });
      if (existing)
        return { success: true, message: 'ok', alreadyLinked: true };

      // Email không được thuộc user khác
      const conflict = await this.prisma.account.findFirst({
        where: {
          email: { equals: googleEmail, mode: 'insensitive' },
          userId: { not: userId },
        },
      });
      if (conflict) throw new BusinessException(ErrorCode.CONFLICT);

      await this.linkGoogleAccount(userId, payload);

      return { success: true, message: 'ok' };
    } catch (err) {
      console.log('error at link google service:', err);
      throw err;
    }
  }

  async verifyPassword(
    userId: string,
    data: VerifyPasswordDto,
  ): Promise<AuthLoginInfoData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        accounts: {
          where: { authProvider: { provider: PROVIDERS.USER } },
          select: { id: true, password: true },
        },
      },
    });
    if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

    const baseAccount = user.accounts[0];
    if (!baseAccount?.password)
      throw new BusinessException(ErrorCode.NOT_EXIST);

    const isMatch = await bcrypt.compare(data.password, baseAccount.password);
    if (!isMatch)
      throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
        httpStatus: HttpStatus.UNAUTHORIZED,
      });

    return this.getLoginInfo(userId);
  }

  async verifyGoogle(
    userId: string,
    data: VerifyGoogleDto,
  ): Promise<AuthLoginInfoData> {
    const payload = await this.verifyGoogleToken(data.token);
    const googleEmail = payload.email as string;

    const account = await this.prisma.account.findFirst({
      where: {
        userId,
        email: { equals: googleEmail, mode: 'insensitive' },
        authProvider: { provider: PROVIDERS.GOOGLE },
      },
      select: { id: true },
    });
    if (!account) throw new BusinessException(ErrorCode.NOT_EXIST);

    return this.getLoginInfo(userId);
  }

  async deleteAccount(
    userId: string,
    data: DeleteAccountDto,
  ): Promise<AuthStatusData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userProfile: { select: { avatar: true } },
          accounts: {
            where: { authProvider: { provider: PROVIDERS.USER } },
            select: { password: true },
            take: 1,
          },
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

      // Yêu cầu nhập mật khẩu nếu tài khoản có đăng nhập bằng mật khẩu
      const baseAccount = user.accounts[0];
      if (baseAccount?.password) {
        if (!data.password) {
          throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
            httpStatus: HttpStatus.UNAUTHORIZED,
          });
        }
        const isMatch = await bcrypt.compare(
          data.password,
          baseAccount.password,
        );
        if (!isMatch) {
          throw new BusinessException(ErrorCode.PASSWORD_INCORRECT, {
            httpStatus: HttpStatus.UNAUTHORIZED,
          });
        }
      }

      await this.prisma.$transaction(async (tx) => {
        // Chuyển quyền leader cho thành viên khác trước khi xóa
        const ledGroups = await tx.groupMember.findMany({
          where: { memberId: userId, isLeader: true },
          select: {
            group: {
              select: {
                id: true,
                family: { select: { id: true, ownerId: true } },
                groupMembers: {
                  select: { id: true, memberId: true, role: true },
                },
              },
            },
          },
        });

        for (const { group } of ledGroups) {
          const otherMembers = group.groupMembers.filter(
            (member) => member.memberId !== userId,
          );
          const successor =
            otherMembers.find((member) => member.role === MEMBER_ROLE.OWNER) ||
            otherMembers.find((member) => member.role === MEMBER_ROLE.EDITOR) ||
            otherMembers[0];

          if (successor) {
            await tx.groupMember.update({
              where: { id: successor.id },
              data: { role: MEMBER_ROLE.OWNER, isLeader: true },
            });
            if (group.family && group.family.ownerId === userId) {
              await tx.family.update({
                where: { id: group.family.id },
                data: { ownerId: successor.memberId },
              });
            }
          } else {
            // Không còn ai trong nhóm → xóa luôn cả nhóm
            await tx.groupFamily.delete({ where: { id: group.id } });
          }
        }

        await tx.authLog.deleteMany({ where: { userId } });
        await tx.activityLog.deleteMany({ where: { userId } });
        await tx.session.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });

      // Xóa media cá nhân trên Cloudinary (best-effort, không chặn việc xóa DB)
      if (user.userProfile?.avatar) {
        try {
          await this.cloudinaryService.destroyFile(
            user.userProfile.avatar,
            this.envConfig.folderUserName,
          );
        } catch (avatarErr) {
          console.log('failed to delete avatar on cloudinary:', avatarErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.log('error at delete account service:', err);
      throw err;
    }
  }

  private async getLoginInfo(userId: string): Promise<AuthLoginInfoData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        accounts: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            authProvider: {
              select: {
                provider: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

    return {
      accounts: user.accounts.map((account) => ({
        id: account.id,
        email: account.email,
        provider: account.authProvider?.provider,
        createdAt: account.createdAt,
      })),
    };
  }

  private async verifyGoogleToken(token: string): Promise<TokenPayload> {
    const client = new OAuth2Client(this.envConfig.googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: this.envConfig.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new BusinessException(ErrorCode.BAD_REQUEST);
    return payload;
  }

  private async linkGoogleAccount(
    userId: string,
    payload: TokenPayload,
    sessionOpts?: { userAgent: string; ipAddress: string },
  ): Promise<AuthResult> {
    return this.prisma.$transaction(async (tx) => {
      const googleEmail = payload.email as string;

      const account = await tx.account.create({
        data: {
          userId,
          email: googleEmail,
          authProvider: {
            create: { provider: PROVIDERS.GOOGLE },
          },
        },
        select: { id: true },
      });

      // Backfill profile từ Google
      await tx.userProfile.updateMany({
        where: { userId },
        data: {
          ...(payload.name ? { fullName: payload.name } : {}),
          ...(payload.picture ? { avatar: payload.picture } : {}),
        },
      });

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          userProfile: {
            select: { fullName: true, avatar: true },
          },
        },
      });
      if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

      const tokens = await this.getTokens({ id: user.id, role: user.role });

      if (sessionOpts) {
        await this.issueSession(tx, {
          userId: user.id,
          accountId: account.id,
          authBy: PROVIDERS.GOOGLE,
          type: AUTH_TYPE.LOGIN,
          tokens,
          userAgent: sessionOpts.userAgent,
          ipAddress: sessionOpts.ipAddress,
        });
      }

      return {
        user: {
          id: user.id,
          role: user.role,
          userProfile: user.userProfile as UserProfileDto,
        },
        tokens,
      };
    });
  }

  private async issueSession(
    tx: Prisma.TransactionClient,
    opts: {
      userId: string;
      accountId: string;
      authBy: PROVIDERS;
      type: AUTH_TYPE;
      tokens: { refreshToken: string };
      userAgent: string;
      ipAddress: string;
    },
  ) {
    const safeUserAgent = opts.userAgent || 'unknow';
    // Dọn các session đã hết hạn để tránh tích lũy
    await tx.session.deleteMany({
      where: { userId: opts.userId, expiresAt: { lt: new Date() } },
    });
    // Mỗi lần login tạo một session mới (đa thiết bị)
    await tx.session.create({
      data: {
        userId: opts.userId,
        token: opts.tokens.refreshToken,
        expiresAt: new Date(Date.now() + this.envConfig.refreshExpires * 1000),
        userAgent: safeUserAgent,
        ipAddress: opts.ipAddress,
      },
    });
    await tx.authLog.create({
      data: {
        userId: opts.userId,
        accountId: opts.accountId,
        authBy: opts.authBy,
        type: opts.type,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
      },
    });
  }

  async logout(userId: string, token: string): Promise<AuthStatusData> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new BusinessException(ErrorCode.NOT_EXIST);

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

  private async getTokens(
    payload: Record<string, string>,
  ): Promise<AuthTokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.envConfig.jwtAccessKey,
        expiresIn: this.envConfig.accessExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.envConfig.jwtRefreshKey,
        expiresIn: this.envConfig.refreshExpires,
      }),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}
