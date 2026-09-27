# 02 — Phạm vi SỬA

9 nhóm, xếp theo mức nghiêm trọng. **§1–§3 là điều kiện tiên quyết để cho người dùng thật.**

---

## §1. IDOR cross-tenant khi ghi cây — P0

**Đây là lỗi nghiêm trọng nhất trong codebase, và nó là hệ quả của thiết kế chứ không phải của một lỗi gõ.**

### Lỗi ở đâu

`src/modules/family/family.service.ts`, trong `syncFamilyData()`:

```ts
// dòng 35
const family = await tx.family.upsert({
  where: { id: data.family.localId },   // ← UUID do client tự sinh
  update: { ..., ownerId: userId, groupFamilyId: groupId },
  create: { ..., ownerId: userId, groupFamilyId: groupId },
});

// dòng 71
const savedMember = await tx.familyMember.upsert({
  where: { id: m.localId },             // ← tương tự
  update: { fullName, gender, dateOfBirth, ... },  // không set familyId
  create: { familyId: family.id, ... },
});
```

`localId` được DTO bắt buộc (`create-family.dto.ts:26-28`, `:147-153`) → client **phải** tự sinh UUID và gửi lên. Trong toàn bộ `syncFamilyData`, **không có một kiểm tra nào** xác nhận `localId` đó thuộc về `groupId` của người gọi.

### Khai thác được những gì

Kịch bản: user A là `EDITOR` của group A.

1. A biết/gu đoán được `family.id` của group B (UUID v4, nhưng `GET /group-family` / response của nhóm khác và nhiều chỗ rò id có thể lộ nó — cần audit riêng).
2. A gọi `POST /api/family/sync-data/{groupA}` với `data.family.localId = family.id của group B`.
3. Prisma `upsert` thấy id tồn tại → chạy nhánh `update` → set `ownerId = A`, `groupFamilyId = groupA`.
   - Kết quả: **group B mất cây, group A chiếm được cây đó.** `Family.groupFamilyId` là `@unique` nên không có xung đột chặn.
4. `Family.groupFamilyId` giờ trỏ sang group A → dòng 62 chạy
   `familyMember.deleteMany({ where: { familyId: <family của B> }, id: { notIn: <members của A> } })`
   → **xoá sạch toàn bộ thành viên cây của B.**
5. Dòng 130 `relationship.deleteMany({ where: { familyId } })` → xoá sạch quan hệ.

Tệ hơn: nếu A không chiếm family mà chỉ gửi `localId` của một `FamilyMember` thuộc nhóm khác, nhánh `update` sửa được `fullName` / `dateOfBirth` / `dateOfDeath` / `biography` của người thân của nhóm đó — **không cần chiếm family, vẫn ghi được dữ liệu**.

Dữ liệu bị đụng là tên, ngày sinh, ngày mất, tiểu sử của người thân — tức loại dữ liệu nhạy cảm nhất trong app này. Đây là lý do chặn release.

### Fix

Theo hướng **batch-first** đã chốt (D6):

1. **Bỏ `localId` khỏi định danh.** `FamilyMember.id` do server sinh. Client dùng id server trả về. Xoá `localId` khỏi `IFamilyMemberDto` / `IRelationshipDto`.
   > **Phân biệt 2 khái niệm — dễ nhầm nhất ở phần này.** `localId` là định danh client tự sinh, **loại bỏ hẳn**. `clientRef` là tham chiếu **chỉ sống trong 1 request** tới thành viên **chưa tồn tại** (để `RELATIONSHIP_CREATE` biết trỏ vào ai khi `MEMBER_CREATE` chưa trả id) — hợp lệ, và server thay bằng `id` thật trong `idMap`. Đừng dùng lại tên `localId` cho `clientRef`.
2. **Mọi truy vấn scope theo group, không theo id client.** `where: { family: { groupFamilyId: groupId }, id }` — `groupFamilyId` phải nằm trong cùng câu `where`, không kiểm ở `if` riêng (tránh TOCTOU).
3. **Tách đường ghi.** `POST /family/:groupId/changes` là **đường ghi chính** (contract đầy đủ ở `06` R1). Hai đường còn lại là **API cấp thấp** — cho script/CLI và e2e test, frontend không dùng:
   - **Chính — batch:** `POST /family/:groupId/changes`, header `If-Match`, body `{ baseVersion, operations[] }` → `200 { version, tree, idMap, activityIds }`, xung đột → `409 { currentVersion, conflicts[], tree }`. **Một `$transaction` duy nhất**, `version++` đúng 1 lần (I4), ghi hết `ActivityLog` (I5).
   - **Cấp thấp — CRUD lẻ:** `POST /family/:groupId/members`, `PATCH|DELETE /family/:groupId/members/:memberId` — mỗi request tự lấy `family` từ `groupId`, không nhận `familyId` từ client.
   - **Cấp thấp — import:** `POST /family/:groupId/import` với `dryRun` (trả về diff), `baseVersion`, `Idempotency-Key`, và `mode`:
     - `mode: 'create'` — mọi thành viên mới, tham chiếu trong payload bằng `clientRef`, server sinh id và trả `idMap` (`clientRef → id`) để client re-key.
     - `mode: 'restore'` — giữ nguyên `id` trong file. Chỉ hợp lệ khi file do chính hệ thống này xuất (`03` §5). Nếu id đã tồn tại mà nội dung khác → `409` liệt kê `conflicts`, **không** tự ghi đè.
4. **Xoá `POST /family/sync-data/:groupId`**, thay bằng 2 endpoint trên. Breaking change với frontend — `project/frontend/src/modules/family/family.actions.ts` chỉ có **1 call site** (`SyncFamilyAction`, dòng 11) nên viết lại được gọn.

### Kiểm chứng

Thêm test bắt buộc (`test/family.e2e-spec.ts`): user A `EDITOR` group A, dùng id family/member thuộc group B → mọi endpoint phải trả `403`/`404` và **không có dòng nào trong group B bị đổi**. Test này phải chạy trong CI (`test:e2e` hiện CI **không** chạy — xem `04-thu-tu-thuc-hien.md`).

---

## §2. Sync là full-replace → mất dữ liệu khi nhiều người cùng sửa

Nguyên nhân gốc: `family.actions.ts:11` gửi **toàn bộ draft tree** (`IDraftFamilyData`) mỗi lần lưu. Server nhận và xoá hết cái không có trong payload (`family.service.ts:62` và `:130`).

Hai editor mở cùng một cây → lần save sau xoá sạch việc của lần save trước, không có cảnh báo.

**Fix (bắt buộc vì đã bỏ sync ở §1):**

1. Thêm `version Int @default(0)` vào `Family`. Mỗi mutation thành công `version++` trong cùng transaction.
2. Request CRUD lẻ mang `If-Match: <version>` (hoặc body `baseVersion`). Lệch → `409 Conflict` + trả lại bản server hiện tại để client merge.
3. `updatedAt` trên `FamilyMember` cũng dùng để bắt conflict cấp từng thành viên khi hai người sửa hai người khác nhau.
4. Endpoint bulk: bắt buộc `baseVersion` khớp, nếu không → `409`, không ghi gì.

### Tín hiệu conflict thứ hai: `generation` (quyết định D10)

`generation` hiện do **client tự tính và tự ghi** — kể cả logic dịch cả cây con cháu khi thêm người vợ (`project/frontend/src/app/group/_components/forms/relationship-form.tsx:190-219`). Nó là dữ liệu dẫn xuất thuần, không có nghĩa nếu không tính từ quan hệ.

Sau khi chuyển sang server-tính (§9), so sánh giá trị client gửi lên với giá trị server tự tính là **tín hiệu phát hiện xung đột miễn phí**:

- Khớp → ghi bình thường
- Lệch hoặc thiếu → server tự tính lại, ghi log `MEMBER_GENERATION_RECOMPUTED`
- Lệch **và** `If-Match` cũng lệch → `409` trước khi ghi bất cứ thứ gì

Không cần cơ chế conflict mới nào cho phần này.

---

## §3. Authz chỉ nằm ở guard, service không tự kiểm

`getFamilyData`, `updateFamilyInfo`, `deleteFamilyData` (`family.service.ts:166-302`) đều **nhận tham số `userId` nhưng không dùng** — chỉ dùng để `isUUID` check hoặc bỏ qua. Toàn bộ quyền đi qua `RolesGuard`.

Hiện tại `RolesGuard` (`roles.guard.ts:46-48`) đọc `groupId` từ `req.params.groupId || req.query.groupId` → còn đúng vì mọi route family đều có `:groupId`. Nhưng đó là **hợp đồng ngầm**: chỉ cần một route mới mà quên `:groupId` là bypass toàn bộ phân quyền. Với `syncFamilyData`, payload `body.groupId` hoàn toàn không được kiểm — chỉ được may mắn là route có `:groupId` trong path.

**Nguyên tắc (quyết định D13):**

> Mọi service method nhận `userId` **phải** tự gọi `MembershipService.assertCan(userId, groupId, level)`.
> Guard chỉ là lớp ngoài để fail sớm. **Một route không có `:groupId` không được phép là route đọc/ghi dữ liệu của group.**

**Fix:**

1. Thêm `MembershipService.assertCan(userId, groupId, 'read' | 'edit' | 'manage')` — một nơi duy nhất tra `GroupMember`, dùng lại được.
   - `read` → `VIEWER` trở lên · `edit` → `EDITOR` trở lên · `manage` → `OWNER`
2. Mọi service method **bắt buộc** gọi nó. `userId` hết là tham số chết. Với các method đã nhận `userId` sẵn thì **giữ nguyên signature** — ít diff hơn, không phải đổi cả call-site.
3. Guard giữ vai trò lớp ngoài (fail sớm, trả 403 sớm) — nhưng không phải lớp duy nhất.
4. `RolesGuard:48` trả `false` khi thiếu `groupId` (Nest map thành 403 generic) — đổi sang `throw ForbiddenException` để message nhất quán với phần còn lại của guard.
5. Bỏ nhánh bypass `if (member.isLeader) return true;` (`roles.guard.ts:67`) — xem `01-pham-vi-bo.md` B3.

### Theo nguyên tắc D13: luật OWNER

Sau khi bỏ `isLeader` và giữ 3 vai (D7), các quyền sau **chỉ OWNER**:

| Hành động | Endpoint | Sửa từ |
|---|---|---|
| Xoá cả group | `DELETE /group-family/:groupId` | `group-family.service.ts:199` — hiện không phân biệt vai |
| Bàn giao OWNER | `PATCH /group-family/:groupId/transfer-ownership` | Thay `PATCH /group-member/leader/:groupId` (bị xoá ở B3) |
| Đổi role thành viên | `PATCH /group-member/:groupId` | `group-members.service.ts` — siết OWNER-only |
| Xoá / kick thành viên | `DELETE /group-member/:groupId` | Siết OWNER-only, trừ tự rời group |

Luật khi OWNER rời group: xem `03-pham-vi-them.md` §2.

---

## §4. Input do client kiểm soát, validation lỏng

| Vấn đề | Vị trí | Sửa |
|---------|---------|-----|
| Client tự set role khi tạo group (`role: data.role \|\| OWNER`, `isLeader` vẫn ép `true`) | `group-family.service.ts:42` | Bỏ `role` khỏi `CreateGroupFamilyDto`. Luôn `OWNER` (D7 — người tạo group là chủ sở hữu) |
| `gender` validate bằng `@IsString` rồi ép `as GENDER` — client gửi `"banana"` sẽ ném lỗi Prisma, type-cast trong TS là dối trá | `create-family.dto.ts:37-39` | `@IsEnum(GENDER)` |
| `biography` chỉ `@IsOptional()`, không `@ValidateNested` → client ghi JSON bất kỳ vào cột `Json?` | `create-family.dto.ts:87` | `@ValidateNested()` + `@Type(() => IBiographyDto)` |
| `generation` là **input do client kiểm soát** — dữ liệu dẫn xuất thuần | `create-family.dto.ts:93-94` | Bỏ khỏi DTO mọi cổng ghi. Server tự tính (D10, xem §9). Nếu còn nhận để so sánh thì thêm `@IsNumber()` cho đồng nhất với `positionX/Y` |
| `ValidationPipe` chỉ `whitelist: true`, không `forbidNonWhitelisted` | `main.ts:22-26` | Thêm `forbidNonWhitelisted: true` để field lạ bị 400 thay vì bị im lặng cắt |

Sau khi bỏ `isLeader`/blog, `RolesGuard:67` cũng phải sửa (bỏ nhánh bypass) — đã nằm trong B3.

---

## §5. Ràng buộc schema sai nghĩa

| Vấn đề | Vị trí | Sửa |
|---------|---------|-----|
| `Photo.takenAt String` và `locationName String` là **bắt buộc** — không ai nhập ngày chụp ảnh gia đình | `album.prisma:22-23` | `DateTime?` (hoặc `String?` nếu muốn nhập tự do) + `locationName String?` |
| `Photo.takenAt` là `String` chứ không phải ngày → không sort/lọc được theo thời gian | `album.prisma:22` | `DateTime?` |
| `Album` vừa có `familyId` (bắt buộc) vừa có `groupFamilies GroupFamily[]` (many-to-many không ràng buộc) | `album.prisma:4,14` | Chọn 1. Khuyến nghị: chỉ `groupId`, bỏ `familyId` + mảng `groupFamilies` — album thuộc group như mọi thứ khác |
| `Family.description` bắt buộc, trong khi `GroupFamily.description` optional | `family.prisma:10` | Cho optional, khớp `GroupFamily` |
| `FamilyMember.biography Json?` — kiểu `Json` không được Prisma kiểm, không có shape nào ở tầng DB | `family.prisma:41` | Chấp nhận `Json` nhưng **bắt buộc** có Zod/class-validator ở mọi cổng vào (xem §4) |

---

## §6. Model thiếu quan hệ — không gắn được sự kiện với người

| Vấn đề | Chi tiết |
|--------|----------|
| `Event` **không có** `familyMemberId` | `event.prisma:22-44` không có cột nào trỏ tới `FamilyMember`. Nhưng `ACTIVITY_LOG` lại có `enum TARGET_TYPE { ... EVENT_FAMILY, EVENT_SELF }` — enum nói tới việc gắn sự kiện với người, trong khi schema không cho phép. Hậu quả thực tế: **không tạo được lễ kỷ niệm gắn với 1 người cụ thể** ("ngày cụ ấy qua đời", "năm nay con trai 10 tuổi") |
| `GroupNotification` không có `familyId` / `familyMemberId` | `notification.prisma:8-28` chỉ có `groupId` / `eventId` / `eventInstanceId`. Không thể báo "anh Tuấn vừa được thêm vào cây" |
| `Notification` không có trạng thái đã gửi / retry | Email qua Resend không có bản ghi kết quả gửi. `EmailLog` tồn tại nhưng chưa rõ có ghi không — cần kiểm |
| `ActivityLog` **chưa ai ghi, và enum sai** | `grep 'activityLog.create'` trong `src/` → **0 kết quả**. Bảng có schema đầy đủ nhưng không bao giờ có dữ liệu. `TARGET_TYPE` hiện trộn loại hành động với loại thực thể (`EVENT_FAMILY` / `EVENT_SELF`) |

### Sửa `ActivityLog` (quyết định D12)

`TARGET_TYPE` đổi thành thuần loại thực thể:

```
enum TARGET_TYPE {
    FAMILY
    MEMBER
    RELATIONSHIP
    ALBUM
    PHOTO
    EVENT
    GROUP
}
```

**Bảng chuẩn `ACTION_TYPE` nằm ở `03` §10 — dùng bảng đó, đừng liệt kê lần nữa ở đây.** Tổng cộng **15** giá trị. (Bản cũ của dòng này liệt kê 8 mục và nói "11 action type" — con số sai, và danh sách thiếu `MEMBER_CREATED`/`MEMBER_UPDATED`/`MEMBER_DELETED`/`RELATIONSHIP_*`/`FAMILY_UPDATED`.)

Thêm index `(familyId, createdAt)` — chưa kiểm có sẵn hay không.

Chi tiết ghi log (kể cả delete), endpoint đọc, quyền xem: `03-pham-vi-them.md` §10.

---

## §7. Thiếu vòng bảo trì

| Vấn đề | Sửa |
|--------|-----|
| **Không có cron dọn session hết hạn.** `src/schedule/` chỉ có `task-schedule.service.ts` (dọn invite) và `event-scheduler.service.ts` (roll-forward event). `Session.expiresAt` không ai quét → bảng `session` phình vô hạn | Thêm job theo ngày trong `task-schedule.service.ts`, cùng pattern với job dọn invite đã có |
| Blog orphan-cleanup thủ công (`cleanupOrphanedMediaAction` không được trigger) | Khi viết albums, gắn auto-cleanup vào job định kỳ thay vì để gọi tay |

---

## §8. Thiếu lớp bảo mật cơ bản

| Vấn đề | Bằng chứng | Sửa |
|--------|-----------|-----|
| **Không rate limit.** Không có `@nestjs/throttler` trong `package.json` | `login-base`, `register`, `reset`, `refresh` không throttle → brute force mật khẩu + enum email | `@nestjs/throttler`, giới hạn riêng cho `/auth/*` |
| **Không `helmet`** | Không có trong deps. Thiếu security headers mặc định | Thêm `helmet` ở `main.ts` |
| **Không versioning.** `app.setGlobalPrefix('api')`, route là `/api/family/...` | `main.ts:42` | Cân nhắc `/api/v1`. Nếu sẽ bỏ endpoint (`sync-data`) và đổi shape (CRUD mới) thì versioning **rất đáng làm ngay** — vì đây đúng là lúc breaking change |
| CORS origins rỗng → `origin: []` | `main.ts:28-40`, khi `CORS_ORIGINS` thiếu thì filter ra mảng rỗng | Fail rõ ràng lúc boot thay vì âm thầm chặn hết |

---

## §9. Quan hệ, `generation` và enum phức tạp hoá

**`Relationship.type` (`PARENT | SPOUSE | CHILD`) là enum hướng, dẫn tới phải ghi 2 chiều thủ công.**

`family.service.ts:130-148` tạo **đúng những dòng client gửi**, không tự sinh quan hệ đối chiếu. Nghĩa là client phải gửi cả `A PARENT of B` **và** `B CHILD of A` — nếu quên thì cây hiển thị sai một chiều, và không có gì ở server phát hiện được.

✅ **Đã kiểm chứng — đây là bug hiển thị, không phải thừa:**

- Client **gửi 1 chiều**: `project/frontend/src/app/group/_components/forms/relationship-form.tsx:228` chỉ push `[...draft.relationships, values]` — không sinh dòng chiều ngược.
- UI **đọc cả 2 chiều**: `project/frontend/src/app/group/_components/group-content.tsx:207` (`r.toMemberId === id`) và `:331` (`r.fromMemberId === id`).

→ Cặp cha–con hiện chỉ hiện đúng ở một phía. Không có validate nào ở server, nên lỗi nằm im cho tới khi ai đó đọc cây.

**Fix (quyết định D9):** server là nơi duy nhất quyết định một quan hệ được ghi ra 2 chiều hay không. Client **không được gửi chiều đối** — nhận thấy chiều đối rồi báo 400.

**Quyết định D9 — giữ bảng `Relationship`, nhưng server là nơi duy nhất quyết định chiều:**

Client gửi **một** quan hệ. Server, trong cùng `$transaction`, tự sinh dòng chiều đối:

| Client gửi | Server tự thêm |
|---|---|
| `A --PARENT--> B` | `B --CHILD--> A` |
| `A --CHILD--> B` | `B --PARENT--> A` |
| `A --SPOUSE--> B` | **không thêm** (xem bên dưới) |

Giữ nguyên 3 giá trị enum `PARENT | SPOUSE | CHILD` vì UI đang đọc cả hai chiều (`group-content.tsx:207,331`) — bỏ `CHILD` lúc này là breaking change không cần thiết.

**Chống trùng:** thêm unique constraint vào `family.prisma`

```prisma
@@unique([fromMemberId, toMemberId, type])
```

rồi `upsert` theo unique đó thay vì `findFirst` + `update` — tránh race khi hai request ghi cùng một quan hệ.

**Chống chu trình:** trước khi ghi `A --PARENT--> B`, chạy `wouldCreateCycle(A, B)` — BFS ngược từ A qua quan hệ cha/mẹ; nếu gặp B thì ném `ServiceError` 400. Bắt buộc có unit test: A cha B → OK; B cha C → OK; C cha A → bị chặn.

**Chu trình do dữ liệu cũ mang vào:** khi phát hiện node nằm trong chu trình, **không throw** — đặt `generation = 0` và ghi 1 dòng `ActivityLog` `MEMBER_GENERATION_RECOMPUTED` kèm cảnh báo. Lý do: dữ liệu đã tồn tại, chặn cả request sẽ khiến người dùng không sửa được cây của họ; báo cáo thì họ còn biết để sửa tay.

### SPOUSE — cặp không thứ tự (quyết định D9)

Client gửi `from = chồng`, `to = vợ` — hướng theo `gender` ở tầng UI.

Nhưng **tầng lưu không gắn hướng vào `gender`**:

1. Sort `from`/`to` theo id trước khi ghi → `(from, to)` là **cặp không thứ tự**, `A SPOUSE B` và `B SPOUSE A` là cùng một thứ.
2. Nhờ đó unique constraint ở trên chặn được trùng kể cả khi client gửi ngược chiều.
3. Tầng đọc mới là nơi suy ra "ai là chồng" từ `gender` của 2 người.

Lý do không gắn `gender` ở tầng lưu: `gender` hiện là `@IsString()` rồi ép `as GENDER` (xem §4) — dữ liệu sai là thất lạc, nhân bản nó thành bất biến ở tầng lưu là nhân bản cả bug. Suy ra lúc đọc thì sai một người cũng chỉ là hiển thị sai, sửa được.

⚠️ Nếu sau này chuẩn hoá `gender` thành enum thật thì mới chuyển sang gắn hướng ở tầng lưu — kèm migration chuyển dữ liệu `SPOUSE` hiện có.

### `generation` — server là nguồn sự thật (quyết định D10)

Client hiện tự tính `generation` và tự ghi, kể cả dịch cả subtree khi thêm người vợ (`relationship-form.tsx:190-219`, đặc biệt `:199-212`). Đây là nguồn sai số liệu thứ hai trong hệ thống.

- `generation` **không còn nằm trong DTO** (xem §4). Server tính bằng BFS từ các node không có cha/mẹ; node chao = `generation = 0`.
- Tính lại sau **mỗi** mutation có đổi quan hệ, trong cùng `$transaction` với `version++`.
- Nếu client vẫn gửi `generation` (route cũ, FE chưa kịp sửa) → so sánh với giá trị server, lệch thì **409** kèm `MEMBER_GENERATION_RECOMPUTED`. Không âm thầm bỏ qua, cũng không tin client.
- Chi phí: BFS mỗi lần ghi. Cây cá nhân vài trăm node thì không đáng kể; nếu sau này vượt ngưỡng thì cache theo `version`.

### Bản nháp đã bác

Bản nháp đầu tiên của § này đề xuất **bỏ hẳn bảng `Relationship`**, chuyển thành cột `motherId` / `fatherId` / `spouseIds` trên `FamilyMember`. Đã bác vì:

- Phải viết hàm chống chu trình ancestor + unit test ngay từ đầu, tốn công hơn giá trị ở quy mô cây gia đình.
- `motherId`/`fatherId` chỉ đúng với quan hệ huyết thống **sinh học** — cấu trúc hiện tại còn chứa quan hệ nuôi và kết hôn, ép vào 2 cột là mất thông tin.
- Migration dữ liệu hiện có rủi hơn giá trị khi chưa có user thật.

### `NOTIFICATION_TYPE` — enum động không nói lên được điều gì

`NOTIFICATION_TYPE {NEW, UPDATE, DELETE, OTHER}` — không phân biệt loại thực thể, nên thông báo không cho biết *đổi gì*. Nên thay bằng cột `entityType` + `entityId` thay vì enum type động. Cùng file với §6.

---

## Thứ tự đề xuất

```
§1  (IDOR)  →  §3 (authz service)  →  §4 (validation)  →  §2 (version)  →  §5,6,7,8,9
```

§1 phải đi cùng §3: tách `MembershipService` ra là điều kiện để mọi `where` ở §1 scope được theo group. Làm §1 mà chưa có §3 thì dễ quên chỗ nào đó.
