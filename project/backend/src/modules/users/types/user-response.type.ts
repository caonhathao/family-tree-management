import { ApiDataResponse } from 'src/common/constants/api';

export interface UserProfileResponse {
  fullName: string;
  avatar?: string;
  dateOfBirth?: string | null;
  biography?: string | null;
}

export interface UserResponseData {
  id: string;
  email: string;
  userProfile: UserProfileResponse;
}

export type UserResponse = ApiDataResponse<UserResponseData>;
