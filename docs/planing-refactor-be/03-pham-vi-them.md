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

### 3. Gán ảnh cho node (D16 — đảo ngược bản cũ)

> ⚠️ **Bản nháp trước ghi mục này là "Upload ảnh thành viên"** — cấp quyền rỗng, ai cũng đổi được ảnh của bất kỳ ai. Đó là lý do chốt D16: **ảnh node là ảnh hồ sơ của chính người đó**, và mỗi người chỉ gán được ảnh của chính mình.

`FamilyMember.avatarUrl` (`family.prisma:40`) **có cột nhưng không có endpoint nào ghi vào**. Cloudinary chỉ dùng cho avatar user (`user.service.ts:60`) và blog-media (sắp bị xoá).

Thêm 2 đường, **cấp quyền khác nhau**:

| Đường | Ai gọi được | Cơ chế |
|---|---|---|
| **Tự động — khi pin** | Chính người đó | `PATCH /group-family/:groupId/pin` (`group-family.controller.ts:177`) đọc `User.avatarUrl` **tại thời điểm pin** và ghi `photoId` vào node. Không cần endpoint upload mới |
| **Tay — gán ảnh khác** | `OWNER` \| `EDITOR` (**quyền `edit`**) | `POST /family/:groupId/members/:memberId/photo` → `CloudinaryService.uploadFile()` vào `FOLDER_FAMILY`. Xoá media cũ khi thay |

⚠️ **Phải snapshot, không được tra động.** Chỉ lưu `pinnedMemberId` rồi đọc `User.avatarUrl` lúc trả response ⇒ một người đổi ảnh hồ sơ của mình sẽ tự đổi ảnh node đó trong **cây của người khác** — tức sửa dữ liệu người khác mà không cần quyền. Vì vậy cột `photoId` trên node là bắt buộc, không phải tuỳ chọn.

⚠️ **Chặn pin chéo.** `pinnedMemberId` phải là **chính tài khoản đang gọi endpoint**. Không có đường tắt ghi `pinnedMemberId` của người khác — nếu có, thì bỏ được cả ràng buộc "không ai sửa ảnh của người khác", vì chỉ cần pin hộ là xong.

⚠️ **Đường tay KHÔNG theo luật media ở §11.** Quyền của nó là `edit` (quyền cây), không phải quyền theo chủ media. Lý do: thao tác này sửa **dữ liệu cây**, không sở hữu media. Nếu áp luật §11 thì OWNER/EDITOR không gán tay được ảnh cho node — mất đúng tính năng cần thiết.

Đây là tính năng người dùng gia đình dùng đầu tiên — cây mà toàn ảnh trắng thì không có giá trị gì.

### 4. `POST /auth/register` nhận `?token=` — đăng ký là ngã ba (D14, D15)

Hiện tại `POST /auth/register` chỉ tạo user, không đụng group. Nhưng FE sẽ gửi `?token=` khi người ta mở link mời — và nếu backend phớt lờ thì người đó **không vào được cây nào**, hoặc tệ hơn: FE tự tạo cây riêng cho họ.

| Trường hợp | Hành vi bắt buộc |
|---|---|
| **Có `?token=` hợp lệ** | Tạo user → **join group của link**, vai **`VIEWER`**, **không** tạo group mới. Response trả `groupId` + `role` |
| **Không có token** | Tạo user → tạo **1 group + 1 cây rỗng**, vai **`OWNER`**. Response trả `groupId` + `role` |
| Token **hết hạn** / **đã dùng** / sai | `409` + câu rõ nguyên nhân. **Tuyệt đối không fallback sang tạo cây riêng** |

⚠️ **Dòng cuối là điểm quan trọng nhất của mục này.** Nếu token lỗi mà backend tạo group, người dùng sẽ có **2 cây** mà không hề hay biết — đúng cái trạng thái ngõ cụt mà D14 cấm. Lỗi phải **chặn người dùng lại** để họ hỏi lại người mời.

⚠️ **Cũng phải chặn group thứ 2** ở `POST /group-family`: đã có group → `409`. Nếu không, chỉ cần gọi API là tạo group thứ 2, tức lách bất biến I6. Xem `01` B11.

Cùng mục này — `GET /invite/mine` **không được tạo**: cố ý không có màn quản lý lời mời (F7). Xem `01` B11.

### 10. ActivityLog — làm thật (nâng lên P0, quyết định D12)

`ActivityLog` + `ACTION_TYPE` + `TARGET_TYPE` có đủ schema, nhưng `grep 'activityLog.create'` trong `src/` → **0 kết quả**. Bảng không bao giờ có dữ liệu.

Với app gia đình, lịch sử thay đổi không phải tiện nghi — nó là thứ phân biệt "sửa nhầm có thể gỡ lại" với "sửa nhầm mất luôn". Vì vậy **nâng từ P2 lên P0**. Nhưng phải làm **cùng phase** với soft-delete (§11) và CRUD lẻ (§1), vì log ghi trong cùng `$transaction` với mutation — làm riêng sẽ không gắn được vào đúng lần ghi.

Nguyên tắc: **không ghi kiểu "best effort" phía sau.** Mutation + `ActivityLog` phải cùng `$transaction` — tách ra thì log lệch với dữ liệu thật, tức là log sai còn tệ hơn không có log.

Cần:

- `TARGET_TYPE` đổi thành **thuần loại thực thể**: `FAMILY | MEMBER | RELATIONSHIP | ALBUM | PHOTO | EVENT | GROUP`
- `ACTION_TYPE` mở rộng — **bảng chuẩn nằm ở bên dưới, đừng liệt kê lần nữa ở đây**
- `@@index([familyId, createdAt])` — truy vấn lịch sử luôn theo family + thời gian

**Bảng action phải ghi — 15 `ACTION_TYPE` phân biệt (chuẩn, dùng bảng này):**

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
| `FAMILY_IMPORTED` | import GEDCOM / JSON | `{ source, memberCount, errorCount, mode }` |
| `OWNERSHIP_TRANSFERRED` | bàn giao OWNER | `{ fromUserId, toUserId }` |
| `MEMBER_ROLE_CHANGED` | đổi role | `{ from, to }` |
| `MEMBER_JOINED` / `MEMBER_LEFT` | vào / rời group | `{ userId }` |
| `FAMILY_LAYOUT_CHANGED` | `LAYOUT_SAVE` — lưu hoặc auto-arrange bố cục | `{ movedCount, arranged: boolean }` (`arranged: true` = server tự sắp từ đầu, tức nút *Sắp xếp*). ⚠️ **Vẫn bắt buộc bump `version`** — lý do đã đổi, xem `06` R1.4 |
| `MEMBER_GENERATION_RECOMPUTED` | BFS tính lại `generation` | `{ affectedCount, cycleDetected }` |
| `PHOTO_HIDDEN` / `PHOTO_UNHIDDEN` | ẩn / mở ẩn ảnh (xem §11) | `{ photoId, byUserId }` |

⚠️ **`MEMBER_GENERATION_RECOMPUTED` chỉ ghi khi `cycleDetected: true`.** Đây là log *bất thường*, không phải log mỗi lần tính — ghi mỗi lần sẽ spam lịch sử mỗi lần mở cây. Khi phát hiện chu trình: đặt `generation = 0` cho các thành viên trong chu trình, ghi 1 dòng log, và **không** throw (xem D10 — server là nguồn sự thật, nhưng dữ liệu hỏng thì phải vẫn render được kèm cảnh báo).

⚠️ **Xoá một thành viên ghi 2 dòng** (dòng xoá + dòng ảnh hưởng dây chuyền). Một dòng là không đủ để biết mất bao nhiêu. Vì vậy 14 dòng bảng = **17** `ACTION_TYPE`.

⚠️ **`PHOTO_HIDDEN` phải ghi, dù người bị ẩn không hề hay biết.** Ẩn là thao tác của riêng một người nhưng khiến ảnh biến mất khỏi tầm nhìn của tất cả. Không có log thì khi bị khiếu nại "ảnh tôi biến mất", không có gì để trả lời. `content` phải có `photoId` **và** `byUserId` (người ẩn) — cột `hiddenById` là hạ tầng, không thay thế được cho log. Xem `06` R2.1.

> **Tuỳ chọn, chưa chốt:** `MEMBER_PHOTO_CHANGED` (đổi ảnh thành viên) — sẽ đưa tổng lên **16**. Frontend nên coi đây là giá trị *có thể* xuất hiện và có nhãn dự phòng, không hard-code danh sách đóng. Xem `06` R2.1.

`content` lưu **diff + snapshot**, không lưu nguyên bản ghi — cắt được phần lớn 2KB/bản ghi mà vẫn đủ để audit. Với thao tác batch (`POST /family/:groupId/changes`, `06` R1), `content` ghi thêm `opIndex` để truy ngược dòng log về đúng operation nào trong request.

⚠️ Trong `content` và trong mọi trường tham chiếu phía client dùng tên **`clientRef`** cho thành viên *chưa tồn tại* (xem `02` §1) — **không** dùng `localId`.

**API đọc log:** `GET /family/:groupId/activity?cursor=&action=&targetType=&from=&to=`

- Phân trang bằng **cursor** (`createdAt + id`), không offset — bảng này sẽ dài dần.
- **Chỉ OWNER/EDITOR xem được.** VIEWER không thấy ai sửa gì về gia đình họ.
- Rate limit riêng.

**Không ghi log cho:** job cron (roll-forward event, dọn invite) và mọi thao tác hệ thống. Log trả lời "con người làm gì"; cron không phải con người.

---

### 11. Trash / soft delete + **chủ sở hữu media** (D15, bất biến I7)

`/user/trash` có trong menu sidebar nhưng không có page. Xoá nhầm thành viên trong cây gia đình rất dễ xảy ra, và hiện **không hoàn tác được**.

Nâng lên P0 vì **lý do kỹ thuật chứ không phải lý do tiện nghi**: `MEMBER_DELETED` cần snapshot để dựng lại (§10), mà `DELETE` cứng đã xoá dòng thì không còn gì để chụp. Soft-delete là tiền đề của audit log, không phải một tính năng đứng riêng.

#### 11.1 Cột bắt buộc

Không thêm cột này thì **không phân biệt được ảnh của ai** — mà đó là gốc rễ của toàn bộ quyền media (D15).

| Bảng | Cột | Bắt buộc | Vì sao |
|---|---|---|---|
| `Photo`, `Album`, `Event` | `createdById String` (quan hệ `User`) | ✅ **không null** | Chủ = **người upload**. Không có media nào mà không có chủ |
| `Photo`, `Album`, `Event` | `deletedAt DateTime?` | ✅ | Mồ côi thời gian → job dọn 30 ngày |
| `Photo`, `Album`, `Event` | `deletedById String?` | ✅ | Biết **ai** xoá — thùng rác tách theo người, không ai khôi phục hộ được |
| `Photo` | `hiddenById String?` | ✅ | Ẩn = userId, **không** phải `hiddenAt` trần: phải biết *ai* ẩn để mở lại, và người khác không thấy |
| `FamilyMember` | `deletedAt DateTime?` | ✅ | Đã chốt từ trước |
| Tất cả | `@@index([createdById])`, `@@index([deletedAt])` | ✅ | Lọc theo chủ và lọc mồ côi là 2 query nóng nhất |

⚠️ **`createdById` không null ⇒ migration phải backfill.** Xem `04` — backfill bằng **group OWNER** (người có quyền tối đa, còn tồn tại chắc chắn), rồi mới thêm ràng buộc NOT NULL. Không thêm được cột null rồi điền sau cũng được — dữ liệu cũ sẽ có media không chủ.

#### 11.2 Luật quyền media — chủ media, không phải cả nhóm

| Hành động | Chủ media | EDITOR khác | VIEWER khác | group OWNER |
|---|---|---|---|---|
| Xem media đang hiện | ✅ | ✅ | ✅ | ✅ |
| Thêm media | ✅ | ✅ | ✅ | — |
| Sửa / xoá / ẩn / khôi phục **của mình** | ✅ | — | — | ✅ |
| Sửa / xoá / ẩn media **của người khác** | ❌ | ❌ | ❌ | ✅ |
| Xem media **đã ẩn** của người khác | ❌ | ❌ | ❌ | ✅ |
| Mở ẩn media của người khác | ❌ | ❌ | ❌ | ✅ |
| Xem thùng rác **của mình** | ✅ | — | — | ✅ |
| Xem thùng rác của người khác | ❌ | ❌ | ❌ | ✅ |

3 hệ quả kỹ thuật bắt buộc, vi phạm là IDOR:

1. **Bộ lọc phải ở tầng service, không ở controller.** Mọi query đọc media phải: `AND (hiddenById IS NULL OR hiddenById = :me)` — và **nếu là group OWNER thì bỏ hẹn điều kiện này**. Đây là biến thể của bất biến I1: ẩn là một kiểu scope, phải scope theo cả quyền lẫn danh tính. Đặt ở controller thì chỉ cần một endpoint quên gọi là lộ.
2. **`hiddenById` chỉ 1 người, không phải danh sách.** "Ẩn cho riêng tôi ở nhiều thiết bị" cần bảng riêng — mô hình hiện tại **không cần** nên không làm. Ghi rõ để không ai tự thêm mảng.
3. **`hiddenById` phải ghi `ActivityLog`** với `PHOTO_HIDDEN`/`PHOTO_UNHIDDEN` — xem §10.

#### 11.3 Endpoint

- `GET /family/:groupId/trash` — **tách 2 nguồn**: cây (`FamilyMember`, quyền `edit`) và media (`createdById = :me`, quyền theo chủ sở hữu). Trả 2 danh sách tách biệt, FE hiện 2 tab.
- `POST /family/:groupId/trash/:id/restore` — chỉ khôi phục được **thứ mình xoá** (media) hoặc thứ thuộc cây (quyền `edit`).
- Job dọn sau 30 ngày — job này **không** ghi `ActivityLog` (xem §10).
- Mọi query đọc cây mặc định lọc `deletedAt: null`; đây là bất biến phải ghi vào `05-pham-vi-tiem-do.md`.

⚠️ **Xoá album ≠ xoá ảnh.** Xoá 1 album chỉ gỡ các `Photo` khỏi album đó; ảnh còn nằm album khác thì **giữ nguyên**. Xoá hẳn `Photo` chỉ khi nó không thuộc album nào nữa. Nếu gộp 2 việc này thì xoá nhầm 1 album sẽ mất ảnh của người khác.

⚠️ **Xoá tài khoản → chuyển chủ, không cascade xoá.** `User` bị xoá thì `createdById` của media họ sẽ trỏ tới user không tồn tại ⇒ media thành mồ côi, không ai sở hữu, không ai xoá được, không ai khôi phục được. Phải `UPDATE` hết về group OWNER trước khi xoá user. Nhánh này chạy cùng D8 (bàn giao quyền).

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

Ba thứ cần, nhưng chúng **không cùng bản chất** — đừng gộp làm một:

| # | Nhu cầu | Bản chất | Ưu tiên |
|---|---|---|---|
| 1 | **Export JSON** | Chỉ đọc → file | **P1** |
| 2 | **Import GEDCOM** (`*.ged`) | Ghi **hàng loạt** | **P1** |
| 3 | **Export ảnh cây** (PDF/PNG) | Chỉ đọc, nặng, server-side | **P2** (mục 13) |

**1. Export JSON** — toàn bộ cây ra file. Rẻ, làm trước. Cùng format với `POST /import` mode `restore` → tạo thành **vòng bảo đảm dữ liệu thật**: xuất ra → nhập lại → cây y hệt, kể cả id.

**2. Import GEDCOM** — nguồn dữ liệu có sẵn lớn nhất về cây gia đình. Thư viện: `gedcom` (Node). Map `INDI`/`FAM`/`HUSB`/`WIFE`/`CHIL` → `FamilyMember` + quan hệ. Kèm báo cáo lỗi dòng theo dòng — dữ liệu GEDCOM thực tế rất bẩn, nên `report` phải trả về danh sách `{ line, code, message }` chứ không chỉ tổng số lỗi.

#### Hợp đồng `POST /family/:groupId/import` (xem `06` R2.5)

Import là **con đường ghi hàng loạt duy nhất** ngoài `/changes`, và nó **không gộp được** với `/changes` vì nhận **file** và phải **parse + báo lỗi theo dòng**. Giữ là endpoint riêng.

```
headers: If-Match, Idempotency-Key
body:    { mode: 'create' | 'restore', dryRun?: boolean, baseVersion, payload }

  mode: 'create'   → mọi thành viên mới; tham chiếu trong file bằng clientRef
  mode: 'restore'  → giữ nguyên id trong file (chỉ hợp lệ với file do hệ thống này xuất)

200          → { version, tree, idMap, activityIds, report }
dryRun: true → { dryRun: true, idMap, conflicts, report, tree }    // không ghi gì
```

Luồng UI: `dryRun: true` → xem diff + report → người dùng xác nhận → gửi lại không có `dryRun`. `Idempotency-Key` chống double-submit khi người dùng bấm nút nhiều lần.

#### ⚠️ Gộp trùng: chưa hỗ trợ

`mode: 'restore'` **không** phải là cơ chế gộp thông minh. Nếu `id` trong file đã tồn tại mà nội dung khác thì phải **409 liệt kê `conflicts`** và **không** tự ghi đè — ghi đè âm thầm là cách nhanh nhất để mất dữ liệu gia đình mà không ai nhận ra. Gộp trùng (merge theo tên + ngày sinh) là việc riêng, để đợt sau.

Sau khi ghi, ghi log `FAMILY_IMPORTED` với `{ source, memberCount, errorCount, mode }` (xem §10) — **kể cả import thất bại một phần**, vì đó là lúc người dùng cần biết mình vừa làm hỏng gì.

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

Thêm **đúng 1 cột** `familyMemberId String?` + index. Mở ra: sinh nhật/nhật niên theo từng người, "kỷ niệm ngày cụ qua đời", timeline cá nhân. Đây là phần làm cho module Events trở nên hữu ích với gia đình thật — hiện nó chỉ là lịch chung.

**Cố ý KHÔNG thêm bảng `EventParticipant`** (xem `06` R2.3). Lý do: cột này trả lời "sự kiện này **thuộc về** người này" — quan hệ 1–1. Danh sách khách mời trả lời "những người **dự** sự kiện" — quan hệ nhiều–nhiều, cần bảng riêng. Dồn hai ý nghĩa vào 1 cột thì về sau sẽ không biết `familyMemberId` đang nói cái nào. Nhu cầu khách mời đã bị cắt khỏi phạm vi đợt này (chuyển P2, xem mục 13).

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

- `docs/planing-refactor-be/05-pham-vi-tiem-do.md` — nhúng vào PR template / checklist review từ phase 1, và chính file này phải được sửa nếu một bất biến bị vi phạm (tức là bất biến sai, không phải code sai).
- `docs/pending_features.md` — đã lỗi thời (xem `01-pham-vi-bo.md` B9).

### 13. Export ảnh cây PDF/PNG (tách từ mục 5, hạ xuống P2)

Nhu cầu "in cây gia đình treo tường". **Tách khỏi mục 5 có chủ đích** — vì nó là tác vụ **chỉ đọc**, không liên quan endpoint ghi, không cần `version`, không ghi `ActivityLog`, không cần `dryRun`. Nhối nó vào §5 khiến cả mục mang luôn baggage của đường ghi mà không dùng tới.

Cần: dựng SVG từ cây → render PDF/PNG server-side. Cân nhắc:

- **Font tiếng Việt** — bắt buộc phải nhúng font hỗ trợ dấu, không thì tên người Việt ra thành ô vuông. Đây là lỗi kinh điển của mọi thư viện render server.
- **Chọn lọc thành viên** — cây 500 người không in nổi. Cần tham số `generationRange` hoặc `memberIds` để in một nhánh.
- Quyền: `edit` (EDITOR+) — đây là dữ liệu gia đình, VIEWER không được tải ảnh cây ra máy mình.

Trước khi làm, cân nhắc phương án rẻ hơn: **render bằng SVG ở frontend rồi in bằng trình duyệt**. Chất lượng tốt hơn server-side, không tốn CPU, không cần thư viện render headless. Chỉ chọn server-side khi thật sự cần nhúng ảnh vào email hoặc API trả về file cho app mobile dùng.
