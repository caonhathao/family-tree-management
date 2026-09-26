# 03 — Phạm vi THÊM

12 nhóm, xếp theo mức ảnh hưởng tới việc người dùng thật có dùng app hay không. Số thứ tự giữ nguyên như lúc khảo sát để không phá cross-reference giữa các file; mục **10** và **11** đã **nâng lên P0** theo quyết định D12 nên nằm ở khối P0 dù số hiệu không liền.

---

## P0 — Không có thì app không dùng được

### 1. Granular CRUD cho cây gia đình

Hiện `FamilyController` chỉ có **4 endpoint**: `POST /sync-data/:groupId`, `GET /:groupId`, `PUT /:groupId`, `DELETE /:groupId/:familyId`. Không thêm/xoá được **một** người hay **một** quan hệ.

Hệ quả: mọi thao tác nhỏ đều phải gửi nguyên cây lên. Cây 300 người = vài trăm KB mỗi lần bấm lưu, trên mobile là điều kiện phải mạng; và mỗi lần gửi lại là một cơ hội mất dữ liệu (xem `02-pham-vi-sua.md` §2).

Thêm:

| Method | Path | Việc |
|--------|------|------|
| `POST` | `/family/:groupId/members` | thêm 1 thành viên |
| `PATCH` | `/family/:groupId/members/:memberId` | sửa (kèm `If-Match` version) |
| `DELETE` | `/family/:groupId/members/:memberId` | xoá 1 thành viên |
| `POST` | `/family/:groupId/members/:memberId/photo` | upload ảnh (mục 3) |
| `GET` | `/family/:groupId/members?cursor=&q=` | phân trang + tìm (mục 7) |
| `POST` | `/family/:groupId/import` | bulk, `dryRun` + `baseVersion` + idempotency |

Xoá `POST /family/sync-data/:groupId`.

**Quan hệ:** đã chốt **giữ bảng `Relationship`** (quyết định D9, xem `02-pham-vi-sua.md` §9), nên cần endpoint riêng:

| Method | Path | Việc |
|---|---|---|
| `POST` | `/family/:groupId/relationships` | thêm 1 quan hệ (client gửi **một** chiều, server tự sinh chiều đối) |
| `PATCH` | `/family/:groupId/relationships/:relationshipId` | đổi `type` (đổi `type` = xoá dòng cũ + ghi lại cả 2 chiều) |
| `DELETE` | `/family/:groupId/relationships/:relationshipId` | xoá — **xoá cả 2 chiều**, không chỉ dòng được trỏ |

Cả 3 route phải chạy `wouldCreateCycle()` và `version++` trong cùng `$transaction`.

### 2. MembershipService + gỡ `isLeader` (giữ 3 vai)

Không phải tính năng mới mà là phần còn lại của việc gỡ `isLeader` — xem `02-pham-vi-sua.md` §3 và `01-pham-vi-bo.md` B3.

**Quyết định D7 — `MEMBER_ROLE` giữ nguyên 3 vai `OWNER | EDITOR | VIEWER`.** Chỉ bỏ `isLeader`, vì đó mới là nguồn xung đột:

- nó bypass mọi role check ở `roles.guard.ts:59,67`, nên `OWNER/EDITOR/VIEWER` trên thực tế chỉ còn 2 trạng thái
- nó bị client tự chỉ định: `group-family.service.ts:42` nhận `role` từ DTO rồi ép `isLeader: true`
- nó là nguồn sự thật thứ hai cạnh `MEMBER_ROLE`

Vì giữ `OWNER`, phải bù lại chức năng bàn giao mà `isLeader` đang gánh:

| Hành động | Ai được | Ghi chú |
|---|---|---|
| Xoá cả group | OWNER | `group-family.service.ts:199` — EDITOR **không** xoá được |
| Bàn giao quyền | OWNER | `PATCH /group-family/:groupId/transfer-ownership` — **endpoint mới, hiện chưa có** |
| Đổi role thành viên | OWNER | đổi được EDITOR ↔ VIEWER; **không** đổi được role của chính mình |
| Kick thành viên | OWNER | không kick được chính mình — dùng `quitGroup` |

**Quy tắc nhóm mồ côi (D8):** OWNER rời group → tự chuyển OWNER cho **EDITOR lâu năm nhất** rồi gửi notification. Không còn EDITOR nào thì chuyển cho VIEWER lâu năm nhất. Nhóm không còn thành viên thì `GroupFamily` bị xoá theo cascade. Lý do: một nhóm không ai giữ `OWNER` thì không ai xoá được, tức là nhóm rác mà không ai dọn được.

Phần còn lại của mục này: `MembershipService.assertCan(userId, groupId, level)` — xem `02-pham-vi-sua.md` §3 và `05-pham-vi-tiem-do.md`.

### 3. Upload ảnh thành viên

`FamilyMember.avatarUrl` (`family.prisma:40`) **có cột nhưng không có endpoint nào ghi vào**. Cloudinary chỉ dùng cho avatar user (`user.service.ts:60`) và blog-media (sắp bị xoá).

Thêm `POST /family/:groupId/members/:memberId/photo` → `CloudinaryService.uploadFile()` vào folder `FOLDER_FAMILY`. Xoá media cũ khi thay. `@BypassTransform()` cho response nếu trả stream; nếu trả JSON thì bình thường.

Đây là tính năng người dùng gia đình dùng đầu tiên — cây mà toàn ảnh trắng thì không có giá trị gì.

### 10. ActivityLog — làm thật (nâng lên P0, quyết định D12)

`ActivityLog` + `ACTION_TYPE` + `TARGET_TYPE` có đủ schema, nhưng `grep 'activityLog.create'` trong `src/` → **0 kết quả**. Bảng không bao giờ có dữ liệu.

Với app gia đình, lịch sử thay đổi không phải tiện nghi — nó là thứ phân biệt "sửa nhầm có thể gỡ lại" với "sửa nhầm mất luôn". Vì vậy **nâng từ P2 lên P0**. Nhưng phải làm **cùng phase** với soft-delete (§11) và CRUD lẻ (§1), vì log ghi trong cùng `$transaction` với mutation — làm riêng sẽ không gắn được vào đúng lần ghi.

Nguyên tắc: **không ghi kiểu "best effort" phía sau.** Mutation + `ActivityLog` phải cùng `$transaction` — tách ra thì log lệch với dữ liệu thật, tức là log sai còn tệ hơn không có log.

Cần:

- `TARGET_TYPE` đổi thành **thuần loại thực thể**: `FAMILY | MEMBER | RELATIONSHIP | ALBUM | PHOTO | EVENT | GROUP`
- `ACTION_TYPE` mở rộng thêm: `MEMBER_RESTORED`, `OWNERSHIP_TRANSFERRED`, `MEMBER_ROLE_CHANGED`, `MEMBER_JOINED`, `MEMBER_LEFT`, `FAMILY_IMPORTED`, `FAMILY_DELETED`, `MEMBER_GENERATION_RECOMPUTED`
- `@@index([familyId, createdAt])` — truy vấn lịch sử luôn theo family + thời gian

**Bảng action phải ghi (tối thiểu):**

| Action | Ghi khi | `content` chứa |
|---|---|---|
| `MEMBER_CREATED` | thêm thành viên | diff field: `{ fullName: { from, to } }` |
| `MEMBER_UPDATED` | sửa thành viên | diff field |
| `MEMBER_DELETED` | xoá (mềm) 1 thành viên | snapshot nhẹ: `{ fullName, birthDate, isDeceased }` |
| `MEMBER_DELETED` | xoá kéo theo mất cây con | **dòng thứ 2**, ghi số thành viên bị ảnh hưởng + danh sách id |
| `MEMBER_RESTORED` | khôi phục từ trash | `{ id, fullName }` |
| `RELATIONSHIP_CREATED` / `RELATIONSHIP_DELETED` | thêm/xoá quan hệ | `{ fromMemberId, toMemberId, type }` |
| `FAMILY_UPDATED` | sửa thông tin cây | diff field |
| `FAMILY_DELETED` | xoá cả cây | `{ memberCount, relationshipCount }` |
| `FAMILY_IMPORTED` | import GEDCOM / JSON | `{ source, memberCount, errorCount }` |
| `OWNERSHIP_TRANSFERRED` | bàn giao OWNER | `{ fromUserId, toUserId }` |
| `MEMBER_ROLE_CHANGED` | đổi role | `{ from, to }` |
| `MEMBER_JOINED` / `MEMBER_LEFT` | vào / rời group | `{ userId }` |

⚠️ **Xoá một thành viên ghi 2 dòng** (dòng xoá + dòng ảnh hưởng dây chuyền). Một dòng là không đủ để biết mất bao nhiêu.

`content` lưu **diff + snapshot**, không lưu nguyên bản ghi — cắt được phần lớn 2KB/bản ghi mà vẫn đủ để audit.

**API đọc log:** `GET /family/:groupId/activity?cursor=&action=&targetType=&from=&to=`

- Phân trang bằng **cursor** (`createdAt + id`), không offset — bảng này sẽ dài dần.
- **Chỉ OWNER/EDITOR xem được.** VIEWER không thấy ai sửa gì về gia đình họ.
- Rate limit riêng.

**Không ghi log cho:** job cron (roll-forward event, dọn invite) và mọi thao tác hệ thống. Log trả lời "con người làm gì"; cron không phải con người.

---

### 11. Trash / soft delete (nâng lên P0 — tiền đề của log, quyết định D12)

`/user/trash` có trong menu sidebar nhưng không có page. Xoá nhầm thành viên trong cây gia đình rất dễ xảy ra, và hiện **không hoàn tác được**.

Nâng lên P0 vì **lý do kỹ thuật chứ không phải lý do tiện nghi**: `MEMBER_DELETED` cần snapshot để dựng lại (§10), mà `DELETE` cứng đã xoá dòng thì không còn gì để chụp. Soft-delete là tiền đề của audit log, không phải một tính năng đứng riêng.

- `FamilyMember.deletedAt DateTime?` (và `Album`, `Event` nếu đã build)
- `GET /family/:groupId/trash`, `POST /family/:groupId/trash/:id/restore`
- Job dọn sau 30 ngày — job này **không** ghi `ActivityLog` (xem §10)
- Mọi query đọc cây mặc định lọc `deletedAt: null`; đây là bất biến phải ghi vào `05-pham-vi-tiem-do.md`

⚠️ Thêm một điều kiện lọc vào **mọi** `where` là một cơ hội sót. Kiểm thử bắt buộc: thành viên đã xoá mềm không xuất hiện ở `GET /family/:groupId`, ở search, ở cây render, ở export.

---

## P1 — Không có thì dùng được nhưng sẽ phiền

### 4. AlbumsModule build thật

`src/modules/albums/` — cả 3 file chỉ là **1 dòng comment** của Nest scaffold, không được import vào `app.module.ts`. Schema `Album`/`Photo` đã có nhưng không code nào dùng.

Cần:
- `albums.module.ts` / `.controller.ts` / `.service.ts` thật + `dto/`
- CRUD album, upload nhiều ảnh một lúc, xoá ảnh (xoá cả trên Cloudinary)
- Tái dùng `CloudinaryService`, `FOLDER_ALBUM`
- Tích hợp `ActivityLog` (mục 10)
- Job dọn media mồ côi — chuyển logic từ `blog-media.service.ts` (xem `01-pham-vi-bo.md` B1)

Quyết định schema: theo khuyến nghị ở `02-pham-vi-sua.md` §5 — `Album` thuộc `groupId`, bỏ `familyId` + mảng `groupFamilies`.

### 5. Import / Export

**Đây là nhu cầu số 1 của người dùng app gia đình, và hiện tại hoàn toàn không có.** Grep `gedcom|pdf|export` trong `src/` → 0 kết quả.

Ba thứ cần, theo thứ tự ưu tiên:

1. **Export JSON** — toàn bộ cây ra file. Rẻ, làm trước, cũng là chính là format của endpoint `POST /import` (§1). Đây là bản sao lưu thật sự.
2. **Import GEDCOM** (`*.ged`) — nguồn dữ liệu có sẵn lớn nhất về cây gia đình. Thư viện: `gedcom` (Node). Cần map `INDI`/`FAM`/`HUSB`/`WIFE`/`CHIL` sang `FamilyMember` + quan hệ. Kèm báo cáo lỗi dòng theo dòng — dữ liệu GEDCOM thực tế rất bẩn.
3. **Export ảnh cây** (PDF hoặc PNG server-side) — nhu cầu "in cây gia đình treo tường". Nặng nhất, làm cuối.

Lưu ý an toàn: import là con đường duy nhất ghi hàng loạt. Phải chạy qua endpoint bulk ở §1 (`dryRun` → xem diff → xác nhận → ghi), không có đường import nào đi qua logic hiện tại.

### 6. Share link read-only

Chưa có khái niệm này. Grep `shareLink|visibility|@Public` trong `src/` → 0 kết quả.

Cần: token read-only, hết hạn, thu hồi được, **chặn ghi tuyệt đối**. Nhiều người dùng muốn gửi link cây cho người ngoài gia đình mà không muốn tạo tài khoản.

Đây cũng là bề mặt tấn công mới → cần rate limit riêng và **không** dùng lại `AtGuard` (endpoint này public, dùng guard riêng xác thực token).

### 7. Search

Không có endpoint tìm người. Cây vài trăm người thì frontend phải tự filter toàn bộ.

- `GET /family/:groupId/members?q=<tên>` — tìm trong group, `mode: 'insensitive'`. Index đã có sẵn: `@@index([fullName])` (`family.prisma:51`).
- Cần lọc `deletedAt: null` (xem mục 11) — thành viên đã xoá mềm không được hiện trong kết quả tìm.

### 8. Gắn sự kiện với từng người

`Event` không có cột nào trỏ `FamilyMember` (`event.prisma:22-44`) — xem `02-pham-vi-sua.md` §6.

Thêm `familyMemberId String?` + index. Mở ra: sinh nhật/nhật niên theo từng người, "kỷ niệm ngày cụ qua đời", timeline cá nhân. Đây là phần làm cho module Events trở nên hữu ích với gia đình thật — hiện nó chỉ là lịch chung.

---

## P2 — Nên có

### 9. Password reset làm thật (thay B6/B7)

`POST /auth/reset` (`auth.controller.ts:151`) hiện là **endpoint giả**: tìm user theo email rồi không tạo token, không gửi mail. Nó tạo cảm giác an toàn mà không có gì.

**Quyết định D11 — LÀM THẬT.** Bảng mới:

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([tokenHash])
}
```

- Lưu **hash** của token, không lưu token thô — DB lộ là token lộ.
- Gửi qua Resend (đã có infrastructure, chỉ chưa dùng cho mục đích này).
- Rate limit riêng cho `/auth/reset` (xem `02-pham-vi-sua.md` §8) — không có thì endpoint này thành công cụ dò email.
- **Sau khi đổi mật khẩu: thu hồi toàn bộ `Session` của user.** Đây là chi tiết dễ sót nhất — token cũ còn sống thì việc reset là vô nghĩa.
- Xoá bảng `Verification` (`auth.prisma:17-27`) — không ai đọc, không ai ghi.

**Email verification: pending — KHÔNG làm trong đợt này.** Hệ quả: `User.emailVerifiedAt` **không được thêm** ở đợt này (xem `01-pham-vi-bo.md` B6).

### 12. Đồng bộ docs + Postman

Không phải tính năng, nhưng là thứ làm nên việc tiếp tục. Xem `01-pham-vi-bo.md` B9 cho danh sách cụ thể.

Cần giữ đúng: `project/backend/postman.json` + `.postman/`, `docs/api-response-flow.md`, `docs/architecture_map.html`, `graphs/*.drawio`.

Thêm vào danh sách phải cập nhật:

- `docs/planing - refactor -be/05-pham-vi-tiem-do.md` — nhúng vào PR template / checklist review từ phase 1, và chính file này phải được sửa nếu một bất biến bị vi phạm (tức là bất biến sai, không phải code sai).
- `docs/pending_features.md` — đã lỗi thời (xem `01-pham-vi-bo.md` B9).
