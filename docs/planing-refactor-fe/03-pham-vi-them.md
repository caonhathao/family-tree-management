# 03 — Phạm vi THÊM

> Thứ tự theo mức độ quan trọng với **người dùng thật**, không theo mức độ dễ.
> §1–§4 là P0: thiếu chúng thì app dùng được nhưng không an toàn và không bền vững.

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
| Hiển thị | Icon + nhãn tiếng Việt cho **11 action type** × **7 target type** — dùng bảng ánh xạ tập trung (`02` §13), không rải `switch` |
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
| Nhóm thùng rác | Theo **group**, không theo user. Một người EDITOR xoá nhầm thì mọi thành viên đều thấy trong thùng rác → có thể khôi phục |
| Hiển thị | Tên, ngày sinh, **ai xoá** và **lúc nào** (từ `ActivityLog`), nút *Khôi phục*, nút *Xoá vĩnh viễn* |
| Tự động | 30 ngày → purge job phía backend. FE hiện *"Sẽ bị xoá vĩnh viễn sau 30 ngày"* |

⚠️ **Khôi phục phải khôi phục cả quan hệ đã bị xoá theo.** Backend xử lý phần này (snapshot trong `ActivityLog` là để dựng lại được). FE chỉ gọi 1 endpoint, **không** tự dựng quan hệ — tự dựng là chỗ dễ sinh dữ liệu sai nhất.

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

### §4 — Ảnh thành viên

`FamilyMember.avatarUrl` **có cột** nhưng **không endpoint nào ghi vào**. Đây là thứ người dùng chạm vào đầu tiên — một cây toàn ảnh trắng thì không có giá trị gì.

| Mục | Nội dung |
|---|---|
| API | `POST /family/:groupId/members/:memberId/photo` (backend `03` §3) |
| Thư viện | Thêm lại `next-cloudinary` đã xoá ở `B7`, dùng `CldUploadWidget` cho chọn ảnh |
| Xử lý | Upload lên Cloudinary `FOLDER_FAMILY`; **xoá media cũ** khi thay; nhấn xoá → xoá cả trên Cloudinary |
| UI | Trong `family-member-form.tsx`; hiển thị ở `family-member-node.tsx` (React Flow) |
| Tương tác với `§3` | `getLayoutedElements` cần biết ảnh có tồn tại không để chừa chỗ — ảnh tải về **sau** khi cây đã layout sẽ nhảy layout |

⚠️ **`next-cloudinary` phải thêm lại ở stage này**, không giữ từ `B7`. Giữ một dependency không ai import chỉ để "sẵn sàng" là giữ code chết có chủ đích.

⚠️ Upload phải **debounce + huỷ request cũ** — người dùng đổi ảnh nhanh sẽ tạo nhiều media cũ trên Cloudinary nếu không huỷ.

⚠️ Backend cần chốt có xoá media cũ ngay trong request hay để job dọn dẹp. FE không được giả định media cũ đã bị xoá cho tới khi API trả xác nhận.

---

## P1 — dùng được nhưng khó chịu

### §5 — Import / Export

Grep `gedcom|pdf|export` trong `src/` → **0 kết quả**. Đây là thứ biến app từ "demo" thành "công cụ thật": cây gia đình là dữ liệu **không thể tạo lại**.

**Thứ tự là bắt buộc, không phải tuỳ chọn:**

| # | Hướng | Vì sao thứ tự này |
|---|---|---|
| **5.1** | **Export JSON** | Rẻ nhất, làm trước, và **đúng bằng** format của `POST /import` → tạo thành vòng bảo đảm dữ liệu thật |
| **5.2** | **Import GEDCOM** (`*.ged`) | Nguồn dữ liệu cây gia đình lớn nhất đang tồn tại. Thư viện `gedcom` (Node). Dữ liệu GEDCOM thật **rất bẩn** → báo lỗi **dòng bằng dòng**, không phải "import thất bại" |
| **5.3** | **Export ảnh cây** (PDF/PNG) | Nặng nhất, để cuối. Nhưng là thứ người dùng thực sự muốn: in cây treo tường |

⚠️ **Import là đường ghi hàng loạt DUY NHẤT** → phải đi qua endpoint batch của `02` §0 (R1), với `dryRun` → xem diff → xác nhận mới ghi. **Không được** đi qua logic sync cũ (đã xoá ở `02` §2) — đường đó không scope `groupFamilyId`, tức là chính là IDOR.

⚠️ `idMap` từ R1.5 là thứ cho phép re-key sau import. Nếu backend chỉ trả `version` mà không trả map thì cây sau import sẽ lệch id.

⚠️ Upload file GEDCOM lớn: cần progress thật, không phải spinner. File thật có thể vài MB và parse mất vài giây.

---

### §6 — Chia sẻ chỉ đọc

Không tồn tại (`grep shareLink|visibility|@Public` → 0). Cho phép gửi cây cho người thân **không có tài khoản** — với app gia đình đây là điều kiện để nó lan truyền được.

| Mục | Nội dung |
|---|---|
| API | Backend `03` §6 — token chỉ đọc, có hạn, thu hồi được |
| Route | `/share/[token]` — **nằm ngoài** `publicRoutes` hiện tại vì nó xác thực bằng token chứ không phải cookie. Xem `B10` |
| UI tạo | `/group/share`: tạo link, đặt hạn (7/30/90 ngày), thu hồi, xem số lần mở |
| UI đọc | Chỉ render cây. **Mọi nút ghi phải vắng mặt**: không *Lưu*, không *Sắp xếp*, không *Xoá*, không *Thêm thành viên* |

⚠️ **Đây là bề mặt tấn công mới** — phải scope `groupFamilyId` y hệt mọi route khác (bất biến I1 phía backend), có rate limit riêng, và dùng guard riêng chứ **không** dùng `AtGuard`.

⚠️ **Ẩn nút ≠ chặn ghi.** Nếu route chia sẻ lọc qua cùng component với `/group` mà chỉ giấu UI thì vẫn gọi được API. Phải tách component hoặc chặn ở tầng data.

---

### §7 — Quên / đặt lại mật khẩu

`POST /auth/reset` phía backend là **endpoint giả** — tìm user theo email, không tạo token, không gửi gì, vẫn trả success (`01` backend B7). Ở FE chưa từng có UI nào gọi nó (`B5`).

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
| Dùng lại | Bộ table kit từ `admin/_components` (`B10`) + `FOLDER_ALBUM` |
| Dọn dẹp | Logic `cleanupOrphanedMediaAction` chuyển từ blog-media sang đây (backend `01` B1) |

⚠️ Album **không** phải nơi lưu ảnh thành viên. Ảnh thành viên là `avatarUrl` 1 ảnh (`§4`); album là bộ sưu tập. Trộn 2 khái niệm sẽ làm tìm kiếm và xoá trở nên mơ hồ.

---

## P2 — có thì tốt, không có cũng chạy

### §9 — Gắn sự kiện vào một người

`Event` **không có `familyMemberId`** (backend `02` §6) — nên không thể gắn "kỷ niệm cưới của ông nội" vào ông nội. Đây là thứ biến module Sự kiện từ "lịch dùng chung" thành "có ích với tôi".

| Mục | Nội dung |
|---|---|
| API | `Event.familyMemberId` (backend `02` bước 2.11) |
| UI | Chọn thành viên trong `event-form.tsx`; trong `family-member-node.tsx` hiện biểu tượng sinh nhật / ngày mất |
| Dữ liệu cũ | Cho phép để trống — sự kiện chung vẫn hợp lệ |

⚠️ Đây cũng là nơi dùng thật `TARGET_TYPE` mới (`EVENT_FAMILY` cũ → `MEMBER` mới) ở `02` §13.

---

### §10 — Sự kiện có người tham gia

`member-select.tsx` đã tồn tại nhưng **không module nào dùng**. Bổ sung danh sách khách mời cho sự kiện — sự kiện gia đình thì có người tham dự là bình thường, hiện tại mô hình không chỗ để lưu.

⚠️ Chỉ làm nếu backend đã có cột tương ứng. **Không** để FE tự lưu vào `biography` hay ghi chú — đó là bằng chứng cho bất biến **F1**: dữ liệu phái sinh phải do server đặt tên và đặt schema.

---

### §11 — Băng chuyền bố cục cá nhân

UI cho `02` §7 (Q8/Q9). Không có nó thì tầng cá nhân là ẩn ý — người dùng sửa bố cục rồi tưởng đã lưu lên cây chung.

| Mục | Nội dung |
|---|---|
| Vị trí | Cố định, cạnh nút *Lưu* |
| Nội dung | *"Bạn đang xem bố cục riêng — chưa lưu lên cây chung"* + số thành viên đã kéo |
| Nút | *Xem bố cục chung* (xoá lớp phủ) · *Chỉnh sửa lại* · *Lưu bố cục* (EDITOR/OWNER) |
| Tự xoá | Khi `version` lệch → thông báo *"Cây gia đình vừa được cập nhật, bố cục riêng của bạn đã được đặt lại"* |

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

## Bảng kiểm tra

| Hạng mục | Tiêu chí |
|---|---|
| §1 lịch sử | VIEWER gọi API → 403, không phải trang trắng. Xoá 1 người → thấy **2** dòng |
| §2 thùng rác | Xoá → vào thùng rác (không mất) → khôi phục → quan hệ về đúng như cũ |
| §3 tìm kiếm | Thành viên đã soft-delete **không** xuất hiện trong kết quả |
| §4 ảnh | Upload 100 lần không rò media cũ trên Cloudinary; đổi ảnh không nhảy layout |
| §5 import | Export → xoá group → import lại → **cây giống hệt**. Lỗi GEDCOM báo **theo dòng** |
| §6 chia sẻ | Link bị thu hồi → mất truy cập ngay. VIEWER-only mọi nút ghi đều vắng mặt |
| §7 mật khẩu | Email không tồn tại vẫn trả thông báo giống hệt. Đổi mật khẩu → mọi thiết bị bị logout |
| §11 băng chuyền | Người khác bấm *Sắp xếp* → F5 → lớp phủ tự hết hạn, có thông báo |
| §12 xung đột | 409 **không** retry tự động; *Ghi đè* có cảnh báo rõ; đóng dialog không mất thay đổi |

> Vòng bảo đảm dữ liệu thật là dòng 3 của `§5` (`02` bước 3.3 backend). Mọi thứ khác trong §5 là tiện nghiệp; dòng đó mới là bảo đảm. Phải có e2e test cho nó.
