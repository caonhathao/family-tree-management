# 03 — Phạm vi THÊM

> Thứ tự theo mức độ quan trọng với **người dùng thật**, không theo mức độ dễ.
> §1–§4 là P0: thiếu chúng thì app dùng được nhưng không an toàn và không bền vững.
>
> Mục bị **cắt khỏi phạm vi** đã chốt 2026-09-27: **`§10`** (sự kiện có người tham gia) — xem giải thích tại chỗ. Mục **tách ra từ `§5`**: **`§13`** (export ảnh cây).

---

## P0 — dùng thiếu là hỏng

### §1 — Màn hình lịch sử thay đổi

`GET /family/:groupId/activity` (backend `02` bước 2.8, OWNER/EDITOR) **đã có sẵn dữ liệu nhưng không có UI** — đúng nghĩa "tính năng không bao giờ tới tay người dùng".

| Mục | Nội dung |
|---|---|
| Route | `/group/activity?groupId=` |
| Vị trí | Mục *Lịch sử* trong `panel-editor.tsx`, nhóm *Hành động*. **Không** đưa vào sidebar chung — đây là việc của cây, không phải của profile |
| Phân trang | **Cursor**, không offset. Offset sẽ trùng/mất dòng khi ai đó vừa ghi log (R2.2) |
| Bộ lọc | `action`, `targetType`, `from`, `to` |
| Hiển thị | Icon + nhãn tiếng Việt cho **15 action type** × **7 target type** — dùng bảng ánh xạ tập trung (`02` §13), không rải `switch` |
| Diff | `{ fullName: { from, to } }` → hiện `Tên: "A" → "B"`. Với `MEMBER_DELETED` là snapshot `{ fullName, birthDate, isDeceased }` |
| **Quan trọng** | Xoá 1 thành viên sinh **2 dòng** (1 dòng xoá + 1 dòng thiệt hại lan toả). UI phải hiển thị cả 2, nếu không người dùng không biết mất bao nhiêu |

⚠️ **VIEWER không được xem** (backend `03` §10) → ẩn mục menu, và **không** để route gọi được: 403 phải ra 403, không phải trang trắng.

⚠️ Đây cũng là **nguồn dữ liệu cho hộp thoại 409** (`§12`): thông điệp *"Bạn Tuấn đã sửa gì"* đọc từ đây, nên xây UI log trước hoặc cùng lúc với UI 409.

---

### §2 — Thùng rác + khôi phục

Menu *Thùng rác* đã có ở `sidebar-profile.tsx:64-67` nhưng **không có trang**. Soft-delete `FamilyMember` là tiền đề kỹ thuật của `ActivityLog` (backend `03` §11 — D12), nên đây không phải tiện nghiệp.

| Mục | Nội dung |
|---|---|
| Route | `/user/trash` — giữ đúng URL hiện tại để không phải sửa menu |
| API | `GET /family/:groupId/trash`, `POST /family/:groupId/trash/:id/restore` |
| API đổi ý nghĩa | Xoá thành viên = **soft delete** (`deletedAt`), không phải `DELETE` cứng |
| Nhóm thùng rác | **Tách theo người.** Mỗi người thấy cái mình xoá. Xem bảng quyền ở `02` §15 |
| Hiển thị | Tên, ngày sinh, **ai xoá** và **lúc nào** (từ `ActivityLog`), nút *Khôi phục*, nút *Xoá vĩnh viễn* |
| Tự động | 30 ngày → purge job phía backend. FE hiện *"Sẽ bị xoá vĩnh viễn sau 30 ngày"* |

⚠️ **Khôi phục phải khôi phục cả quan hệ đã bị xoá theo.** Backend xử lý phần này (snapshot trong `ActivityLog` là để dựng lại được). FE chỉ gọi 1 endpoint, **không** tự dựng quan hệ — tự dựng là chỗ dễ sinh dữ liệu sai nhất.

⚠️ **Thùng rác này và thùng rác media là 2 thứ khác nhau, dùng chung 1 menu.** Thành viên trong cây (soft-delete `FamilyMember`) là dữ liệu cây → quyền `edit`. Media (ảnh, album) là dữ liệu media → quyền theo **chủ sở hữu** (Q17). Xoá 1 ảnh trong album không liên quan gì tới việc xoá 1 người khỏi cây, và người EDITOR xoá nhầm người thì vẫn khôi phục được — nhưng **không** khôi phục được ảnh của người khác nếu không phải chủ ảnh. Menu *Thùng rác* phải có **2 tab**, không trộn 2 loại vào 1 bảng.

⚠️ **Đổi ý nghĩa của `DELETE` cần nói rõ trong UI.** Hôm nay xoá là mất vĩnh viễn, ngày mai là vào thùng rác. Người dùng cũ quen cách cũ sẽ bấm xoá rồi đóng dialog. Thêm dòng *"Có thể khôi phục trong 30 ngày"* ngay trong dialog xác nhận.

---

### §3 — Tìm kiếm thành viên

Hiện tại **không có** endpoint tìm kiếm, nên frontend **phải tự lọc toàn bộ cây** trong bộ nhớ. Với cây 300 người thì lọc client vẫn chạy được — nhưng đó là dấu hiệu kiến trúc sai: dữ liệu bị tải hết về rồi lọc ở client.

| Mục | Nội dung |
|---|---|
| API | `GET /family/:groupId/members?q=` (`mode: 'insensitive'`, đã có index `@@index([fullName])`) |
| Bắt buộc | Server **phải** lọc `deletedAt: null` (backend `03` §11) |
| UI | Ô tìm trong `panel-editor.tsx`, kết quả là list thu gọn, bấm → focus + pan tới node đó |
| Trạng thái rỗng | Cần phân biệt *"không có kết quả"* với *"chưa gõ gì"* |

⚠️ **Không thay thế tìm kiếm client** bằng tìm server cho thao tác gõ tức thì. Gõ 3 ký tự đã gọi API là spam. Giữ bộ lọc client cho tìm trong cây đang mở; API dùng cho tìm toàn cục và cho tầng sau.

---

### §4 — Gán ảnh cho node (Q14)

`FamilyMember.avatarUrl` **có cột** nhưng **không endpoint nào ghi vào**. Đây là thứ người dùng chạm vào đầu tiên — một cây toàn ảnh trắng thì không có giá trị gì.

⚠️ **Bản nháp trước gọi mục này là "Ảnh thành viên" và đó là cách nhầm.** Theo Q14, ảnh node **không phải ảnh riêng của thành viên trong cây** — nó là **ảnh hồ sơ cá nhân** của người đó. Người trong cây có thể không có tài khoản (ông nội, bà ngoại đã mất tài khoản) nhưng vẫn có ảnh trên cây. Ngược lại, tài khoản có thể có ảnh hồ sơ mà chưa từng vào cây nào.

Hệ quả thiết kế — **2 đường, 1 bảng, quyền khác nhau:**

| Đường | Ai làm | Ảnh lấy từ đâu | Cấp quyền | Lưu ở |
|---|---|---|---|---|
| **Tự động — pin** | Bất kỳ ai, cho chính mình | **Avatar hồ sơ của chính người pin**, chụp tại thời điểm pin | Không cần — là việc của chính mình | `node.pinnedMemberId` + `node.photoId` |
| **Gán tay** | OWNER / EDITOR | Bất kỳ media nào trong nhóm, hoặc upload mới | `edit` | `node.photoId` |

| Mục | Nội dung |
|---|---|
| API (đường tay) | `POST /family/:groupId/members/:memberId/photo` (backend `03` §3) |
| API (đường pin) | Mở rộng `PATCH /family/:groupId/members/:memberId/pin` — nhận thêm `photoId` (`02` §6) |
| Thư viện | Thêm lại `next-cloudinary` đã xoá ở `FE-B7`, dùng `CldUploadWidget` cho chọn ảnh |
| Xử lý | Upload lên Cloudinary `FOLDER_FAMILY`; **xoá media cũ** khi thay; nhấn xoá → xoá cả trên Cloudinary |
| UI | Nút pin trong `family-member-form.tsx` (đã có) + nút gán tay ở `panel-editor.tsx`; hiển thị ở `family-member-node.tsx` (React Flow) |
| Tương tác với `§3` | `getLayoutedElements` cần biết ảnh có tồn tại không để chừa chỗ — ảnh tải về **sau** khi cây đã layout sẽ nhảy layout |

⚠️ **`next-cloudinary` phải thêm lại ở stage này**, không giữ từ `FE-B7`. Giữ một dependency không ai import chỉ để "sẵn sàng" là giữ code chết có chủ đích.

⚠️ **Phải chụp ảnh lúc pin, không đọc động khi render.** Nếu render node mà đọc `avatarUrl` của tài khoản `pinnedMemberId` trỏ tới, thì người A đổi ảnh hồ sơ sẽ tự đổi ảnh node trong cây của người B — phá vỡ đúng quy tắc *"không ai sửa được ảnh của người khác"*. Phải snapshot `photoId` vào node, ghi 1 lần lúc pin, không bao giờ đồng bộ theo sau đó. Chi tiết ở `02` §6.

⚠️ **Backend phải chặn pin chéo.** Người dùng A gửi payload `pinnedMemberId: <tài khoản B>` để lấy ảnh hồ sơ của B ⇒ backend phải so với user hiện tại và từ chối. UI gửi `pinnedMemberId` của chính mình không phải là đủ.

⚠️ Upload phải **debounce + huỷ request cũ** — người dùng đổi ảnh nhanh sẽ tạo nhiều media cũ trên Cloudinary nếu không huỷ.

⚠️ Backend cần chốt có xoá media cũ ngay trong request hay để job dọn dẹp. FE không được giả định media cũ đã bị xoá cho tới khi API trả xác nhận.

⚠️ **Đường tay không được nằm trong luật media.** Gán ảnh người khác lên node là thao tác trên **cây**, quyền `edit` — không phải thao tác trên media của họ. Nếu áp luật media (`createdById`) vào đường này thì EDITOR sẽ không gán được ảnh cho bất kỳ ai, mâu thuẫn với bảng phân quyền ở `02` §15.

---

## P1 — dùng được nhưng khó chịu

### §5 — Import / Export / Khôi phục

Grep `gedcom|pdf|export` trong `src/` → **0 kết quả**. Đây là thứ biến app từ "demo" thành "công cụ thật": cây gia đình là dữ liệu **không thể tạo lại**.

Mục này gộp **3 nhu cầu khác nhau** — đừng dựng chung 1 luồng:

| # | Hướng | Vì sao ở thứ tự này |
|---|---|---|
| **5.1** | **Export JSON** | Rẻ nhất, làm trước, và **đúng bằng** format mà `POST /import` nhận → tạo thành vòng bảo đảm dữ liệu thật |
| **5.2** | **Khôi phục từ JSON** | Chính là 5.1 quay lại. Thiếu nó thì "export" chỉ là tải file về rồi không dùng được (xem ⚠️ bên dưới) |
| **5.3** | **Import GEDCOM** (`*.ged`) | Nguồn dữ liệu cây gia đình lớn nhất đang tồn tại. Thư viện `gedcom` (Node). Dữ liệu GEDCOM thật **rất bẩn** → báo lỗi **dòng bằng dòng**, không phải "import thất bại" |
| **5.4** | **Export ảnh cây** (PDF/PNG) | **Tách sang P2** → xem `§13`. Chỉ đọc, không đụng `version` / log / `dryRun` |

**Hai chế độ của `POST /api/v1/family/:groupId/import`:**

| `mode` | Khi nào dùng | Server làm gì |
|---|---|---|
| `create` | File GEDCOM, hoặc JSON do người dùng tự sửa | Mọi thành viên là **mới**; tham chiếu trong payload bằng **`clientRef`**, server sinh `id` mới, trả `idMap` |
| `restore` | File JSON do **chính hệ thống** export ra | **Giữ nguyên `id`** trong file → album, ảnh, quan hệ, log, bố cục đều trở lại đúng chỗ |

```ts
POST /api/v1/family/:groupId/import
  headers: If-Match, Idempotency-Key
  body: { mode: 'create' | 'restore', dryRun?: boolean, baseVersion, payload }

200        → { version, tree, idMap, activityIds, report }
dryRun:true → { dryRun: true, idMap, conflicts, report, tree }   // không ghi gì
```

⚠️ **Vì sao `restore` là bắt buộc, không phải tuỳ chọn.** Bản cũ của kế hoạch nói export JSON là *"bản sao lưu thật sự"* nhưng lại yêu cầu import **không nhận primary key**. Hai câu đó mâu thuẫn: nhập lại thì server **sinh id mới**, mọi tham chiếu (album, ảnh, log, bố cục) **đứt hết** → đó không phải khôi phục, đó là nhập lại từ đầu. `mode: 'restore'` mới làm 5.1 + 5.2 thành một cặp khép kín. Xem backend `06` R2.5.

⚠️ **`restore` là tương thích, không phải gộp thông minh.** Id trong file đã bị chiếm bởi bản ghi khác (kể cả khác nội dung) → `409` + `conflicts[]`, **không ghi đè**. Đừng hiển thị *"khôi phục thành công một phần"* cho trường hợp này — người dùng sẽ tưởng cây đã đúng.

⚠️ **Gộp trùng: chưa hỗ trợ.** Cả `create` lẫn `restore` đều **không** tự nhận diện trùng tên / ngày sinh — cùng tên là 2 người khác nhau ở 2 thế hệ khác nhau, và tự gộp là cách nhanh nhất để phá dữ liệu cây. Ghi rõ trong UI: *trùng thì bạn tự quyết định giữ hay bỏ, hệ thống không đoán hộ*. Nếu sau này cần gộp thì đó là 1 tính năng riêng, có `dryRun` riêng — **không** phải mặc định.

⚠️ **Import là đường *nạp hàng loạt từ file*, không phải đường ghi DUY NHẤT.** Bản cũ ghi *"DUY NHẤT"* — sai: `/changes` mới là đường ghi chính (`02` §0 R1), còn `/import` là đường riêng vì nhận file + parse + **báo lỗi theo dòng** (khái niệm mà `/changes` không có). Vẫn phải qua `dryRun` → xem diff → xác nhận mới ghi. **Không được** đi qua logic sync cũ (đã xoá ở `02` §2) — đường đó không scope `groupFamilyId`, tức là chính là IDOR.

⚠️ `idMap` từ R1.5 là thứ cho phép re-key sau import. Nếu backend chỉ trả `version` mà không trả map thì cây sau import sẽ lệch id.

⚠️ Upload file GEDCOM lớn: cần progress thật, không phải spinner. File thật có thể vài MB và parse mất vài giây.

---

### §6 — Chia sẻ chỉ đọc

Không tồn tại (`grep shareLink|visibility|@Public` → 0). Cho phép gửi cây cho người thân **không có tài khoản** — với app gia đình đây là điều kiện để nó lan truyền được.

| Mục | Nội dung |
|---|---|
| API | Backend `03` §6 — token chỉ đọc, có hạn, thu hồi được |
| Route | `/share/[token]` — **nằm ngoài** `publicRoutes` hiện tại vì nó xác thực bằng token chứ không phải cookie. Xem `FE-B10` |
| UI tạo | `/group/share`: tạo link, đặt hạn (7/30/90 ngày), thu hồi, xem số lần mở |
| UI đọc | Chỉ render cây. **Mọi nút ghi phải vắng mặt**: không *Lưu*, không *Sắp xếp*, không *Xoá*, không *Thêm thành viên* |

⚠️ **Đây là bề mặt tấn công mới** — phải scope `groupFamilyId` y hệt mọi route khác (bất biến I1 phía backend), có rate limit riêng, và dùng guard riêng chứ **không** dùng `AtGuard`.

⚠️ **Ẩn nút ≠ chặn ghi.** Nếu route chia sẻ lọc qua cùng component với `/group` mà chỉ giấu UI thì vẫn gọi được API. Phải tách component hoặc chặn ở tầng data.

---

### §7 — Quên / đặt lại mật khẩu

`POST /auth/reset` phía backend là **endpoint giả** — tìm user theo email, không tạo token, không gửi gì, vẫn trả success (`01` backend `BE-B7`). Ở FE chưa từng có UI nào gọi nó (`FE-B5`).

| Mục | Nội dung |
|---|---|
| Route 1 | `/auth/forgot-password` — nhập email, gửi link |
| Route 2 | `/auth/reset-password?token=` — đặt mật khẩu mới |
| API | `PasswordResetToken` lưu **hash** (backend `03` §9) |
| Liên kết | Thêm mục *Quên mật khẩu?* vào `login-form.tsx` |

⚠️ **Trả lời giống nhau dù email có tồn tại hay không** — nếu phản hồi khác nhau thì endpoint này là công cụ dò email. Phải dùng đúng câu chữ trung tính.

⚠️ **Đổi mật khẩu = thu hồi mọi `Session`** phía backend. Nếu FE không thông báo *"bạn sẽ bị đăng xuất khỏi mọi thiết bị"*, người dùng sẽ bị logout khỏi điện thoại mà không hiểu vì sao.

⚠️ Cả 2 route phải thêm vào `publicRoutes` (`proxy.ts:6-16`) — nếu quên, redirect `/auth` thành vòng lặp vô hạn.

---

### §8 — Album ảnh

`src/modules/albums/` phía FE chỉ có vài dòng comment; phía backend `AlbumsModule` cũng là stub. Schema `Album`/`Photo` có sẵn nhưng không code nào dùng.

| Mục | Nội dung |
|---|---|
| Route | `/group/albums?groupId=` |
| Phạm vi | Album thuộc **group** (backend `02` §5 bỏ `familyId` + mảng `groupFamilies`) |
| Tính năng | CRUD album, upload nhiều ảnh, xoá ảnh (xoá cả trên Cloudinary), gắn ảnh vào **thành viên** |
| Dùng lại | Bộ table kit từ `admin/_components` (`FE-B10`) + `FOLDER_ALBUM` |
| Dọn dẹp | Logic `cleanupOrphanedMediaAction` chuyển từ blog-media sang đây (backend `01` `BE-B1`) |
| **Chủ sở hữu** | `Album.createdById` = người tạo album. Xem bảng quyền bên dưới |

⚠️ Album **không** phải nơi lưu ảnh thành viên. Ảnh node là `avatarUrl` 1 ảnh chụp từ hồ sơ (`§4`); album là bộ sưu tập. Trộn 2 khái niệm sẽ làm tìm kiếm và xoá trở nên mơ hồ.

#### Quyền theo chủ sở hữu (Q17)

Áp đúng bảng trục 2 ở `02` §15 — **không** theo vai trò:

| Hành động | Chủ album | Khác phần EDITOR | Khác phần VIEWER | group OWNER |
|---|---|---|---|---|
| Xem album đang hiện | ✅ | ✅ | ✅ | ✅ |
| Tạo album / thêm ảnh | ✅ | ✅ | ✅ | ✅ |
| Sửa tên / mô tả album | ✅ | ❌ | ❌ | ✅ |
| Xoá album | ✅ | ❌ | ❌ | ✅ |
| Ẩn ảnh trong album của người khác | ✅ | ❌ | ❌ | ✅ |
| Xem ảnh **đã ẩn** trong album của người khác | ❌ | ❌ | ❌ | ✅ |

⚠️ **Không có album "của nhà" không ai sở hữu.** Album luôn có 1 người tạo, kể cả album OWNER tạo. Câu hỏi *"xoá album này có xoá ảnh của mọi người không"* phải trả lời được — nên khi xoá album, **ảnh không còn nằm trong album nào thì mới xoá media**, còn lại thì chỉ gỡ khỏi album. Nói cách khác: xoá album ≠ xoá ảnh.

⚠️ **Trạng thái *"đã ẩn" phải hiện ra trong UI, không chỉ "mất".** Nếu ảnh biến mất không có dấu hiệu, người dùng sẽ tưởng app lỗi và báo. Hiện 1 nhãn *"Bạn đã ẩn ảnh này"* + nút *Mở ẩn*, cạnh nút *Xoá*.

⚠️ **`hiddenById` chỉ giữ 1 người** (người ẩn) — xem `02` §15 hệ quả #1. FE không được gửi danh sách.

---

## P2 — có thì tốt, không có cũng chạy

### §9 — Gắn sự kiện vào một người

`Event` **không có `familyMemberId`** (backend `03` §8 mới thêm) — nên không thể gắn "kỷ niệm cưới của ông nội" vào ông nội. Đây là thứ biến module Sự kiện từ "lịch dùng chung" thành "có ích với tôi".

| Mục | Nội dung |
|---|---|
| API | `Event.familyMemberId` — **đúng 1 cột** (backend `03` §8) |
| UI | Chọn thành viên trong `event-form.tsx`; trong `family-member-node.tsx` hiện biểu tượng sinh nhật / ngày mất |
| Dữ liệu cũ | Cho phép để trống — sự kiện chung vẫn hợp lệ |

⚠️ Đây cũng là nơi dùng thật `TARGET_TYPE` mới (`EVENT_FAMILY` cũ → `MEMBER` mới) ở `02` §13.

⚠️ **Không được dùng cột này để lưu danh sách khách mời.** Quan hệ "sự kiện thuộc về người này" là 1–1; "anh này có mặt ở sự kiện kia" là n–n. Dồn 2 thứ vào 1 cột thì về sau không phân biệt được nữa. Xem `§10`.

---

### §10 — Sự kiện có người tham gia — ⏸ **cắt khỏi phạm vi, để sau**

`member-select.tsx` đã tồn tại nhưng **không module nào dùng**. Ý tưởng: bổ sung danh sách khách mời cho sự kiện — sự kiện gia đình thì có người tham dự là bình thường, hiện tại mô hình không chỗ để lưu.

✅ **Đã chốt 2026-09-27** (backend `06` R2.3): **`Event.familyMemberId` KHÔNG đủ cho mục này**, và backend **cố ý không** thêm bảng `EventParticipant` trong đợt này.

| | |
|---|---|
| `Event.familyMemberId` (1 cột, P1) | **Giữ** — phục vụ `§9` |
| Mục này (khách mời) | **Không làm lúc này.** Khách mời là use case sự kiện lớn (cưỡi, tang), không phải lõi "quản lý gia đình cá nhân" — thêm bảng = +1 schema, +2 endpoint, +UI, tốn hơn giá trị lúc này |
| Khi làm lại | Backend phải thêm bảng `EventParticipant` (`eventId` + `familyMemberId`, unique index) **và giữ nguyên** `Event.familyMemberId` |

⚠️ **Đây là bằng chứng cho bất biến `F1`.** Khi mục này quay lại, tuyệt đối **không** để FE tự lưu danh sách khách vào `biography` hay ghi chú — dữ liệu phái sinh phải do server đặt tên và đặt schema.

---

### §11 — Băng chuyền bố cục cá nhân — ⏸ **xoá khỏi phạm vi**

Bản nháp trước dựng băng chuyền này để cảnh báo *"bạn đang xem bố cục riêng"*. Sau khi chốt **Q8** (bố cục 1 tầng, chỉ trên server) thì **không còn tầng cá nhân** → không còn gì để cảnh báo.

| | |
|---|---|
| Mục này | **Không dựng.** Xoá khỏi phạm vi |
| Ký hiệu § | Giữ nguyên chỗ để không phải đánh lại số thứ tự — `§12`/`§13` phía dưới giữ nguyên tên |
| Khi nào quay lại | Chỉ khi nào lại có khái niệm "nhiều cây" hoặc "bố cục riêng" — tức là khi **Q16** bị đảo |

⚠️ **Cùng lý do này bỏ 2 nút *Chỉnh sửa lại* và *Lưu bố cục*** (đã nêu ở bản nháp trước, giữ nguyên kết luận):

- *Chỉnh sửa lại* — không chỗ nào định nghĩa nó làm gì, cả 3 cách hiểu đều dẫn về 1 nút đã có sẵn.
- *Lưu bố cục* — là **tập con** của *Lưu*, không có năng lực nào mà *Lưu* không làm được. Tách riêng chỉ tạo ra 2 lần lưu = 2 lần bump `version` vô nghĩa.

Phần **còn giữ** từ mục này — chuyển hết vào `02` §7, không mất:

| Nội dung | Nay nằm ở |
|---|---|
| Bảng *Lưu* / *Sắp xếp* gửi gì, bump `version` bao nhiêu | `02` §7 "Còn lại từ R1.4" |
| `LAYOUT_SAVE` phải vẽ lại từ `tree` trả về, không dùng lại `positions` gửi lên | `02` §7 |
| Kéo tay rồi không bấm *Lưu* → mất, không cứu, không hỏi | `02` §7 "Quyết định" |

---

### §12 — Hộp thoại xung đột 409

UI cho `02` §3. Đây là thứ quyết định việc `If-Match` có giá trị hay không.

| Mục | Nội dung |
|---|---|
| Nội dung | Ai đã sửa, sửa gì, lúc nào (đọc từ `ActivityLog` — `§1`) + số thay đổi của bạn chưa lưu |
| Hành động | *Xem khác biệt* → *Ghi đè* → *Giữ của mình* → *Huỷ* |
| Bắt buộc | *Ghi đè* phải là hộp thoại có nội dung cảnh báo, **không** phải dialog OK/Đóng mặc định |
| Cấm | **Không retry tự động** — retry âm thầm chính là bug mà `version` sinh ra để chặn |
| Bền vững | Trạng thái `conflict` phải sống sót qua `revalidatePath`; chặn đóng dialog không hủy |

⚠️ Nếu không làm mục này thì **đừng bật `If-Match`** ở giai đoạn đầu. Bật rồi không có UI xử lý thì người dùng gặp 409 và không hiểu gì đang xảy ra — tệ hơn hiện trạng. Xếp nó cùng `§3` trong `04`.

---

### §13 — Export ảnh cây PDF / PNG

**Tách ra khỏi `§5` có chủ đích.** Đây là thứ người dùng thực sự muốn (in cây treo tường), nhưng nó **chỉ đọc** — không bump `version`, không ghi `ActivityLog`, không `dryRun`, không `If-Match`. Nhối nó vào luồng ghi của `§5` là đẩy 1 thứ không có bản chất ghi vào giữa 1 luồng toàn bộ là ghi. Backend `03` §13.

| Mục | Nội dung |
|---|---|
| API | `GET /family/:groupId/export?format=pdf\|png` — quyền `edit` (xem trước thì chỉ cần `read`) |
| Nguồn dữ liệu | Bản đã sắp từ `tree` trả về của `/changes` hoặc `GET /family/:groupId` |
| Tham số | `generationRange`, `pageSize` cho cây lớn; người dùng chọn *"3 đời gần nhất"* là mặc định |

⚠️ **Font tiếng Việt là bẫy thật.** PDF render server-side mà không nhúng font tiếng Việt sẽ ra ô vuông — mất toàn bộ giá trị tính năng mà nhìn vẫn "thành công". Phải có bằng chứng bằng ảnh chụp cây có dấu tiếng Việt trước khi coi là xong.

⚠️ **Cân nhắc render SVG ở frontend thay vì server-side.** Cùng một SVG đã vẽ trên React Flow thì in được từ trình duyệt, không cần thêm thư viện PDF server, không gặp bẫy font. Chỉ chọn render server khi thật sự cần xuất hàng loạt. Chốt khi làm, không phải lúc viết API.

---

## Bảng kiểm tra

| Hạng mục | Tiêu chí |
|---|---|
| §1 lịch sử | VIEWER thấy dòng `ALBUM`/`PHOTO`/`EVENT` nhưng **không** thấy `MEMBER`/`RELATIONSHIP`/`FAMILY`/`GROUP` — không phải trang trắng, cũng không phải xem hết |
| §2 thùng rác | Xoá → vào thùng rác (không mất) → khôi phục → quan hệ về đúng như cũ. **Mỗi người chỉ thấy thùng rác của mình** |
| §3 tìm kiếm | Thành viên đã soft-delete **không** xuất hiện trong kết quả |
| §4 ảnh node | Upload 100 lần không rò media cũ trên Cloudinary; đổi ảnh không nhảy layout. **Pin lúc A đổi ảnh hồ sơ ⇒ node trong cây của B không đổi.** A gửi payload pin tới tài khoản B → bị từ chối |
| §4 quyền | EDITOR gán tay được ảnh người khác lên node; VIEWER không gán được ảnh nào, kể cả của chính mình qua đường tay |
| §5 import | Export → xoá group → **import `restore`** → cây giống hệt **kể cả id**. Lỗi GEDCOM báo **theo dòng**. Trùng id → 409, **không** ghi đè |
| §5 restore | Export → xoá group → import bằng `create` → cây đúng nhưng **id đổi hết** → UI phải cảnh báo khác chế độ `restore` |
| §6 chia sẻ | Link bị thu hồi → mất truy cập ngay. VIEWER-only mọi nút ghi đều vắng mặt |
| §7 mật khẩu | Email không tồn tại vẫn trả thông báo giống hệt. Đổi mật khẩu → mọi thiết bị bị logout |
| §8 album | EDITOR **không** xoá được album của người khác nhưng **có** sửa được cây. Ẩn 1 ảnh → hiện nhãn *"Bạn đã ẩn ảnh này"* + nút *Mở ẩn*; **không** biến mất im lặng |
| §9 sự kiện | Chọn được 1 thành viên; để trống vẫn tạo được sự kiện chung |
| §12 xung đột | 409 **không** retry tự động; *Ghi đè* có cảnh báo rõ; đóng dialog không mất thay đổi |
| §13 ảnh cây | PDF có dấu tiếng Việt đúng; xuất 5 thế hệ không tràn trang. **Không có tên chủ ảnh trên giấy** |

> Vòng bảo đảm dữ liệu thật là dòng `restore` của `§5` (backend `04` bước 3.3/3.4). Mọi thứ khác trong `§5` là tiện nghiệp; dòng đó mới là bảo đảm. Phải có e2e test cho nó.
