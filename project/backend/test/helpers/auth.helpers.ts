import { TestApi } from '../api.client';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { LoginBaseDto } from 'src/modules/auth/dto/login.dto';
import {
  AuthResponse,
  AuthResult,
} from 'src/modules/auth/types/auth-response.type';

export interface RegisteredUser {
  id: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
}

export const register = (
  api: TestApi,
  dto: RegisterDto,
): Promise<AuthResponse> => api.post<AuthResponse>('/auth/register', dto);

export const login = (api: TestApi, dto: LoginBaseDto): Promise<AuthResponse> =>
  api.post<AuthResponse>('/auth/login-base', dto);

export const registerResult = (
  api: TestApi,
  dto: RegisterDto,
): Promise<AuthResult> => register(api, dto).then((body) => body.data);

export const createTestUser = async (
  api: TestApi,
  dto: RegisterDto,
): Promise<RegisteredUser> => {
  const body = await api.post<AuthResponse>('/auth/register', dto, {
    expect: 201,
  });
  return {
    id: body.data.user.id,
    email: dto.email,
    fullName: body.data.user.userProfile.fullName,
    accessToken: body.data.tokens.accessToken,
    refreshToken: body.data.tokens.refreshToken,
  };
};
