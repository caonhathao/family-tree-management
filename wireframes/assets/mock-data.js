/* Dữ liệu giả cho wireframe. Giữ trong file để mọi screen dùng chung. */
(function (g) {
  "use strict";

  var me = { id: "u1", fullName: "Nguyễn Thanh Hà", role: "OWNER", email: "ha.nguyen@example.com" };

  /* 14 thành viên, 4 đời. photoId = ảnh đã gắn vào node. pinned = ảnh profile chụp tại lúc ghim. */
  var members = [
    { id: "m1", fullName: "Nguyễn Văn An", generation: 1, birthDate: "1942-03-02", deceased: true, deathDate: "2010-11-20", gender: "male", note: "" },
    { id: "m2", fullName: "Trần Thị Bà", generation: 1, birthDate: "1946-07-15", deceased: true, deathDate: "2015-01-08", gender: "female", note: "" },
    { id: "m3", fullName: "Nguyễn Văn Bình", generation: 2, parentId: "m1", spouseId: "m4", birthDate: "1968-05-21", deceased: false, gender: "male", note: "" },
    { id: "m4", fullName: "Lê Thị Cúc", generation: 2, birthDate: "1970-09-30", deceased: false, gender: "female", note: "" },
    { id: "m5", fullName: "Nguyễn Văn Cường", generation: 2, parentId: "m1", birthDate: "1971-01-11", deceased: false, gender: "male", note: "" },
    { id: "m6", fullName: "Phạm Thị Dung", generation: 2, spouseId: "m5", birthDate: "1973-04-04", deceased: false, gender: "female", note: "" },
    { id: "m7", fullName: "Nguyễn Thanh Hà", generation: 3, parentId: "m3", spouseId: "m8", birthDate: "1994-08-19", deceased: false, gender: "female", photoId: "ph1", pinnedMemberId: "u1", note: "Tự ghim ảnh hồ sơ của mình" },
    { id: "m8", fullName: "Đỗ Quang Minh", generation: 3, birthDate: "1992-12-05", deceased: false, gender: "male", note: "" },
    { id: "m9", fullName: "Nguyễn Thu Hà", generation: 3, parentId: "m3", birthDate: "1997-02-27", deceased: false, gender: "female", photoId: "ph2", note: "" },
    { id: "m10", fullName: "Nguyễn Văn Cường (Trung)", generation: 3, parentId: "m5", birthDate: "1999-06-05", deceased: false, gender: "male", note: "Trùng tên với ông nội — ông nội đã mất" },
    { id: "m11", fullName: "Trần Ngọc An", generation: 4, parentId: "m7", birthDate: "2021-05-14", deceased: false, gender: "female", birthday: true, photoId: "ph3", note: "" },
    { id: "m12", fullName: "Trần Đức Kiên", generation: 4, parentId: "m7", birthDate: "2023-10-02", deceased: false, gender: "male", birthday: true, note: "" },
    { id: "m13", fullName: "Phạm Gia Bảo", generation: 4, parentId: "m9", birthDate: "2019-03-22", deceased: false, gender: "male", note: "Cháu nội" },
    { id: "m14", fullName: "Phạm Gia Linh", generation: 4, parentId: "m9", birthDate: "2024-11-08", deceased: false, gender: "female", birthday: true, note: "" }
  ];

  var collaborators = [
    { id: "u1", fullName: "Nguyễn Thanh Hà", email: "ha.nguyen@example.com", role: "OWNER" },
    { id: "u2", fullName: "Nguyễn Văn Cường", email: "cuong.nguyen@example.com", role: "EDITOR" },
    { id: "u3", fullName: "Phạm Gia Linh", email: "linh.pham@example.com", role: "EDITOR" },
    { id: "u4", fullName: "Đỗ Quang Minh", email: "minh.do@example.com", role: "VIEWER" }
  ];

  var albums = [
    { id: "al1", name: "Họp mặt dòng họ 2024", createdById: "u1", createdAt: "2024-04-02", photos: 12, shared: true },
    { id: "al2", name: "Cưới Hà – Minh", createdById: "u1", createdAt: "2023-12-20", photos: 48, shared: true },
    { id: "al3", name: "Ảnh Bà ngoại", createdById: "u2", createdAt: "2025-02-14", photos: 7, shared: false },
    { id: "al4", name: "Trẻ con", createdById: "u4", createdAt: "2025-08-30", photos: 23, shared: true }
  ];

  var photos = [
    { id: "ph1", albumId: "al2", name: "wedding-hava.jpg", byUserId: "u1", at: "2023-12-20", hiddenById: null, shared: true },
    { id: "ph2", albumId: null, name: "thu-ha-2023.jpg", byUserId: "u1", at: "2023-07-01", hiddenById: null, shared: true },
    { id: "ph3", albumId: "al4", name: "an-2025.jpg", byUserId: "u4", at: "2025-08-30", hiddenById: null, shared: true },
    { id: "ph4", albumId: "al3", name: "ba-ngoai-01.jpg", byUserId: "u2", at: "2025-02-14", hiddenById: "u2", shared: false },
    { id: "ph5", albumId: "al1", name: "hop-mat-114.jpg", byUserId: "u1", at: "2024-04-02", hiddenById: null, shared: true },
    { id: "ph6", albumId: "al1", name: "hop-mat-115.jpg", byUserId: "u3", at: "2024-04-03", hiddenById: null, shared: true }
  ];

  var events = [
    { id: "e1", title: "Giỗ ông Nguyễn Văn An", date: "2026-10-02", type: "DEATH_ANNIVERSARY", familyMemberId: "m1", createdById: "u1" },
    { id: "e2", title: "Sinh nhật Trần Ngọc An", date: "2026-11-14", type: "BIRTHDAY", familyMemberId: "m11", createdById: "u1" },
    { id: "e3", title: "Giỗ bà Trần Thị Bà", date: "2026-09-08", type: "DEATH_ANNIVERSARY", familyMemberId: "m2", createdById: "u2" },
    { id: "e4", title: "Tết dính (không gắn với ai)", date: "2027-01-29", type: "FAMILY", familyMemberId: null, createdById: "u1" },
    { id: "e5", title: "Trùng tháng bảo An", date: "2026-09-21", type: "BIRTHDAY", familyMemberId: "m11", createdById: "u2" }
  ];

  /* 7 TARGET_TYPE — nhãn sinh từ mảng hằng số, không viết tay từng dòng (fe/02 §13) */
  var TARGET_TYPES = ["GROUP", "FAMILY", "MEMBER", "RELATIONSHIP", "ALBUM", "PHOTO", "EVENT"];
  var ACTIONS = [
    "GROUP_RENAMED", "FAMILY_LAYOUT_CHANGED", "MEMBER_ADDED", "MEMBER_UPDATED", "MEMBER_DELETED",
    "RELATION_ADDED", "RELATION_DELETED", "ALBUM_CREATED", "ALBUM_UPDATED", "ALBUM_DELETED",
    "PHOTO_ADDED", "PHOTO_DELETED", "PHOTO_HIDDEN", "PHOTO_UNHIDDEN",
    "NODE_PHOTO_ASSIGNED", "NODE_PHOTO_UNPINNED",
    "EVENT_CREATED", "EVENT_UPDATED", "EVENT_DELETED"
  ];

  var activity = [
    { id: "ac1", at: "2026-09-26T21:14:00Z", byUserId: "u2", action: "MEMBER_DELETED", targetType: "MEMBER", content: { snapshot: { fullName: "Phạm Thị Dung", birthDate: "1973-04-04", isDeceased: false } } },
    { id: "ac2", at: "2026-09-26T21:14:02Z", byUserId: "u2", action: "RELATION_DELETED", targetType: "RELATIONSHIP", content: { cascade: true, snapshot: { fullName: "Nguyễn Văn Cường" } } },
    { id: "ac3", at: "2026-09-25T09:02:00Z", byUserId: "u1", action: "FAMILY_LAYOUT_CHANGED", targetType: "FAMILY", content: { note: "Sắp xếp tự động + Lưu" } },
    { id: "ac4", at: "2026-09-24T16:40:00Z", byUserId: "u1", action: "MEMBER_UPDATED", targetType: "MEMBER", content: { diff: { fullName: { from: "Nguyễn Thu Hà", to: "Nguyễn Thu Hà (Hà 2)" } } } },
    { id: "ac5", at: "2026-09-24T16:41:00Z", byUserId: "u1", action: "NODE_PHOTO_ASSIGNED", targetType: "MEMBER", content: { photoId: "ph2", to: "Nguyễn Thu Hà" } },
    { id: "ac6", at: "2026-09-20T11:05:00Z", byUserId: "u4", action: "PHOTO_ADDED", targetType: "PHOTO", content: { photoId: "ph3", albumId: "al4", count: 6 } },
    { id: "ac7", at: "2026-09-20T11:06:00Z", byUserId: "u4", action: "ALBUM_CREATED", targetType: "ALBUM", content: { albumId: "al4", name: "Trẻ con" } },
    { id: "ac8", at: "2026-09-18T08:30:00Z", byUserId: "u2", action: "PHOTO_HIDDEN", targetType: "PHOTO", content: { photoId: "ph4" } },
    { id: "ac9", at: "2026-09-15T19:22:00Z", byUserId: "u1", action: "GROUP_RENAMED", targetType: "GROUP", content: { diff: { name: { from: "Nhà họ Nguyễn", to: "Nhà họ Nguyễn – Trần" } } } },
    { id: "ac10", at: "2026-09-12T13:00:00Z", byUserId: "u3", action: "MEMBER_ADDED", targetType: "MEMBER", content: { fullName: "Phạm Gia Linh", generation: 4 } },
    { id: "ac11", at: "2026-09-12T13:05:00Z", byUserId: "u3", action: "RELATION_ADDED", targetType: "RELATIONSHIP", content: { from: "Nguyễn Thu Hà", to: "Phạm Gia Linh", type: "PARENT" } },
    { id: "ac12", at: "2026-09-08T07:45:00Z", byUserId: "u2", action: "EVENT_CREATED", targetType: "EVENT", content: { eventId: "e3", title: "Giỗ bà Trần Thị Bà" } },
    { id: "ac13", at: "2026-09-05T15:12:00Z", byUserId: "u1", action: "ALBUM_DELETED", targetType: "ALBUM", content: { albumId: "al0", name: "Ảnh scan cũ", photosDeleted: 0 } },
    { id: "ac14", at: "2026-09-02T10:00:00Z", byUserId: "u1", action: "NODE_PHOTO_UNPINNED", targetType: "MEMBER", content: { from: "Nguyễn Văn Cường (Trung)" } },
    { id: "ac15", at: "2026-08-30T20:30:00Z", byUserId: "u4", action: "ALBUM_UPDATED", targetType: "ALBUM", content: { albumId: "al4", name: "Trẻ con 2025" } },
    { id: "ac16", at: "2026-08-28T09:15:00Z", byUserId: "u2", action: "PHOTO_DELETED", targetType: "PHOTO", content: { photoId: "ph9", albumId: "al3" } },
    { id: "ac17", at: "2026-08-22T14:05:00Z", byUserId: "u1", action: "PHOTO_UNHIDDEN", targetType: "PHOTO", content: { photoId: "ph8" } },
    { id: "ac18", at: "2026-08-20T12:00:00Z", byUserId: "u3", action: "MEMBER_UPDATED", targetType: "MEMBER", content: { diff: { birthDate: { from: "2024-11-08", to: "2024-11-09" } } } },
    { id: "ac19", at: "2026-08-18T17:40:00Z", byUserId: "u1", action: "EVENT_UPDATED", targetType: "EVENT", content: { eventId: "e4", diff: { date: { from: "2027-02-06", to: "2027-01-29" } } } },
    { id: "ac20", at: "2026-08-15T08:00:00Z", byUserId: "u1", action: "FAMILY_LAYOUT_CHANGED", targetType: "FAMILY", content: { note: "Lưu thủ công" } },
    { id: "ac21", at: "2026-08-11T16:00:00Z", byUserId: "u2", action: "MEMBER_ADDED", targetType: "MEMBER", content: { fullName: "Phạm Gia Bảo", generation: 4 } },
    { id: "ac22", at: "2026-08-09T10:00:00Z", byUserId: "u1", action: "PHOTO_ADDED", targetType: "PHOTO", content: { photoId: "ph5", albumId: "al1", count: 3 } }
  ];

  /* VIEWER chỉ thấy nhóm hành động này (fe/06 §7) */
  var VIEWER_ACTIONS = ["ALBUM_CREATED", "ALBUM_UPDATED", "ALBUM_DELETED", "PHOTO_ADDED", "PHOTO_DELETED", "PHOTO_HIDDEN", "PHOTO_UNHIDDEN"];

  var trash = {
    tree: [
      { id: "t1", kind: "MEMBER", name: "Phạm Thị Dung", birthDate: "1973-04-04", deletedById: "u2", deletedAt: "2026-09-26T21:14:00Z", withRelations: 1 },
      { id: "t2", kind: "RELATIONSHIP", name: "Quan hệ: Nguyễn Văn Cường → Nguyễn Văn Bình", deletedById: "u1", deletedAt: "2026-08-19T10:00:00Z", withRelations: 0 }
    ],
    media: [
      { id: "t3", kind: "PHOTO", name: "ba-ngoai-01.jpg", albumId: "al3", byUserId: "u2", deletedById: "u2", deletedAt: "2026-09-20T11:00:00Z" },
      { id: "t4", kind: "PHOTO", name: "scan-trang-04.jpg", albumId: null, byUserId: "u4", deletedAt: "2026-09-12T09:00:00Z" }
    ]
  };

  var shareLinks = [
    { id: "s1", token: "8fTq2kZm", createdAt: "2026-09-20", expiresAt: "2026-09-27", opens: 41, revoked: false },
    { id: "s2", token: "b1Xv7pRa", createdAt: "2026-08-15", expiresAt: "2026-08-22", opens: 12, revoked: false, expired: true },
    { id: "s3", token: "Lp4wQ9dK", createdAt: "2026-07-01", expiresAt: "2026-07-08", opens: 5, revoked: true }
  ];

  var invite = { token: "8fTq2kZm", inviterName: "Nguyễn Thanh Hà", groupName: "Nhà họ Nguyễn – Trần", expiresAt: "2026-09-27", role: "VIEWER" };

  g.MOCK = {
    me: me, group: { id: "g1", name: "Nhà họ Nguyễn – Trần", version: 42 },
    members: members, collaborators: collaborators,
    albums: albums, photos: photos, events: events,
    TARGET_TYPES: TARGET_TYPES, ACTIONS: ACTIONS, activity: activity, VIEWER_ACTIONS: VIEWER_ACTIONS,
    trash: trash, shareLinks: shareLinks, invite: invite,
    userById: function (id) {
      var all = [me].concat(collaborators);
      var f = all.filter(function (u) { return u.id === id; });
      return f.length ? f[0].fullName : "Không rõ";
    },
    memberById: function (id) {
      var f = members.filter(function (m) { return m.id === id; });
      return f.length ? f[0] : null;
    }
  };
})(window);
