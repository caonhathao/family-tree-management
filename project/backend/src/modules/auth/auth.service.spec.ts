import { AUTH_TYPE, PROVIDERS } from '@prisma/client';
import { AuthService } from './auth.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

interface TxMock {
  account: { create: jest.Mock };
  session: { upsert: jest.Mock };
  authLog: { create: jest.Mock };
  userProfile: { update: jest.Mock };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findFirst: jest.Mock };
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
      session: { upsert: jest.fn() },
      authLog: { create: jest.fn() },
      userProfile: { update: jest.fn() },
    };

    prisma = {
      user: { findFirst: jest.fn() },
      $transaction: jest
        .fn()
        .mockImplementation((cb: (tx: TxMock) => Promise<unknown>) => cb(tx)),
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
    it('links a GOOGLE account when the email user has no GOOGLE account yet', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, accounts: [] });
      tx.account.create.mockResolvedValue({ id: 'account-new' });

      const result = await service.loginGoogle(
        { token: 'id-token' },
        { userAgent: 'ua', ipAddress: '1.2.3.4' },
      );

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: googlePayload.email },
        select: {
          id: true,
          email: true,
          role: true,
          userProfile: { select: { fullName: true, avatar: true } },
          accounts: {
            where: { authProvider: { provider: PROVIDERS.GOOGLE } },
            select: { id: true },
          },
        },
      });

      expect(tx.account.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          authProvider: { create: { provider: PROVIDERS.GOOGLE } },
        },
        select: { id: true },
      });

      expect(tx.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { avatar: 'https://pics/1.jpg' },
      });

      expect(tx.session.upsert).toHaveBeenCalled();
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

      expect(tx.account.create).not.toHaveBeenCalled();
      expect(tx.userProfile.update).not.toHaveBeenCalled();
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
});
