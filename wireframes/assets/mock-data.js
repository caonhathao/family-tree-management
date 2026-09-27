/* ==========================================================================
   wireframes/assets/mock-data.js
   Dữ liệu giả cho wireframe. Chỉ giữ những gì thực sự hiện trên màn hình —
   không có mảng dữ liệu "để dành". Ảnh không có file thật nên photoId chỉ là
   con trỏ: node hiện chữ cái, thẻ album hiện ô trống.
   Nguồn số liệu: docs/planing-refactor-fe/06-workflow-user.md
   ========================================================================== */
(function () {
  "use strict";

  var me = { id: "u1", fullName: "Nguyễn Thanh Hà", email: "ha.nguyen@example.com" };

  var group = { id: "g1", name: "Nhà họ Nguyễn – Trần", version: 42, hasEventToday: true };

  /* Cây 4 đời. generation = 0..3, khớp y = generation * RANK_SEP. */
  var members = [
    { id: "m1", fullName: "Nguyễn Văn Minh",  gender: "MALE",   birthDate: "1925-03-02", generation: 0, isDeceased: true },
    { id: "m2", fullName: "Trần Thị Hồng",   gender: "FEMALE", birthDate: "1930-07-19", generation: 0, isDeceased: true },
    { id: "m3", fullName: "Nguyễn Văn Cường", gender: "MALE",   birthDate: "1948-11-05", generation: 1 },
    { id: "m4", fullName: "Lê Thị Lan",       gender: "FEMALE", birthDate: "1952-01-30", generation: 1 },
    { id: "m5", fullName: "Trần Thị Mai",     gender: "FEMALE", birthDate: "1955-09-12", generation: 1 },
    { id: "m6", fullName: "Nguyễn Thanh Hà",  gender: "FEMALE", birthDate: "1975-06-21", generation: 2, photoId: "ph1", pinnedMemberId: "u1" },
    { id: "m7", fullName: "Nguyễn Văn Tuấn",  gender: "MALE",   birthDate: "1972-02-14", generation: 2 },
    { id: "m8", fullName: "Trần Quốc Bảo",    gender: "MALE",   birthDate: "1978-05-08", generation: 2 },
    { id: "m9", fullName: "Nguyễn Minh Khôi",  gender: "MALE",   birthDate: "2005-04-02", generation: 3, photoId: "ph2" },
    { id: "m10", fullName: "Nguyễn Bích Ngọc", gender: "FEMALE", birthDate: "2010-12-25", generation: 3 },
    { id: "m11", fullName: "Trần Ngọc Mai",    gender: "FEMALE", birthDate: "2008-08-09", generation: 3, photoId: "ph3" },
    { id: "m12", fullName: "Nguyễn Minh Anh",  gender: "MALE",   birthDate: "2013-03-18", generation: 3 }
  ];

  /* Gửi 1 chiều: luôn ghi PARENT (cha/mẹ -> con). Đọc thì server trả về cả 2 chiều. */
  var relations = [
    { id: "r1", type: "SPOUSE", fromMemberId: "m1", toMemberId: "m2" },
    { id: "r2", type: "SPOUSE", fromMemberId: "m3", toMemberId: "m4" },
    { id: "r3", type: "SPOUSE", fromMemberId: "m6", toMemberId: "m7" },
    { id: "r4", type: "PARENT", fromMemberId: "m1", toMemberId: "m3" },
    { id: "r5", type: "PARENT", fromMemberId: "m2", toMemberId: "m3" },
    { id: "r6", type: "PARENT", fromMemberId: "m1", toMemberId: "m5" },
    { id: "r7", type: "PARENT", fromMemberId: "m2", toMemberId: "m5" },
    { id: "r8", type: "PARENT", fromMemberId: "m3", toMemberId: "m6" },
    { id: "r9", type: "PARENT", fromMemberId: "m4", toMemberId: "m6" },
    { id: "r10", type: "PARENT", fromMemberId: "m3", toMemberId: "m7" },
    { id: "r11", type: "PARENT", fromMemberId: "m4", toMemberId: "m7" },
    { id: "r12", type: "PARENT", fromMemberId: "m5", toMemberId: "m8" },
    { id: "r13", type: "PARENT", fromMemberId: "m6", toMemberId: "m9" },
    { id: "r14", type: "PARENT", fromMemberId: "m7", toMemberId: "m9" },
    { id: "r15", type: "PARENT", fromMemberId: "m6", toMemberId: "m10" },
    { id: "r16", type: "PARENT", fromMemberId: "m7", toMemberId: "m10" },
    { id: "r17", type: "PARENT", fromMemberId: "m8", toMemberId: "m11" },
    { id: "r18", type: "PARENT", fromMemberId: "m6", toMemberId: "m12" },
    { id: "r19", type: "PARENT", fromMemberId: "m7", toMemberId: "m12" }
  ];

  var collaborators = [
    { id: "u1", fullName: "Nguyễn Thanh Hà",  email: "ha.nguyen@example.com",     role: "OWNER"  },
    { id: "u2", fullName: "Trần Quốc Bảo",    email: "bao.tran@example.com",      role: "EDITOR" },
    { id: "u3", fullName: "Lê Minh Linh",     email: "linh.le@example.com",       role: "EDITOR" },
    { id: "u4", fullName: "Phạm Thu Hà",      email: "ha.pham@example.com",       role: "VIEWER" }
  ];

  /* Media thuộc về người tải (createdById). Quyền sửa/xoá = người tải HOẶC chủ nhóm. */
  var albums = [
    { id: "al1", name: "Họp mặt dòng họ 2025", createdById: "u1", shared: true,  photoIds: ["ph1", "ph2", "ph3"] },
    { id: "al2", name: "Ảnh gia đình",        createdById: "u2", shared: true,  photoIds: ["ph4", "ph5"] },
    { id: "al3", name: "Kỷ niệm Hà Nội",      createdById: "u4", shared: true,  photoIds: ["ph6"] }
  ];
  var photos = [
    { id: "ph1", name: "ho-hop-mat-2025.jpg", albumId: "al1", createdById: "u1", shared: true,  hiddenById: null },
    { id: "ph2", name: "khoai-1.jpg",         albumId: "al1", createdById: "u1", shared: true,  hiddenById: null },
    { id: "ph3", name: "mai-1.jpg",           albumId: "al1", createdById: "u1", shared: true,  hiddenById: null },
    { id: "ph4", name: "ba-ngoai-01.jpg",     albumId: "al2", createdById: "u2", shared: true,  hiddenById: "u2" },
    { id: "ph5", name: "scan-trang-04.jpg",   albumId: "al2", createdById: "u2", shared: true,  hiddenById: null },
    { id: "ph6", name: "hoa-sen-02.jpg",      albumId: "al3", createdById: "u4", shared: true,  hiddenById: null }
  ];

  var events = [
    { id: "e1", title: "Sinh nhật Minh Khôi",   date: "2005-04-02", familyMemberId: "m9",  createdById: "u1" },
    { id: "e2", title: "Kỷ niệm cưới",          date: "1980-05-12", familyMemberId: "m5",  createdById: "u1" },
    { id: "e3", title: "Giỗ cụ Nguyễn Văn Minh", date: "2026-10-15", familyMemberId: "m1", createdById: "u2" },
    { id: "e4", title: "Tết Bính Ngọ",          date: "2026-02-17", familyMemberId: null, createdById: "u1" }
  ];

  var TARGET_TYPES = ["FAMILY", "MEMBER", "RELATIONSHIP", "ALBUM", "PHOTO", "EVENT", "GROUP"];
  var TARGET_LABEL = {
    FAMILY: "Cây gia đình", MEMBER: "Thành viên", RELATIONSHIP: "Quan hệ",
    ALBUM: "Album", PHOTO: "Ảnh", EVENT: "Sự kiện", GROUP: "Nhóm"
  };
  var ACTIONS = [
    "MEMBER_ADDED", "MEMBER_UPDATED", "MEMBER_DELETED", "MEMBER_PHOTO_SET",
    "RELATION_ADDED", "RELATION_UPDATED", "RELATION_DELETED",
    "FAMILY_RENAMED", "FAMILY_LAYOUT_CHANGED",
    "ALBUM_CREATED", "PHOTO_ADDED", "PHOTO_DELETED", "PHOTO_HIDDEN", "PHOTO_UNHIDDEN",
    "EVENT_CREATED", "EVENT_UPDATED", "EVENT_DELETED",
    "MEMBER_ROLE_CHANGED", "OWNERSHIP_TRANSFERRED"
  ];
  var ACTION_LABEL = {
    MEMBER_ADDED: "Thêm thành viên", MEMBER_UPDATED: "Sửa thành viên", MEMBER_DELETED: "Xoá thành viên",
    MEMBER_PHOTO_SET: "Gắn ảnh cho node", RELATION_ADDED: "Thêm quan hệ", RELATION_UPDATED: "Sửa quan hệ",
    RELATION_DELETED: "Xoá quan hệ", FAMILY_RENAMED: "Đổi tên cây", FAMILY_LAYOUT_CHANGED: "Lưu bố cục",
    ALBUM_CREATED: "Tạo album", PHOTO_ADDED: "Thêm ảnh", PHOTO_DELETED: "Xoá ảnh",
    PHOTO_HIDDEN: "Ẩn ảnh", PHOTO_UNHIDDEN: "Bỏ ẩn ảnh",
    EVENT_CREATED: "Tạo sự kiện", EVENT_UPDATED: "Sửa sự kiện", EVENT_DELETED: "Xoá sự kiện",
    MEMBER_ROLE_CHANGED: "Đổi vai trò", OWNERSHIP_TRANSFERRED: "Chuyển quyền sở hữu"
  };
  /* VIEWER chỉ thấy ALBUM / PHOTO / EVENT trong lịch sử. */
  var VIEWER_ACTIONS = ["ALBUM_CREATED", "PHOTO_ADDED", "PHOTO_DELETED", "PHOTO_HIDDEN", "PHOTO_UNHIDDEN",
    "EVENT_CREATED", "EVENT_UPDATED", "EVENT_DELETED"];

  /* 22 dòng. ac1 + ac2 là cặp bắt buộc: xoá 1 thành viên sinh 2 dòng log. */
  var activity = [
    { id: "ac1",  at: "2026-09-26T20:11:00Z", byUserId: "u1", action: "MEMBER_DELETED",      targetType: "MEMBER", summary: "Phạm Thị Dung", snapshot: { fullName: "Phạm Thị Dung", birthDate: "1949-02-11", isDeceased: true } },
    { id: "ac2",  at: "2026-09-26T20:11:00Z", byUserId: "u1", action: "RELATION_DELETED",    targetType: "RELATIONSHIP", summary: "Quan hệ kéo theo khi xoá Phạm Thị Dung", cascade: true },
    { id: "ac3",  at: "2026-09-26T19:40:00Z", byUserId: "u2", action: "PHOTO_HIDDEN",        targetType: "PHOTO", summary: "ba-ngoai-01.jpg", photoId: "ph4" },
    { id: "ac4",  at: "2026-09-26T18:02:00Z", byUserId: "u1", action: "FAMILY_LAYOUT_CHANGED", targetType: "FAMILY", summary: "Sắp xếp sơ đồ + lưu" },
    { id: "ac5",  at: "2026-09-25T21:15:00Z", byUserId: "u1", action: "MEMBER_UPDATED",      targetType: "MEMBER", summary: "Nguyễn Thanh Hà", diff: { fullName: { from: "Nguyễn Thanh Hà", to: "Nguyễn Thanh Hà (Hà)" } } },
    { id: "ac6",  at: "2026-09-25T20:48:00Z", byUserId: "u3", action: "MEMBER_ADDED",        targetType: "MEMBER", summary: "Lê Minh Khôi" },
    { id: "ac7",  at: "2026-09-25T09:30:00Z", byUserId: "u2", action: "PHOTO_ADDED",         targetType: "PHOTO", summary: "scan-trang-04.jpg", photoId: "ph5" },
    { id: "ac8",  at: "2026-09-24T16:20:00Z", byUserId: "u1", action: "EVENT_UPDATED",       targetType: "EVENT", summary: "Tết Bính Ngọ" },
    { id: "ac9",  at: "2026-09-24T11:05:00Z", byUserId: "u1", action: "MEMBER_PHOTO_SET",    targetType: "MEMBER", summary: "Nguyễn Minh Khôi ← khoai-1.jpg", photoId: "ph2" },
    { id: "ac10", at: "2026-09-23T22:14:00Z", byUserId: "u1", action: "ALBUM_CREATED",       targetType: "ALBUM", summary: "Họp mặt dòng họ 2025" },
    { id: "ac11", at: "2026-09-23T14:52:00Z", byUserId: "u1", action: "RELATION_ADDED",      targetType: "RELATIONSHIP", summary: "Trần Quốc Bảo → Trần Ngọc Mai" },
    { id: "ac12", at: "2026-09-22T19:00:00Z", byUserId: "u1", action: "FAMILY_RENAMED",      targetType: "FAMILY", summary: "Nhà họ Nguyễn", diff: { name: { from: "Nhà họ Nguyễn", to: "Nhà họ Nguyễn – Trần" } } },
    { id: "ac13", at: "2026-09-22T10:33:00Z", byUserId: "u3", action: "EVENT_CREATED",       targetType: "EVENT", summary: "Giỗ cụ Nguyễn Văn Minh" },
    { id: "ac14", at: "2026-09-21T21:44:00Z", byUserId: "u2", action: "MEMBER_UPDATED",      targetType: "MEMBER", summary: "Trần Quốc Bảo", diff: { fullName: { from: "Trần Quốc Báo", to: "Trần Quốc Bảo" } } },
    { id: "ac15", at: "2026-09-20T08:12:00Z", byUserId: "u1", action: "PHOTO_UNHIDDEN",      targetType: "PHOTO", summary: "khoai-1.jpg", photoId: "ph2" },
    { id: "ac16", at: "2026-09-19T17:26:00Z", byUserId: "u1", action: "MEMBER_ADDED",        targetType: "MEMBER", summary: "Nguyễn Minh Anh" },
    { id: "ac17", at: "2026-09-18T12:41:00Z", byUserId: "u3", action: "RELATION_ADDED",      targetType: "RELATIONSHIP", summary: "Nguyễn Minh Khôi → Nguyễn Minh Anh" },
    { id: "ac18", at: "2026-09-17T20:03:00Z", byUserId: "u1", action: "FAMILY_LAYOUT_CHANGED", targetType: "FAMILY", summary: "Kéo 3 node + lưu" },
    { id: "ac19", at: "2026-09-16T09:55:00Z", byUserId: "u1", action: "MEMBER_ROLE_CHANGED", targetType: "GROUP", summary: "Phạm Thu Hà: VIEWER ← EDITOR" },
    { id: "ac20", at: "2026-09-14T15:19:00Z", byUserId: "u1", action: "PHOTO_ADDED",         targetType: "PHOTO", summary: "mai-1.jpg", photoId: "ph3" },
    { id: "ac21", at: "2026-09-12T11:30:00Z", byUserId: "u1", action: "OWNERSHIP_TRANSFERRED", targetType: "GROUP", summary: "Chủ nhóm: Nguyễn Văn Cường → Nguyễn Thanh Hà" },
    { id: "ac22", at: "2026-09-10T07:48:00Z", byUserId: "u1", action: "MEMBER_ADDED",        targetType: "MEMBER", summary: "Nguyễn Thanh Hà" }
  ];

  /* Thùng rác: cây thì dùng chung, media thì mỗi người một thùng. */
  var trash = {
    tree: [
      { id: "t1", kind: "MEMBER", name: "Phạm Thị Dung", detail: "Sinh 11/02/1949", deletedById: "u1", deletedAt: "2026-09-26T20:11:00Z" },
      { id: "t2", kind: "RELATIONSHIP", name: "Trần Quốc Bảo → Nguyễn Minh Khôi", detail: "Quan hệ cha – con", deletedById: "u1", deletedAt: "2026-09-25T10:04:00Z" }
    ],
    media: [
      { id: "t3", kind: "PHOTO", name: "ba-ngoai-01.jpg", detail: "Album Ảnh gia đình", tint: "#d8e4d0", deletedById: "u2", deletedAt: "2026-09-26T19:40:00Z" },
      { id: "t4", kind: "PHOTO", name: "scan-trang-04.jpg", detail: "Album Ảnh gia đình", tint: "#e6ded2", deletedById: "u4", deletedAt: "2026-09-20T16:22:00Z" }
    ]
  };

  var shareLinks = [
    { id: "s1", token: "7f3a9c2b", expiresInDays: 30, opens: 12, revoked: false, createdAt: "2026-09-20T10:00:00Z" },
    { id: "s2", token: "b81d4e07", expiresInDays: 7,  opens: 3,  revoked: false, createdAt: "2026-08-30T10:00:00Z" },
    { id: "s3", token: "c05e7a19", expiresInDays: 90, opens: 41, revoked: true,  createdAt: "2026-06-02T10:00:00Z" }
  ];

  /* Link mời: dùng 1 lần, hết hạn 7 ngày. KHÔNG có màn quản lý link mời. */
  var invite = {
    token: "inv_9c41f2",
    groupId: "g1",
    groupName: "Nhà họ Nguyễn – Trần",
    inviter: "Nguyễn Thanh Hà",
    role: "VIEWER",
    expiresAt: "2026-09-27T00:00:00Z"
  };

  var userById = function (id) {
    for (var i = 0; i < collaborators.length; i++) if (collaborators[i].id === id) return collaborators[i];
    if (id === me.id) return { id: me.id, fullName: me.fullName, role: "OWNER" };
    return { id: id, fullName: "Không rõ", role: "" };
  };
  var memberById = function (id) {
    for (var i = 0; i < members.length; i++) if (members[i].id === id) return members[i];
    return null;
  };
  var photoById = function (id) {
    for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return photos[i];
    return null;
  };
  /* Còn N ngày nữa thì bị xoá vĩnh viễn (backend quét 30 ngày). */
  var daysLeft = function (deletedAt) {
    var due = new Date(deletedAt).getTime() + 30 * 86400000;
    return Math.max(0, Math.ceil((due - Date.now()) / 86400000));
  };

  window.MOCK = {
    me: me, group: group,
    members: members, relations: relations,
    collaborators: collaborators,
    albums: albums, photos: photos, events: events,
    TARGET_TYPES: TARGET_TYPES, TARGET_LABEL: TARGET_LABEL,
    ACTIONS: ACTIONS, ACTION_LABEL: ACTION_LABEL, VIEWER_ACTIONS: VIEWER_ACTIONS,
    activity: activity, trash: trash, shareLinks: shareLinks, invite: invite,
    userById: userById, memberById: memberById, photoById: photoById, daysLeft: daysLeft
  };
})();
