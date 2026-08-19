import { HttpMethod } from "./http.client";

export const apiClient = {
  auth: {
    me: { url: "/api/auth/me", method: "GET" as HttpMethod },
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
    changePassword: {
      url: "/api/auth/change-password",
      method: "POST" as HttpMethod,
    },
    changeEmail: {
      url: "/api/auth/change-email",
      method: "POST" as HttpMethod,
    },
    unlinkProvider: {
      url: "/api/auth/unlink-provider",
      method: "POST" as HttpMethod,
    },
    linkGoogle: {
      url: "/api/auth/link-google",
      method: "POST" as HttpMethod,
    },
    verifyPassword: {
      url: "/api/auth/verify-password",
      method: "POST" as HttpMethod,
    },
    verifyGoogle: {
      url: "/api/auth/verify-google",
      method: "POST" as HttpMethod,
    },
    deleteAccount: {
      url: "/api/auth/account",
      method: "DELETE" as HttpMethod,
    },
  },
  family: {
    syncFamily: {
      url: (groupId: string) => `/api/family/sync-data/${groupId}`,
      method: "POST" as HttpMethod,
    },
    getFamily: {
      url: (groupId: string) => `/api/family/${groupId}`,
      method: "GET" as HttpMethod,
    },
    updateFamily: {
      url: (groupId: string) => `/api/family/${groupId}`,
      method: "PUT" as HttpMethod,
    },
    deleteFamily: {
      url: (familyId: string, groupId: string) =>
        `/api/family/${groupId}/${familyId}`,
      method: "DELETE" as HttpMethod,
    },
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
    updateUser: {
      url: (userId: string) => `/api/users/${userId}`,
      method: "PATCH" as HttpMethod,
    },
    getDetail: {
      url: (userId: string) => `/api/users/${userId}`,
      method: "GET" as HttpMethod,
    },
    getAll: { url: "/api/users", method: "GET" as HttpMethod },
    getAuthProviders: {
      url: (userId: string) => `/api/users/${userId}/auth-providers`,
      method: "GET" as HttpMethod,
    },
    getAuthLogs: {
      url: (userId: string) => `/api/users/${userId}/auth-logs`,
      method: "GET" as HttpMethod,
    },
  },
  groupMember: {
    updateRole: {
      url: (groupId: string) => `/api/group-member/${groupId}`,
      method: "PATCH" as HttpMethod,
    },
    changeLeader: {
      url: (groupId: string) => `/api/group-member/leader/${groupId}`,
      method: "PATCH" as HttpMethod,
    },
    deleteGroupMember: {
      url: (groupId: string, memberId: string) =>
        `/api/group-member/${groupId}/${memberId}`,
      method: "DELETE" as HttpMethod,
    },
  },
  invite: {
    createInvite: { url: "/api/invite", method: "POST" as HttpMethod },
    getInviteInfo: {
      url: (token: string) => `/api/invite/${token}`,
      method: "GET" as HttpMethod,
    },
  },
  blog: {
    upsert: "/api/blog",
    list: "/api/blog/list",
    get: (slug: string) => `/api/blog/${slug}`,
    delete: (slug: string) => `/api/blog/${slug}`,
  },
  blogMedia: {
    upload: "/api/blog-media/upload",
    cleanup: "/api/blog-media/cleanup",
  },
  events: {
    createEvent: { url: "/api/events", method: "POST" as HttpMethod },
    getAllEvents: { url: "/api/events", method: "GET" as HttpMethod },
    getEvent: {
      url: (eventId: string) => `/api/events/${eventId}`,
      method: "GET" as HttpMethod,
    },
    getEventInstances: {
      url: (eventId: string) => `/api/events/${eventId}/instances`,
      method: "GET" as HttpMethod,
    },
    updateEvent: {
      url: (eventId: string) => `/api/events/${eventId}`,
      method: "PATCH" as HttpMethod,
    },
    cancelInstance: {
      url: (eventId: string, instanceId: string) =>
        `/api/events/${eventId}/instances/${instanceId}`,
      method: "PATCH" as HttpMethod,
    },
    deleteEvent: {
      url: (eventId: string) => `/api/events/${eventId}`,
      method: "DELETE" as HttpMethod,
    },
  },
  notifications: {
    getAllNotifications: {
      url: "/api/notifications",
      method: "GET" as HttpMethod,
    },
    markRead: {
      url: (notificationId: string) =>
        `/api/notifications/${notificationId}/read`,
      method: "PATCH" as HttpMethod,
    },
    readAll: {
      url: "/api/notifications/read-all",
      method: "PATCH" as HttpMethod,
    },
  },
  health: {
    check: "/api/health-check",
  },
};
