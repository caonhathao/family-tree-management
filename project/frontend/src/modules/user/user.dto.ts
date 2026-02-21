export interface UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  dateOfBirth?: string;
  biography?: {
    educationLevel: string;
    currentJob: string;
    introduction: string;
  };
}

export interface ResponseUpdateUserDto {
  fullName: string;
  dateOfBirth: Date | null;
  avatar: string | null;
  biography: string;
}
export interface IResponseGetUserDto {
  id: string;
  email: string;
  userProfile: {
    fullName: string;
    avatar: string;
    dateOfBirth: Date;
    biography: string;
  };
}
