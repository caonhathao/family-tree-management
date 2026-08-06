import { apiRequest } from "./http.client";
import type { ApiResponse, PaginationMeta } from "@/types/api.types";
import type { IUserSession } from "@/types/auth.types";
import type {
  IAuthResponseDto,
  IGoogleLoginDto,
  ILoginBaseDto,
  INewBaseAuth,
  IRegisterDto,
} from "@/modules/auth/auth.dto";
import type {
  IResponseAuthLog,
  IResponseLinkProvidersDto,
  IResponseUserDto,
  IUserList,
} from "@/modules/user/user.dto";
import type {
  FamilyDto,
  IFamilyDto,
} from "@/modules/family/family.service-validator";
import type {
  ICreateGroupFamilyDto,
  IResponseGroupFamilyDetailDto,
  IResponseGroupFamiliesDto,
  IResponseJoinGroupDto,
  IUpdateGroupFamilyDto,
} from "@/modules/group-family/group-family.dto";
import type { UpdateGroupMemberDto } from "@/modules/group-member/group-member.dto";
import type {
  ICreateInviteDto,
  IResponseCreateInviteDto,
} from "@/modules/invite/invite.dto";
import type { BlogUpdateServiceDto } from "@/modules/blog/blog.service-validator";
import type { IBlogDto, IBlogsDto } from "@/modules/blog/blog.dto";
import type { IBlogMediaDto } from "@/modules/blog-media/blog.dto";
import type { BLOG_MEDIA_TYPE } from "@prisma/client";

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}

export class AuthApi {
  static login(data: ILoginBaseDto) {
    return apiRequest<IAuthResponseDto>("auth/login-base", {
      method: "POST",
      body: data,
    });
  }

  static register(data: IRegisterDto) {
    return apiRequest<IAuthResponseDto>("auth/register", {
      method: "POST",
      body: data,
    });
  }

  static loginGoogle(data: IGoogleLoginDto) {
    return apiRequest<IAuthResponseDto>("auth/login-google", {
      method: "POST",
      body: data,
    });
  }

  static reset(email: string) {
    return apiRequest<null>("auth/reset", {
      method: "POST",
      body: { email },
    });
  }

  static refresh(refreshToken: string) {
    return apiRequest<IAuthResponseDto>("auth/refresh", {
      method: "POST",
      token: refreshToken,
    });
  }

  static logout(refreshToken: string) {
    return apiRequest<null>("auth/logout", {
      method: "POST",
      token: refreshToken,
    });
  }

  static session() {
    return apiRequest<IUserSession>("auth/session");
  }

  static createBaseAuth(data: INewBaseAuth) {
    return apiRequest<null>("auth/create-base-auth", {
      method: "POST",
      body: data,
    });
  }
}

export class UserApi {
  static updateProfile(
    id: string,
    data: {
      fullName?: string;
      dateOfBirth?: string;
      biography?: string;
      avatar?: File;
    },
  ) {
    const formData = new FormData();
    if (data.fullName !== undefined) formData.append("fullName", data.fullName);
    if (data.dateOfBirth !== undefined)
      formData.append("dateOfBirth", data.dateOfBirth);
    if (data.biography !== undefined)
      formData.append("biography", data.biography);
    if (data.avatar !== undefined) formData.append("avatar", data.avatar);
    return apiRequest<IResponseUserDto>(`users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      formData,
    });
  }

  static getDetail(targetId: string, type: "self" | "target" = "target") {
    return apiRequest<IResponseUserDto>(
      `users/${encodeURIComponent(targetId)}`,
      { query: { type } },
    );
  }

  static getAll(
    params: {
      page?: number;
      limit?: number;
      filter?: string;
      filterType?: string;
    } = {},
  ) {
    return apiRequest<PaginatedData<IUserList>>("users", {
      query: { ...params },
    });
  }

  static getAuthProviders(targetId: string) {
    return apiRequest<IResponseLinkProvidersDto[]>(
      `users/${encodeURIComponent(targetId)}/auth-providers`,
    );
  }

  static getAuthLogs(targetId: string, page = 1, limit = 10) {
    return apiRequest<PaginatedData<IResponseAuthLog>>(
      `users/${encodeURIComponent(targetId)}/auth-logs`,
      { query: { page, limit } },
    );
  }
}

export class FamilyApi {
  static sync(groupId: string, data: FamilyDto) {
    return apiRequest<unknown>(
      `family/sync-data/${encodeURIComponent(groupId)}`,
      {
        method: "POST",
        body: data,
      },
    );
  }

  static get(groupId: string) {
    return apiRequest<unknown>(`family/${encodeURIComponent(groupId)}`);
  }

  static update(groupId: string, data: IFamilyDto) {
    return apiRequest<unknown>(`family/${encodeURIComponent(groupId)}`, {
      method: "PUT",
      body: data,
    });
  }

  static remove(groupId: string, familyId: string) {
    return apiRequest<unknown>(
      `family/${encodeURIComponent(groupId)}/${encodeURIComponent(familyId)}`,
      { method: "DELETE" },
    );
  }
}

export class GroupFamilyApi {
  static create(data: ICreateGroupFamilyDto) {
    return apiRequest<unknown>("group-family", {
      method: "POST",
      body: data,
    });
  }

  static update(id: string, data: IUpdateGroupFamilyDto) {
    return apiRequest<unknown>(`group-family/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: data,
    });
  }

  static getAll() {
    return apiRequest<IResponseGroupFamiliesDto[]>("group-family");
  }

  static getDetail(id: string) {
    return apiRequest<IResponseGroupFamilyDetailDto>(
      `group-family/${encodeURIComponent(id)}`,
    );
  }

  static destroy(id: string) {
    return apiRequest<unknown>(`group-family/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  static quit(id: string) {
    return apiRequest<unknown>(`group-family/${encodeURIComponent(id)}/quit`, {
      method: "DELETE",
    });
  }

  static join(token: string) {
    return apiRequest<IResponseJoinGroupDto>("group-family/join", {
      method: "POST",
      query: { token },
    });
  }
}

export class GroupMemberApi {
  static updateRole(groupId: string, data: UpdateGroupMemberDto) {
    return apiRequest<unknown>(`group-member/${encodeURIComponent(groupId)}`, {
      method: "PATCH",
      body: data,
    });
  }

  static changeLeader(groupId: string, data: UpdateGroupMemberDto) {
    return apiRequest<unknown>(
      `group-member/leader/${encodeURIComponent(groupId)}`,
      { method: "PATCH", body: data },
    );
  }

  static remove(groupId: string, memberId: string) {
    return apiRequest<unknown>(
      `group-member/${encodeURIComponent(groupId)}/${encodeURIComponent(memberId)}`,
      { method: "DELETE" },
    );
  }
}

export class InviteApi {
  static create(data: ICreateInviteDto) {
    return apiRequest<IResponseCreateInviteDto>("invite", {
      method: "POST",
      body: data,
    });
  }
}

export class BlogApi {
  static upsert(data: BlogUpdateServiceDto) {
    return apiRequest<unknown>("blog", {
      method: "POST",
      body: data,
    });
  }

  static list(
    params: {
      page?: number;
      limit?: number;
      filter?: string;
      filterType?: string;
    } = {},
  ) {
    return apiRequest<PaginatedData<IBlogsDto>>("blog/list", {
      query: { ...params },
    });
  }

  static get(slug: string) {
    return apiRequest<IBlogDto>(`blog/${encodeURIComponent(slug)}`);
  }
}

export class BlogMediaApi {
  static upload(type: BLOG_MEDIA_TYPE, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return apiRequest<IBlogMediaDto>("blog-media/upload", {
      method: "POST",
      formData,
    });
  }

  static cleanup() {
    return apiRequest<unknown>("blog-media/cleanup", {
      method: "DELETE",
    });
  }
}

export type ApiEndpointMap = {
  auth: typeof AuthApi;
  user: typeof UserApi;
  family: typeof FamilyApi;
  groupFamily: typeof GroupFamilyApi;
  groupMember: typeof GroupMemberApi;
  invite: typeof InviteApi;
  blog: typeof BlogApi;
  blogMedia: typeof BlogMediaApi;
};

export const Api: ApiEndpointMap = {
  auth: AuthApi,
  user: UserApi,
  family: FamilyApi,
  groupFamily: GroupFamilyApi,
  groupMember: GroupMemberApi,
  invite: InviteApi,
  blog: BlogApi,
  blogMedia: BlogMediaApi,
};

export type { ApiResponse };
