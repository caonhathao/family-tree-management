import * as bcrypt from "bcrypt";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { EnvConfig } from "@/lib/env/env-config.lib";
import { prisma } from "@/lib/prisma";
import { IAuthResponseDto } from "./auth.dto";
import {
  GoogleLoginDto,
  LoginBaseDto,
  RegisterServiceDto,
} from "./auth.service-validator";
import z from "zod";
import { validator } from "../_common/validator";
import { IUserSession } from "@/types/auth.types";
import { SignJWT } from "jose";
import { AUTH_TYPE, PROVIDERS } from "@prisma/client";
const getTokens = async (payload: Record<string, string>) => {
  const accessSecret = new TextEncoder().encode(EnvConfig.jwtAccessSecret);
  const refreshSecret = new TextEncoder().encode(EnvConfig.jwtRefreshSecret);

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EnvConfig.accessTokenExpireIn}s`)
    .sign(accessSecret);
  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${EnvConfig.refreshTokenExpireIn}s`)
    .sign(refreshSecret);

  return { accessToken, refreshToken };
};

const loginGoogle = async (
  token: GoogleLoginDto,
  { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
) => {
  try {
    const client = new OAuth2Client(EnvConfig.googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: token.token,
      audience: EnvConfig.googleClientId,
    });

    const payload: TokenPayload | undefined = ticket.getPayload();
    if (!payload) {
      throw new Error("Bad request");
    }

    //check user in database
    const user = await prisma.user.findFirst({
      where: {
        email: payload?.email,
      },
      select: {
        id: true,
        role: true,
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
        account: {
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

    //if user is eixist, generate new token and session
    if (user) {
      const payload = {
        id: user.id,
        role: user.role,
      };
      const tokens = await getTokens(payload);
      const safeUserAgent = userAgent || "unknown";

      const [session, authLog] = await prisma.$transaction([
        //create session
        prisma.session.upsert({
          where: {
            userId_userAgent: {
              userId: user.id,
              userAgent: safeUserAgent,
            },
          },
          update: {
            token: tokens.refreshToken,
            expiresAt: new Date(
              Date.now() + EnvConfig.refreshTokenExpireIn * 1000,
            ),
          },
          create: {
            userId: user.id,
            token: tokens.refreshToken,
            expiresAt: new Date(
              Date.now() + EnvConfig.refreshTokenExpireIn * 1000,
            ),
            userAgent: userAgent,
            ipAddress: ipAddress,
          },
        }),
        //craete log
        prisma.authLog.create({
          data: {
            accountId: user.account[0].id,
            ipAddress: ipAddress,
            userAgent: userAgent,
            type: AUTH_TYPE.LOGIN,
            authBy: PROVIDERS.GOOGLE,
          },
        }),
      ]);

      return {
        user: {
          id: user.id,
          role: user.role,
          userProfile: user.userProfile,
        },
        tokens,
      } as IAuthResponseDto;
    }
    //if new user, create new records
    else {
      //create user,account,provider and log
      const result = await prisma.$transaction(async (tx) => {
        // 1. Tạo User cùng với Profile và Account lồng nhau
        const newUser = await tx.user.create({
          data: {
            email: payload.email as string,
            userProfile: {
              create: {
                fullName: payload.name as string,
                avatar: payload.picture as string,
              },
            },
            account: {
              create: {
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
            role: true,
            userProfile: {
              select: {
                fullName: true,
                avatar: true,
              },
            },
            account: {
              select: {
                id: true,
              },
            },
          },
        });

        // Kiểm tra sớm (Early return/throw) để rollback transaction nếu lỗi profile
        if (
          !newUser.userProfile ||
          !newUser.account ||
          newUser.account.length === 0
        ) {
          throw new Error("Failed to create user profile or account relation");
        }

        // 2. Tạo Auth Log liên kết với Account vừa tạo
        await tx.authLog.create({
          data: {
            accountId: newUser.account[0].id,
            ipAddress: ipAddress,
            userAgent: userAgent,
            type: AUTH_TYPE.LOGIN,
            authBy: PROVIDERS.GOOGLE,
          },
        });

        // 3. Tạo Token xác thực hệ thống
        const tokenPayload = {
          id: newUser.id,
          role: newUser.role,
        };
        const tokens = await getTokens(tokenPayload);

        // 4. Tạo Session phiên làm việc cho User
        await tx.session.create({
          data: {
            userId: newUser.id,
            token: tokens.refreshToken,
            expiresAt: new Date(
              Date.now() + EnvConfig.refreshTokenExpireIn * 1000,
            ),
            userAgent: userAgent,
            ipAddress: ipAddress,
          },
        });

        // Trả về data mong muốn sau khi tất cả các bước trên DB thành công
        return {
          user: {
            id: newUser.id,
            role: newUser.role,
            userProfile: newUser.userProfile,
          },
          tokens,
        } as IAuthResponseDto;
      });

      return result;
    }
  } catch (err) {
    console.error("error at login by google", err);
    throw err;
  }
};

const logout = async (userId: string, token: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      await tx.session.deleteMany({
        where: {
          userId: user.id,
          token: token,
        },
      });

      return { success: true };
    });
  } catch (err) {
    console.error("error at logout service:", err);
    throw err;
  }
};

const refresh = async (
  userId: string,
  refreshToken: string,
  metadata: { ipAddress: string; userAgent: string },
) => {
  const uuidSchema = z.string().uuid();
  try {
    const checkId = uuidSchema.safeParse(userId);
    if (!checkId.success) {
      throw new Error("Invalid token");
    }

    //console.log(refreshToken);
    const currentSession = await prisma.session.findFirst({
      where: { token: refreshToken },
    });
    //console.log(currentSession);
    if (!currentSession) {
      // await prisma.session.deleteMany({ where: { userId } });
      throw new Error("Security warning: Invalid session");
    }

    if (currentSession.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: currentSession.id } });
      throw new Error("Session expired");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        userProfile: {
          select: {
            avatar: true,
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const tokens = await getTokens({ id: user.id, role: user.role });

    await prisma.session.upsert({
      where: { id: currentSession.id },
      update: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn * 1000),
      },
      create: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn * 1000),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    });

    return {
      user: {
        id: user.id,
        role: user.role,
        userProfile: user.userProfile,
      },
      tokens,
    } as IAuthResponseDto;
  } catch (err) {
    console.error("error at refresh service:", err);
    throw err;
  }
};

const register = async (
  data: RegisterServiceDto,
  metadata: { ipAddress: string; userAgent: string },
) => {
  const email = await prisma.user.findFirst({
    where: {
      email: data.email,
    },
  });

  if (email) {
    throw new Error("Email already exists");
  }

  const hashedPW = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Tạo User, Account, AuthProvider và Profile đồng thời
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        userProfile: {
          create: { fullName: data.fullName },
        },
        account: {
          create: {
            password: hashedPW,
            authProvider: {
              create: { provider: PROVIDERS.USER },
            },
          },
        },
      },
      select: {
        id: true,
        role: true,
        userProfile: {
          select: { fullName: true, avatar: true },
        },
        account: {
          select: { id: true },
        },
      },
    });

    // Kiểm tra điều kiện sớm để bảo vệ dữ liệu và tránh lỗi TypeScript
    if (!newUser.userProfile || !newUser.account) {
      throw new Error("Failed to create user profile or account");
    }

    // 2. Tạo Token hệ thống
    const tokens = await getTokens({ id: newUser.id, role: newUser.role });

    // 3. Tạo Session và AuthLog song song thông qua Promise.all để tối ưu hiệu năng
    await Promise.all([
      tx.session.create({
        data: {
          userId: newUser.id,
          token: tokens.refreshToken,
          expiresAt: new Date(
            Date.now() + EnvConfig.refreshTokenExpireIn * 1000,
          ),
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
        },
      }),
      tx.authLog.create({
        data: {
          accountId: newUser.account[0].id,
          authBy: PROVIDERS.USER,
          type: AUTH_TYPE.REGISTER,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    ]);

    // 4. Trả về kết quả sau khi transaction thành công thành công
    return {
      user: {
        id: newUser.id,
        role: newUser.role,
        userProfile: newUser.userProfile,
      },
      tokens,
    } as IAuthResponseDto;
  });

  return result;
};

const loginBase = async (
  data: LoginBaseDto,
  { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        account: {
          select: {
            password: true,
            authProvider: {
              where: {
                provider: PROVIDERS.USER,
              },
            },
          },
          take: 1,
        },
        userProfile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user?.account) {
      if (!user.account[0].password) {
        throw new Error("Email incorrect");
      } else {
        const isPWValid = await bcrypt.compare(
          data.password,
          user.account[0].password,
        );
        if (!isPWValid) {
          throw new Error("Password incorrect");
        }
      }
    }

    const payload = { id: user.id, role: user.role };
    const tokens = await getTokens(payload);

    const safeUserAgent = userAgent || "unknown";
    await prisma.session.upsert({
      where: {
        userId_userAgent: {
          userId: user.id,
          userAgent: safeUserAgent,
        },
      },
      update: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn * 1000),
      },
      create: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn * 1000),
        userAgent: userAgent,
        ipAddress: ipAddress,
      },
    });

    return {
      user: {
        id: user.id,
        role: user.role,
        userProfile: user.userProfile,
      },
      tokens,
    } as IAuthResponseDto;
  } catch (err) {
    console.error("login failed: ", err);
    throw err;
  }
};

const getUserSession = async ({ userId }: { userId: string }) => {
  try {
    //check validation
    const user = await validator(userId, (id) =>
      prisma.user.findUnique({
        where: { id },
        select: {
          userProfile: {
            select: {
              fullName: true,
              avatar: true,
            },
          },
        },
      }),
    );
    return {
      fullName: user?.userProfile?.fullName ?? "",
      avatar: user?.userProfile?.avatar ?? "",
    } as IUserSession;
  } catch (err) {
    console.log("error at get user session service:", err);
    throw err;
  }
};

export const AuthService = {
  loginGoogle,
  logout,
  refresh,
  register,
  loginBase,
  getUserSession,
};
