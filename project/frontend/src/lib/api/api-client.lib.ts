import { HttpMethod } from "./http.client";

export const apiClient = {
  auth: {
    register: { url: "/api/auth/register", method: "POST" as HttpMethod },
    refresh: {
      url: "/api/auth/refresh",
      method: "POST" as HttpMethod,
    },
    loginBase: { url: "/api/auth/login-base", method: "POST" as HttpMethod },
    loginGoogle: {
      url: "/api/auth/login-google",
      method: "POST" as HttpMethod,
    },
    resetPassword: { url: "/api/auth/reset", method: "POST" as HttpMethod },
    logOut: { url: "/api/auth/logout", method: "POST" as HttpMethod },
    createBaseAuth: {
      url: "/api/auth/create-base-auth",
      method: "POST" as HttpMethod,
    },
  },
  family: {
    syncFamily: (groupId: string) => `/api/family/sync-data/${groupId}`,
    updateFamily: (groupId: string) => `/api/family/${groupId}`,
    getFamily: (groupId: string) => `/api/family/${groupId}`,
    deleteFamily: (familyId: string, groupId: string) =>
      `/api/family/${groupId}/${familyId}`,
  },
  groupFamily: {
    createGroup: { url: "/api/group-family", method: "POST" as HttpMethod },
    updateGroup: {
      url: (groupId: string) => `/api/group-family/${groupId}`,
      method: "PATCH" as HttpMethod,
    },

    getAll: {
      url: "/api/group-family",
      method: "GET" as HttpMethod,
    },
    getDetail: {
      url: (groupId: string) => `/api/group-family/${groupId}`,
      method: "GET" as HttpMethod,
    },
    deleteGroup: {
      url: (groupId: string) => `/api/group-family/${groupId}`,
      method: "DELETE" as HttpMethod,
    },
    quitGroup: {
      url: (groupId: string) => `/api/group-family/${groupId}/quit`,
      method: "DELETE" as HttpMethod,
    },
    joinGroup: {
      url: (token: string) => `/api/group-family/join?token=${token}`,
      method: "POST" as HttpMethod,
    },
  },
  user: {
    updateUser: (userId: string) => `/api/users/${userId}`,
    getDetail: (userId: string) => `/api/users/${userId}`,
    getAll: "/api/users",
    getAuthProviders: (userId: string) => `/api/users/${userId}/auth-providers`,
    getAuthLogs: (userId: string) => `/api/users/${userId}/auth-logs`,
  },
  groupMember: {
    updateRole: (groupId: string) => `/api/group-member/${groupId}`,
    changeLeader: (groupId: string) => `/api/group-member/leader/${groupId}`,
    deleteGroupMember: (groupId: string, memberId: string) =>
      `/api/group-member/${groupId}/${memberId}`,
    removeFromGroup: (groupId: string, memberId: string) =>
      `/api/group-member/${groupId}/${memberId}`,
  },
  invite: {
    createInvite: "/api/invite",
  },
  blog: {
    upsert: "/api/blog",
    list: "/api/blog/list",
    get: (slug: string) => `/api/blog/${slug}`,
  },
  blogMedia: {
    upload: "/api/blog-media/upload",
    cleanup: "/api/blog-media/cleanup",
  },
  health: {
    check: "/api/health-check",
  },
};
