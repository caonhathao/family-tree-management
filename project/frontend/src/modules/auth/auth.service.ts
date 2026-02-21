import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
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

const getTokens = (payload: Record<string, string>) => {
  const accessToken = jwt.sign({ payload }, EnvConfig.jwtAccessSecret, {
    expiresIn: EnvConfig.accessTokenExpireIn,
  });
  const refreshToken = jwt.sign({ payload }, EnvConfig.jwtRefreshSecret, {
    expiresIn: EnvConfig.refreshTokenExpireIn,
  });

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
      },
    });

    //if user is eixist, generate new token and session
    //if not, register account
    if (user) {
      const payload = {
        id: user.id,
        role: user.role,
      };
      const tokens = getTokens(payload);
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
          expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
        },
        create: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
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
    } else {
      const newUser = await prisma.user.create({
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
        throw new Error("can not create new user profile");
      } else {
        const payload = {
          id: newUser.id,
          role: newUser.role,
        };
        const tokens = getTokens(payload);

        await prisma.session.create({
          data: {
            userId: newUser.id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
            userAgent: userAgent,
            ipAddress: ipAddress,
          },
        });

        return {
          user: {
            id: newUser.id,
            role: newUser.role,
            userProfile: newUser.userProfile,
          },
          tokens,
        } as IAuthResponseDto;
      }
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

const refresh = async (userId: string, refreshToken: string) => {
  const uuidSchema = z.string().uuid();
  try {
    const checkId = uuidSchema.safeParse(userId);
    if (!checkId.success) {
      throw new Error("Invalid token");
    }

    const currentSession = await prisma.session.findFirst({
      where: { token: refreshToken },
    });
    if (!currentSession) {
      await prisma.session.deleteMany({ where: { userId } });
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

    const tokens = getTokens({ id: user.id, role: user.role });

    await prisma.session.update({
      where: { id: currentSession.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
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
  const newUser = await prisma.user.create({
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
    throw new Error("Can not create new user profile");
  } else {
    const payload = {
      id: newUser.id,
      role: newUser.role,
    };
    const tokens = getTokens(payload);

    await prisma.session.create({
      data: {
        userId: newUser.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    });

    return {
      user: {
        id: newUser.id,
        role: newUser.role,
        userProfile: newUser.userProfile,
      },
      tokens,
    } as IAuthResponseDto;
  }
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

    if (!user) {
      throw new Error("User not found");
    }

    if (user?.account) {
      if (!user.account?.password) {
        throw new Error("Email incorrect");
      } else {
        const isPWValid = await bcrypt.compare(
          data.password,
          user.account?.password,
        );
        if (!isPWValid) {
          throw new Error("Password incorrect");
        }
      }
    }

    const payload = { id: user.id, role: user.role };
    const tokens = getTokens(payload);

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
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
      },
      create: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + EnvConfig.refreshTokenExpireIn),
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

export const AuthService = {
  loginGoogle,
  logout,
  refresh,
  register,
  loginBase,
};
