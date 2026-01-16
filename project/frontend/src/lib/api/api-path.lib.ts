export const apiClient = {
  auth: {
    register: "/api/auth/register",
    refresh: "/api/auth/refresh",
    loginBase: "/api/auth/login-base",
  },
  family: {
    createFamily: (groupId: string) => `/api/family/${groupId}`,
    updateFamily: (groupId: string) => `/api/family/${groupId}`,
    getFamily: (familyId: string) => `/api/family/${familyId}`,
    deleteFamily: (familyId: string, groupId: string) =>
      `/api/family/${familyId}/${groupId}`,
  },
  familyMember: {
    createMember: (groupId: string) => `/api/member/${groupId}`,
    updateMember: (groupId: string) => `/api/member/${groupId}`,
    getOneMember: (memberId: string) => `/api/member/${memberId}`,
    getAllMembers: (familyId: string) => `/api/member/${familyId}`,
    deleteMember: (memberId: string, familyId: string) =>
      `/api/member/${memberId}/${familyId}`,
  },
  relationship: {
    createRelationship: `/api/relationship`,
    updateRelatioship: (relatioshipId: string) =>
      `/api/relationship/${relatioshipId}`,
    deleteRelationship: (relationshipId: string, familyId: string) =>
      `/api/relationship/${relationshipId}/${familyId}`,
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
  },
  invite: {
    createInvite: "/api/invite",
  },
};
