export const apiClient = {
  auth: {
    register: "/api/auth/register",
    refresh: "/api/auth/refresh",
    loginBase: "/api/auth/login-base",
    loginGoogle: "/api/auth/login-google",
    resetPassword: "/api/auth/reset",
    logOut: "/api/auth/logout",
    createBaseAuth: "/api/auth/create-base-auth",
  },
  family: {
    syncFamily: (groupId: string) => `/api/family/sync-data/${groupId}`,
    updateFamily: (groupId: string) => `/api/family/${groupId}`,
    getFamily: (groupId: string) => `/api/family/${groupId}`,
    deleteFamily: (familyId: string, groupId: string) =>
      `/api/family/${groupId}/${familyId}`,
  },
  groupFamily: {
    createGroup: "/api/group-family",
    updateGroup: (groupId: string) => `/api/group-family/${groupId}`,
    getAll: "/api/group-family",
    getDetail: (groupId: string) => `/api/group-family/${groupId}`,
    deleteGroup: (groupId: string) => `/api/group-family/${groupId}`,
    quitGroup: (groupId: string) => `/api/group-family/${groupId}/quit`,
    joinGroup: (token: string) => `/api/group-family/join?token=${token}`,
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
