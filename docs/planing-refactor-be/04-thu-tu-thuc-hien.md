# 04 — Thứ tự thực hiện

5 phase. Thứ tự không tùy ý — phase sau **phụ thuộc kết quả** phase trước.

**Mỗi phase đều nghiệm thu theo 5 bất biến ở `05-pham-vi-tiem-do.md`.** Từ phase 2 trở đi áp dụng đủ cả 5; phase 0-1 chỉ áp dụng I1-I3 vì I4 (`version`) và I5 (`ActivityLog`) chưa có nền để đo cho tới khi phase 2 dựng xong.

---

## Phase 0 — Dọn, không đổi hành vi

Mục tiêu: code sạch để mọi thay đổi sau đây không phải đọc giữa đống rác.

| Việc | Nguồn |
|------|-------|
| Xoá blog + blog-media (tách orphan-cleanup sang albums **trước**) | `01` B1 |
| Bỏ `USER_ROLE.ADMIN`, `GET /users`, `role` trong auth response | `01` B2 |
| Bỏ `isLeader` + `GroupLeaderGuard` + `leader.decorator.ts` + endpoint transfer | `01` B3 |
~~`MEMBER_ROLE` → `EDITOR`/`VIEWER`~~ | **B4 đã hủy** — quyết định D7 giữ 3 vai `OWNER/EDITOR/VIEWER`, chỉ bỏ `isLeader` |
| Bỏ `pinnedMemberId` + endpoint pin | `01` B5 |
| Xoá bảng `Verification` (bảng chết — không ai đọc/ghi; email verification là **pending** theo D11 nên không thay bằng `emailVerifiedAt` lúc này) | `01` B6 |
| Xoá `POST /auth/reset` (endpoint giả) — làm thật lại ở phase 3 theo D11 | `01` B7 |
| Sửa `.env.example` (`CLOUDINARY_NAME`), bỏ `FOLDER_ALBUM`/`FOLDER_FAMILY` khỏi Joi | `01` B8 |
| Gộp `events.service.ts` / `event.service.ts` | `01` B10 |
| Sửa README, `AGENTS.md`, `pending_features.md` | `01` B9 |

Lưu ý: B3/B4 đụng `RolesGuard` và `group-members.service.ts`. Xoá `isLeader` sẽ **làm lộ** các chỗ đang dựa vào bypass ở `roles.guard.ts:67` — sửa luôn trong phase này, đừng để lại cho phase 1.

**Nghiệm thu:** `pnpm exec tsc --noEmit` sạch · `pnpm lint:src` sạch · `pnpm test` xanh · app boot được với `.env` từ `.env.example` sửa lại · không còn tham chiếu `USER_ROLE`/`isLeader`/`Blog` ngoài file xoá · bất biến I1-I3 của `05-pham-vi-tiem-do.md` không bị vi phạm mới (phase này xoá code, không viết lại service nên không đòi hỏi sửa hết vi phạm cũ — việc đó thuộc phase 1).

---

## Phase 1 — Vá lỗ hổng

Không thêm tính năng nào. Chỉ làm cho hệ thống không còn ghi đè dữ liệu của nhóm khác.

| Bước | Nội dung | Nguồn |
|------|----------|-------|
| 1.1 | `MembershipService.assertCan()` | `02` §3 |
| 1.2 | Mọi family service gọi nó; bỏ tham số `userId` chết; `RolesGuard:48` ném exception thay vì `return false` | `02` §3 |
| 1.3 | `CreateGroupFamilyDto` bỏ `role` | `02` §4 |
| 1.4 | Siết DTO: `gender` → `@IsEnum(GENDER)`, `biography` → `@ValidateNested`, `generation` → `@IsNumber` | `02` §4 |
| 1.5 | `ValidationPipe` thêm `forbidNonWhitelisted` | `02` §4 |
| 1.6 | Scope mọi `where` của family theo `groupFamilyId`; bỏ upsert theo id client | `02` §1 |
| 1.7 | Thêm `@nestjs/throttler` (nhóm riêng cho `/auth/*`) + `helmet` | `02` §8 |
| 1.8 | Cron dọn session hết hạn | `02` §7 |

**Nghiệm thu — không được bỏ qua:**
- Test IDOR: user A `EDITOR` group A dùng id family/member của group B → `403`/`404`, **và** không có bản ghi group B nào thay đổi. Chạy ở `test/family.e2e-spec.ts`.
- Test tham ngũ thành viên (`assertCan` trả đúng kết quả cho 5 tổ hợp role × thành viên/không thành viên).
- Test rate limit: gọi `login-base` vượt ngưỡng → `429`.
- `pnpm test` + `pnpm test:e2e` + `pnpm exec tsc --noEmit` + `pnpm lint:src` + `pnpm build` xanh.
- **Toàn bộ vi phạm I1-I3 trong bảng ở `05-pham-vi-tiem-do.md` đã về 0.** I4/I5 chưa áp dụng ở phase này.

⚠️ `pnpm test:e2e` **cần PostgreSQL thật + `.env` đầy đủ** (`test/test-app.ts` boot AppModule thật). Không chạy được thì đừng tính là đã nghiệm thu.

⚠️ **CI hiện không chạy e2e.** Nếu để thế, IDOR có thể quay lại mà không ai biết. Cần thêm e2e vào `.github/workflows/backend-ci.yml` — yêu cầu Postgres service container. Việc này thuộc phase này vì test bảo mật mà không chạy thì không có tác dụng.

---

## Phase 2 — Lội ghép API (breaking)

Viết lại đường ghi. Đây là lúc duy nhất breaking change gần như miễn phí — vì thang điểm "dành cho cá nhân" nên chưa có user nào để giữ tương thích.

| Bước | Nội dung | Nguồn |
|------|----------|-------|
| 2.0 | Mô hình quan hệ — **đã chốt D9**: giữ bảng `Relationship`, server tự sinh chiều đối. Thêm `@@unique([fromMemberId, toMemberId, type])`; `SPOUSE` sort 2 id trước khi ghi (cặp không thứ tự); `wouldCreateCycle()` chặn chu trình | `02` §9 |
| 2.1 | Thêm `Family.version Int @default(0)`; mọi mutation `version++` trong transaction | `02` §2 |
| 2.2 | `FamilyMember` granular CRUD + `If-Match` version → 409 | `03` §1 |
| 2.3 | `POST|PATCH|DELETE /family/:groupId/relationships` — mỗi lần ghi đều sinh chiều đối + `wouldCreateCycle` + `version++` | `03` §1, `02` §9 |
| 2.4 | `generation` bỏ khỏi DTO; server BFS tính lại sau mỗi mutation có đổi quan hệ; client gửi giá trị lệch thì 409 | `02` §9 |
| 2.5 | `POST /family/:groupId/import` — `dryRun` + `baseVersion` + `Idempotency-Key`; **không nhận primary key** | `03` §1 |
| 2.6 | Xoá `POST /family/sync-data/:groupId` | `03` §1 |
| 2.7 | `FamilyMember.deletedAt` + `GET /trash` + restore + job 30 ngày | `03` §11 |
| 2.8 | `ActivityLog`: `TARGET_TYPE`/`ACTION_TYPE` mới, `@@index([familyId, createdAt])`, ghi trong **cùng** `$transaction` với mọi mutation, `GET /family/:groupId/activity` (chỉ OWNER/EDITOR) | `03` §10 |
| 2.9 | `PATCH /group-family/:groupId/transfer-ownership` + quy tắc nhóm mồ côi khi OWNER rời (D8) | `03` §2 |
| 2.10 | Upload ảnh thành viên | `03` §3 |
| 2.11 | `Event.familyMemberId` + index | `02` §6, `03` §8 |
| 2.12 | `GroupNotification.entityType` + `entityId`; bỏ `NOTIFICATION_TYPE` | `02` §6, `02` §9 |
| 2.13 | `/api/v1` | `02` §8 |

**Frontend phải sửa theo (chưa nằm trong phạm vi lần này, ghi ra để không quên):**
- `src/lib/api/api-client.lib.ts` — bỏ `family.syncFamily`, thêm CRUD mới
- `src/modules/family/family.actions.ts` — `SyncFamilyAction` viết lại thành bộ action lẻ
- `src/proxy.ts` — bỏ `x-user-role` sau khi `User.role` biến mất
- Base path mọi request: `/api` → `/api/v1`
- `src/app/group/_components/forms/relationship-form.tsx:228` — bỏ logic tự sinh quan hệ và tự tính `generation` (`:190-219`, đặc biệt `:199-212`); giờ server lo
- Thêm màn hình lịch sử thay đổi (đọc `GET /family/:groupId/activity`) — endpoint đã có sẵn ở 2.8 nhưng không có UI thì tính năng chưa tới được người dùng

**Nghiệm thu:**
- e2e phủ CRUD thành viên + CRUD quan hệ + import (kể cả `dryRun` và idempotency gọi 2 lần)
- Test 409 khi `version` lệch, và 409 khi `generation` client gửi lệch
- Test `wouldCreateCycle`: 3 request tạo vòng A→B→C→A, request thứ 3 phải bị chặn
- Test chu trình **có sẵn trong DB** (không tạo qua API): recompute phải trả `generation = 0` + ghi log, **không throw**
- Test xoá 1 thành viên sinh **2 dòng** `ActivityLog`
- Test rollback: cố tình làm hỏng một mutation giữa transaction → không được còn dòng `ActivityLog` mồ côi
- **5 bất biến `05-pham-vi-tiem-do.md` tick đủ 5/5**
- `postman.json` cập nhật theo

---

## Phase 3 — Dữ liệu vào/ra

| Bước | Nội dung | Nguồn |
|------|----------|-------|
| 3.1 | `AlbumsModule` thật — CRUD, upload nhiều ảnh, xoá cả trên Cloudinary | `03` §4 |
| 3.2 | Job dọn media mồ côi (từ logic tách ra ở B1) | `03` §4, `02` §7 |
| 3.3 | Export JSON (bản sao lưu thật) | `03` §5 |
| 3.4 | Import GEDCOM + báo cáo lỗi dòng theo dòng | `03` §5 |
| 3.5 | `GET /family/:groupId/members?q=` | `03` §7 |
| 3.6 | Password reset thật: bảng `PasswordResetToken` (lưu **hash**), Resend, rate limit riêng, **thu hồi toàn bộ `Session`** sau khi đổi | `03` §9 |

Vòng kiểm thật sự: **export JSON → xoá group → import lại → cây phải giống hệt.** Viết test e2e cho vòng này. Mọi thứ khác trong phase này là tiện ích, vòng này mới là bảo đảm dữ liệu.

**Nghiệm thu:** round-trip test xanh · import file GEDCOM thực tế (lấy 1 file public) không crash, báo lỗi đúng dòng · upload 100 ảnh không rò Cloudinary.

---

## Phase 4 — Chia sẻ & phần còn lại

| Bước | Nội dung | Nguồn |
|------|----------|-------|
| 4.1 | Share link read-only, có thu hồi, hết hạn, **guard riêng** (không dùng `AtGuard`) | `03` §6 |
| 4.2 | Export ảnh cây PDF/PNG | `03` §5 |
| 4.3 | Email verification — **pending** (D11), chỉ làm nếu thấy cần. Bảng `Verification` đã bị xoá ở phase 0; nếu làm thì thêm cột `User.emailVerifiedAt DateTime?` mới, không dựng lại bảng | `01` B6, `03` §9 |
| 4.4 | Xem lại `ActivityLog` sau khi đã chạy thật: log có ích không, có nên rút gọn bảng action không | `03` §10 |
| 4.5 | Đồng bộ `postman.json`, `docs/`, `graphs/*.drawio` | `03` §12 |

**Nghiệm thu:** share link thu hồi là mất quyền ngay lập tức · mọi endpoint nhạy cảm có rate limit · tài liệu mô tả đúng những gì đang chạy · 5 bất biến `05-pham-vi-tiem-do.md` vẫn tick đủ 5/5 sau khi thêm share link (share link là bề mặt tấn công mới — phải scope `groupFamilyId` như mọi route khác).

---

## Cổng release

Không release cho người dùng thật trước khi có đủ:

- [x] Phase 0 + Phase 1 xanh, e2e chạy **trong CI** chứ không phải chỉ local
- [x] Test IDOR cross-tenant xanh
- [x] **5 bất biến `05-pham-vi-tiem-do.md` tick đủ 5/5** và đã nhúng vào PR template
- [x] Upload ảnh thành viên chạy được
- [x] Export JSON + import round-trip xanh
- [x] Không còn endpoint giả nào (audit lại `auth.controller.ts` toàn bộ)
- [x] Clone repo mới → `cp .env.example .env` → boot được không cần sửa gì

Nếu thiếu mục nào trong 6 mục đầu thì vẫn dùng được với người thân, nhưng **không** để người lạ đăng ký.
