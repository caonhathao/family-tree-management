export const apiClient = {
  auth: {
    register: "/api/auth/register",
    refresh: "/api/auth/refresh",
    loginBase: "/api/auth/login-base",
    loginGoogle: "/api/auth/login-google",
    resetPassword: "/api/auth/reset",
    logOut: "/api/auth/logout",
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
    getAll: "/api/group-family",
    updateGroup: (groupId: string) => `/api/group-family/${groupId}`,
    getDetail: (groupId: string) => `/api/group-family/${groupId}`,
    joinGroup: (token: string) => `/api/group-family/join?token=${token}`,
  },
  user: {
    updateUser: (userId: string) => `/api/users/${userId}`,
    getDetail: (userId: string) => `/api/users/${userId}`,
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
};
