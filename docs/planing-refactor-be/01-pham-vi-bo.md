# 01 — Phạm vi BỎ

9 nhóm (B4 `MEMBER_ROLE.OWNER` và **B5 `pinnedMemberId` đều đã bị hủy** sau khi chốt D7 / D16 — xem cuối file). Sắp xếp theo mức độ chắc chắn.

---

## B1. Blog + BlogMedia (chắc chắn)

| Xoá | Vị trí |
|-----|--------|
| Module blog | `src/modules/blog/` (controller, service, module, dto) |
| Module blog-media | `src/modules/blog-media/` |
| Schema | `prisma/schema/blog.prisma` — `model Blog`, `model BlogMedia`, `enum BLOG_MEDIA_TYPE` |
| FE kèm theo | `/admin/blog_editor`, `/admin/blogs` |

Lý do: đây là content-marketing/SEO, không có bất kỳ mối liên hệ nào với gia đình. `GET /blog/:slug` còn không có guard → public read, mở bề mặt ra ngoài.

⚠️ **Phụ thuộc:** `blog-media.service.ts` chứa logic Cloudinary orphan-cleanup (`cleanupOrphanedMediaAction`). Tách phần đó sang albums **trước khi** xoá file. CloudinaryService ở `src/common/config/cloudinary/` thì **giữ nguyên** — albums sẽ dùng.

⚠️ Cần kiểm trước: `Editor.js` là gói ở frontend hay backend? Nếu chỉ blog dùng thì gỡ luôn khỏi `project/frontend/package.json`.

---

## B2. Admin plane (chắc chắn)

| Xoá | Vị trí |
|-----|--------|
| `USER_ROLE.ADMIN` | `prisma/schema/user.prisma:7-10` → rút enum thành không còn, hoặc bỏ hẳn field `User.role` |
| Endpoint user directory | `GET /users` — `user.service.ts:222-230`, chỉ ADMIN mới gọi được |
| `role` trong auth response | `src/modules/auth/types/auth-response.type.ts:11` |

Lý do: user directory chỉ tồn tại để admin duyệt/ban người dùng. Cá nhân không có bảng vận hành này.

⚠️ Sau khi bỏ `USER_ROLE`, kiểm tra chỗ khác còn tham chiếu: `blog.service.ts:35,161,219` (sẽ đi cùng B1) và `auth-response.type.ts:11`. FE đọc `x-user-role` trong `src/proxy.ts` → phải sửa theo.

---

## B3. `isLeader` + `GroupLeaderGuard` (chắc chắn)

| Xoá | Vị trí |
|-----|--------|
| Cột DB | `GroupMember.isLeader` — `prisma/schema/group.prisma:30` |
| Guard | `src/common/guards/leader.guard.ts` |
| Decorator | `src/common/decorators/leader.decorator.ts` |
| Endpoint | `PATCH /group-member/leader/:groupId` — `group-members.controller.ts:67` |
| Bypass trong RolesGuard | `roles.guard.ts:59,67` (`if (member.isLeader) return true;`) |
| Logic chuyển leader | `group-members.service.ts:101-161`, `auth.service.ts:840,866` |

Lý do: `isLeader` và `MEMBER_ROLE.OWNER` là **hai nguồn sự thật cùng trả lời một câu hỏi** ("ai có quyền gì"). Mọi thay đổi phải cập nhật cả hai, và RolesGuard đang bypass mọi kiểm tra role khi `isLeader=true` — tức là 1 cột boolean đang vô hiệu hoá toàn bộ hệ thống phân quyền. Giữ lại chỉ 1 nguồn.

**Quyết định D7:** `MEMBER_ROLE` giữ nguyên 3 vai `OWNER` / `EDITOR` / `VIEWER`. Chỉ `isLeader` bị bỏ.

⚠️ **Chức năng bàn giao quyền không được mất.** Endpoint `PATCH /group-member/leader/:groupId` bị xoá, nhưng nó là cơ chế duy nhất chuyển quyền sở hữu group. Phải có `PATCH /group-family/:groupId/transfer-ownership` thay thế — xem `03-pham-vi-them.md` §2. Không có nó thì OWNER rời group = mất group vĩnh viễn.

---

## ~~B4. `MEMBER_ROLE.OWNER`~~ — ĐÃ HỦY

Bản nháp ban đầu đề xuất rút `MEMBER_ROLE` còn `EDITOR` / `VIEWER`, người tạo group = `EDITOR`.

**Đã hủy theo quyết định D7:** EDITOR **không** được xoá group. Cần giữ vai cao hơn EDITOR, nên enum giữ nguyên 3 vai. B4 không còn là hạng mục bỏ.

Phần `enum MEMBER_ROLE` trong `prisma/schema/group.prisma:1-5` **giữ nguyên**. Không có thay đổi schema nào ở B4.

---

## ~~B5. `pinnedMemberId`~~ — ĐÃ HỦY, đảo thành **giữ**

> ⚠️ **Đảo lại quyết định cũ.** Bản nháp ban đầu xếp `pinnedMemberId` vào danh sách xoá với lý do *"trạng thái UI, không phải dữ liệu gia đình"*. Sai. Sau khi chốt **D16** (ảnh node = ảnh hồ sơ), `pinnedMemberId` là **cơ chế gắn node cây ↔ tài khoản ↔ ảnh hồ sơ** — xoá nó là mất tính năng.

| Giữ / sửa | Vị trí |
|---|---|
| **Giữ** cột DB | `GroupMember.pinnedMemberId` — `group.prisma:31` |
| **Giữ** endpoint | `PATCH /group-family/:id/pin` — `group-family.controller.ts:177` |
| **Sửa** service | `group-family.service.ts:275-304` — nhận `photoId`, **snapshot** vào node |
| **Sửa** response | `group-family.service.ts:130`, `group-member-response.type.ts` — thêm `photoId` |
| **Thêm** ràng buộc | Không cho pin **chéo**: `pinnedMemberId` phải là chính tài khoản đang gọi endpoint (xem `03` §3) |

### Vì sao giữ

Theo D16, ảnh đại diện của node là ảnh hồ sơ của chính người pin:

```
người dùng pin node X  →  server chụp avatar của họ  →  ghi photoId vào node X
```

Nhờ vậy **không ai có quyền sửa ảnh của người khác** — mỗi người chỉ gán được ảnh của chính mình, tự động, bằng cách pin. Muốn gán ảnh khác thì phải là OWNER/EDITOR làm tay (`03` §3, quyền `edit`).

⚠️ **Ảnh phải snapshot lúc pin, không đọc động lúc render.** Nếu chỉ lưu `pinnedMemberId` rồi tra avatar khi trả response, thì một người đổi ảnh hồ sơ sẽ tự đổi ảnh node đó trong **cây của người khác** — tức sửa dữ liệu người khác mà không cần quyền. Vì vậy phải có cột `photoId` trên node.

### 2 mục còn lại của B5 — giữ nguyên, chỉ đổi lý do

- **Không chuyển sang `localStorage`.** Lý do cũ (*"nếu sau này cần thì đưa vào client-side"*) không còn hiệu lực: đây không còn là lựa chọn cá nhân thuần tuý mà là **liên kết dữ liệu** giữa cây và tài khoản.
- **Không gộp cột này vào `localId` hay `clientRef`.** Nó là tham chiếu tới một tài khoản **đã tồn tại**, khác hẳn `clientRef` (tham chiếu thứ **chưa** tồn tại) — ranh giới này là bất biến F1 ở phía FE.

---

## B6. `Verification` model (chắc chắn)

`prisma/schema/auth.prisma:17-27`. Grep toàn bộ `src/` → **không có dòng code nào đọc hoặc ghi** model này. Xoá thay vì giữ một bảng chết.

**Quyết định D11:** email verification làm **sau** (pending), không thêm `User.emailVerifiedAt` trong đợt này. Nên sau khi xoá `Verification`, luồng đăng ký không có bước xác minh email — chấp nhận được ở đợt này vì app dùng Google OAuth là đường chính. Khi nào làm verification thì thêm cột `emailVerifiedAt: DateTime?` mới, không dựng lại bảng.

---

## B7. `POST /auth/reset` (chắc chắn — endpoint giả)

`auth.controller.ts:151`. Theo `docs/pending_features.md:201`: service tìm user theo email rồi **không tạo và không gửi OTP/reset link**. Endpoint trả về thành công nhưng không làm gì — nguy hiểm hơn là không có.

**Quyết định D11:** xoá endpoint giả này và **làm thật** — bảng `PasswordResetToken`, gửi qua Resend, thu hồi mọi `Session` sau khi đổi mật khẩu. Thiết kế chi tiết ở `03-pham-vi-them.md` §9.

---

## B8. Env giả + hướng dẫn env sai (chắc chắn)

| Vấn đề | Vị trí |
|---------|--------|
| `FOLDER_ALBUM`, `FOLDER_FAMILY` là `Joi.required()` nhưng không module nào dùng | `src/common/config/env/env.ts:22,24` |
| `.env.example` ship `CLOUDINARY_CLOUD_NAME` | `.env.example` |
| Joi + `config.ts` thực tế đọc `CLOUDINARY_NAME` | `src/common/config/env/config.ts` |

Hệ quả: copy `.env.example` nguyên văn → **crash lúc boot** vì thiếu `CLOUDINARY_NAME`. Đây là cái bẫy đầu tiên người mới clone repo sẽ gặp.

Còn giữ `FOLDER_USER`, `FOLDER_BLOG`? Chỉ giữ những folder thực sự dùng sau khi albums xong. `FOLDER_FAMILY` cần nếu quyết định upload ảnh thành viên (xem §3 của file 03).

---

## B9. Docs sai (chắc chắn)

| File | Sai ở đâu |
|------|-----------|
| `project/backend/README.md:253` | Liệt kê `AlbumsModule` như feature đã chạy. Thực tế `src/modules/albums/*.ts` **chỉ là 1 dòng comment** của Nest scaffold, không được import vào `app.module.ts` |
| `project/backend/README.md` mục "Header Injection" | Mô tả proxy inject `x-user-id` / `x-user-role`. Grep `x-user-id` trong `src/` → **0 kết quả**. Backend không đọc header này. (Đúng là `project/frontend/src/proxy.ts` chuyển tiếp, nhưng backend không tiêu thụ) |
| `docs/pending_features.md` §2, §3 | Nói events module "all files are empty" và notification "no API endpoints". Cả hai đã implement đầy đủ. File này đã lỗi thời |
| `project/backend/AGENTS.md:243` | "Package manager: npm (npm-lock.yaml present)" — repo có `pnpm-lock.yaml`, không có `npm-lock.yaml` |

Fix bằng cách sửa lại, không xoá `pending_features.md` — nó vẫn còn mục nào đúng (activity log chết, admin sidebar bug, session cleanup cron).

---

## B10. `events.service.ts` (chắc chắn)

`src/modules/events/events.service.ts` (module-level) vs `src/modules/events/event.service.ts` (controller-level). Hai file gần như trùng tên, chỉ khác 1 ký tự — rất dễ import nhầm. Gộp lại một tên và bỏ file thừa sau khi xác nhận không còn consumer nào.

---

## B11 — Bề mặt "nhiều nhóm" + quản lý lời mời (theo D14, F7)

Đây là nhóm xoá **mới**, sinh ra từ mô hình sản phẩm 1 người 1 cây — không có trong bản khảo sát ban đầu vì lúc đó chưa chốt D14.

| Xoá | Vị trí / lý do |
|---|---|
| Endpoint `leaveGroup` | `group-family.controller.ts` + `group-family.service.ts` — xoá khỏi nhóm tạo ra trạng thái ngõ cụt mà hệ thống cấm (0 group), tức là **đường lách bất biến I6**. Muốn rời thì xoá tài khoản |
| Endpoint trả **danh sách** group của user | Không có màn hồi đáp ở FE (`FE-B11` xoá `/user/groups`). Giữ endpoint là giữ một bề mặt không ai gọi |
| `GET /invite/mine` | Không tồn tại và **không được tạo**. Cố ý không có màn quản lý lời mời (F7) — link gửi đi đâu thì kệ, hết hạn 7 ngày là hết |
| Nhánh "tạo group thứ 2" trong `POST /group-family` | Thay bằng **chặn**: đã có group → `409` (bất biến I6) |

⚠️ **Xoá `leaveGroup` là bắt buộc, không phải dọn dẹp.** Giữ lại thì bất biến I6 chỉ còn đúng ở UI — gọi thẳng API là vượt. Xem `be/05` I6.

### Thay bằng

| Thêm | Vì sao |
|---|---|
| `POST /auth/register` nhận `?token=` | Ngã ba đăng ký: có token → join cây người mời (vai `VIEWER`); không token → tạo group + cây riêng (vai `OWNER`). Chi tiết ở `03` §4 |
| Chặn group thứ 2 trong `POST /group-family` | `409` + câu rõ, **không** tạo group âm thầm |
| Chuyển media sang OWNER khi xoá tài khoản | Không cascade xoá ảnh của người đã xoá account — `createdById` trỏ tới user không còn tồn tại thì media thành mồ côi. Xem `03` §11 |

---

## Các mục đã bị hủy / đảo ngược sau khi viết

Đọc `01` theo mục, không đọc cả file một lượt rồi làm theo:

| Mục | Viết ban đầu | Chốt sau | Ở đâu |
|---|---|---|---|
| **B4** `MEMBER_ROLE.OWNER` | Rút enum còn `EDITOR`/`VIEWER` | **Hủy** — giữ 3 vai (D7) | tại chỗ, dòng ~57 |
| **B5** `pinnedMemberId` | Xoá cột + endpoint | **Đảo** — giữ, thành cơ chế node ↔ tài khoản ↔ ảnh (D16) | tại chỗ, dòng ~67 |

---

## Xem lại (không quyết khi chưa kiểm)

| Mục | Cần kiểm trước |
|-----|----------------|
| `ActivityLog` | Grep `activityLog.create` trong `src/` → **0 kết quả**. Model + 2 enum có đầy đủ nhưng không ai ghi. **Đã chốt D12: làm thật, gồm cả delete** — xem `03-pham-vi-them.md` §10 |
| FE: `/user/storage`, `/user/trash`, `/user/support`, `/user/feedback`, `/admin/user_feedbacks`, `/admin/supports`, `/tutorials`, `/faq` | 8 route có menu item nhưng không có page. Với bản cá nhân: `/user/trash` **có giá trị** — soft-delete đã chốt ở D12 nên trang này trở nên có thật. Còn lại bỏ |
| `AuthLog` | Giữ. Là audit log đăng nhập, hữu ích kể cả cá nhân |
| Rate limit / helmet | Xem `02-pham-vi-sua.md` §8 — là *thêm*, không phải bỏ |
| `Editor.js` | Kiểm là gói FE hay BE, gỡ nếu chỉ blog dùng (xem B1) |
