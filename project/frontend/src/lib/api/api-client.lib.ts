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
