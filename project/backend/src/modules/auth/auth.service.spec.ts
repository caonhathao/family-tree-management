import { AUTH_TYPE, PROVIDERS } from '@prisma/client';
import { AuthService } from './auth.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pw'),
  compare: jest.fn().mockResolvedValue(true),
}));

interface TxMock {
  account: { create: jest.Mock };
  user: {
    create: jest.Mock;
    findUnique: jest.Mock;
  };
  session: { create: jest.Mock; deleteMany: jest.Mock };
  authLog: { create: jest.Mock };
  userProfile: { update: jest.Mock; updateMany: jest.Mock };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock; findUnique: jest.Mock };
    account: { update: jest.Mock };
    session: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let envConfig: {
    googleClientId: string;
    jwtAccessKey: string;
    jwtRefreshKey: string;
    accessExpires: string;
    refreshExpires: number;
  };
  let tx: TxMock;

  const googlePayload = {
    email: 'existing@example.com',
    name: 'Google Name',
    picture: 'https://pics/1.jpg',
    emailVerified: true,
  };

  const baseUser = {
    id: 'user-1',
    email: 'existing@example.com',
    role: 'owner',
    userProfile: { fullName: 'Manual User', avatar: null },
  };

  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload });

    tx = {
      account: { create: jest.fn() },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      session: { create: jest.fn(), deleteMany: jest.fn() },
      authLog: { create: jest.fn() },
      userProfile: { update: jest.fn(), updateMany: jest.fn() },
    };

    prisma = {
      user: { findFirst: jest.fn(), findUnique: jest.fn() },
      account: { update: jest.fn() },
      session: { deleteMany: jest.fn() },
      $transaction: jest.fn().mockImplementation((arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: TxMock) => Promise<unknown>)(tx);
        }
        return Promise.resolve();
      }),
    };

    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt'),
    };

    envConfig = {
      googleClientId: 'client-id',
      jwtAccessKey: 'access-key',
      jwtRefreshKey: 'refresh-key',
      accessExpires: '15m',
      refreshExpires: 60 * 60 * 24 * 7,
    };

    service = new AuthService(
      prisma as never,
      jwtService as never,
      envConfig as never,
    );
  });

  describe('loginGoogle', () => {
    it('links a GOOGLE account when the user has a base auth with the same email', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null) // không có GOOGLE account
        .mockResolvedValueOnce({ ...baseUser }); // có USER account cùng email
      tx.account.create.mockResolvedValue({ id: 'account-new' });
      tx.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'owner',
        userProfile: { fullName: 'Manual User', avatar: null },
      });

      const result = await service.loginGoogle(
        { token: 'id-token' },
        { userAgent: 'ua', ipAddress: '1.2.3.4' },
      );

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(2);
      expect(tx.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          email: googlePayload.email,
          authProvider: { create: { provider: PROVIDERS.GOOGLE } },
        },
        select: { id: true },
      });

      expect(tx.userProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { fullName: 'Google Name', avatar: 'https://pics/1.jpg' },
      });

      expect(tx.session.deleteMany).toHaveBeenCalled();
      expect(tx.session.create).toHaveBeenCalled();
      expect(tx.authLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          accountId: 'account-new',
          authBy: PROVIDERS.GOOGLE,
          type: AUTH_TYPE.LOGIN,
          ipAddress: '1.2.3.4',
          userAgent: 'ua',
        },
      });

      expect(result.tokens).toEqual({ accessToken: 'at', refreshToken: 'rt' });
      expect(result.user).toEqual({
        id: 'user-1',
        role: 'owner',
        userProfile: { fullName: 'Manual User', avatar: null },
      });
    });

    it('reuses the existing GOOGLE account without creating a new one', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        accounts: [{ id: 'account-existing' }],
      });

      const result = await service.loginGoogle(
        { token: 'id-token' },
        { userAgent: 'ua', ipAddress: '1.2.3.4' },
      );

      expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.account.create).not.toHaveBeenCalled();
      expect(tx.userProfile.updateMany).not.toHaveBeenCalled();
      expect(tx.authLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          accountId: 'account-existing',
          authBy: PROVIDERS.GOOGLE,
          type: AUTH_TYPE.LOGIN,
          ipAddress: '1.2.3.4',
          userAgent: 'ua',
        },
      });
      expect(result.tokens).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    });

    it('creates a new user when the email is not linked anywhere', async () => {
      prisma.user.findFirst
        .mockResolvedValueOnce(null) // không có GOOGLE account
        .mockResolvedValueOnce(null); // không có USER account
      tx.user.create.mockResolvedValue({
        id: 'user-new',
        email: googlePayload.email,
        role: 'owner',
        userProfile: { fullName: 'Google Name', avatar: 'https://pics/1.jpg' },
        accounts: [{ id: 'account-new' }],
      });

      const result = await service.loginGoogle(
        { token: 'id-token' },
        { userAgent: 'ua', ipAddress: '1.2.3.4' },
      );

      expect(tx.user.create).toHaveBeenCalledWith({
        data: {
          email: googlePayload.email,
          userProfile: {
            create: {
              fullName: 'Google Name',
              avatar: 'https://pics/1.jpg',
            },
          },
          accounts: {
            create: {
              email: googlePayload.email,
              authProvider: { create: { provider: PROVIDERS.GOOGLE } },
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
      expect(tx.session.create).toHaveBeenCalled();
      expect(tx.authLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-new',
          accountId: 'account-new',
          authBy: PROVIDERS.GOOGLE,
          type: AUTH_TYPE.LOGIN,
          ipAddress: '1.2.3.4',
          userAgent: 'ua',
        },
      });
      expect(result.user.id).toBe('user-new');
    });

    it('throws when the Google id token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('invalid token'));

      await expect(
        service.loginGoogle(
          { token: 'bad-token' },
          { userAgent: 'ua', ipAddress: '1.2.3.4' },
        ),
      ).rejects.toThrow('invalid token');
    });
  });

  describe('changePassword', () => {
    it('updates the password and deletes other sessions, keeping the current one', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        accounts: [{ id: 'acc-1', password: 'hashed' }],
      });

      const result = await service.changePassword(
        'user-1',
        {
          oldPassword: 'old-pass',
          newPassword: 'new-pass',
          confirmPassword: 'new-pass',
        },
        'current-rt',
      );

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { password: 'hashed-pw' },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', token: { not: 'current-rt' } },
      });
      expect(result).toEqual({ success: true, message: 'ok' });
    });
  });
});
