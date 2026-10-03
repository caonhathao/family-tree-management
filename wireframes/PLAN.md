# Kế hoạch sản phẩm theo flow

> Wireframe chỉ minh hoạ **layout**. Mọi quyết định sản phẩm từng nằm trong
> `<details class="note">` trên từng màn hình giờ tập trung tại đây.
> Mỗi dòng ghi nguồn tài liệu trong `docs/planing-refactor-fe/` khi có căn cứ.

---

## 1. Bảng chặng theo 4 luồng vai trò

Mở `index.html`, mỗi link mang `?role=` để tự đặt vai trò (pill vẫn đổi tay được).
Mỗi chặng là một màn hình riêng — **không gộp** hai chặng vào một file.

| Flow | Chặng | File |
|---|---|---|
| **Khách** (chưa đăng nhập) | Trang chủ | `s01-landing.html` |
| | Đăng nhập | `s03-login.html` |
| | Đăng ký tài khoản | `s02-register.html` |
| | Hướng dẫn tạo cây (từ trang chủ) | `s02-guide.html` |
| | Quên mật khẩu → Đã gửi link → Đặt mật khẩu mới | `s04-forgot.html` → `s04-forgot-sent.html` → `s04-forgot-reset.html` |
| | Vào nhóm bằng link mời (còn hạn) | `s05-join.html` |
| | Link mời hết hạn / không tồn tại | `s05-join-expired.html` |
| **Chủ nhóm** (owner) | Tạo cây gia phả | `s06-create.html` |
| | 409 — tài khoản đã có cây | `s06-create-conflict.html` |
| | Cây gia phả (màn chính) | `s07-tree.html` |
| | Thêm / sửa thành viên | `s08-member-form.html` |
| | Mâu thuẫn 409 khi lưu | `s09-save-conflict.html` |
| | Lịch sử thay đổi | `s10-activity.html` |
| | Thùng rác (cây + ảnh) | `s11-trash.html` |
| | Album ảnh | `s12-albums.html` |
| | Sự kiện | `s13-events.html` |
| | Quản lý link chia sẻ | `s14-share-manage.html` |
| | Nhập / Xuất | `s16-import-export.html` |
| | Hồ sơ, xoá tài khoản | `s17-profile.html` |
| **Biên tập** (editor) | Đăng nhập | `s03-login.html` |
| | Cây gia phả | `s07-tree.html` |
| | Thêm / sửa thành viên | `s08-member-form.html` |
| | Mâu thuẫn 409 khi lưu | `s09-save-conflict.html` |
| | Album + Sự kiện | `s12-albums.html` · `s13-events.html` |
| | Lịch sử thay đổi | `s10-activity.html` |
| | Nhập / Xuất | `s16-import-export.html` |
| **Người xem** (viewer) | Vào nhóm bằng link mời | `s05-join.html` |
| | Cây gia phả (chỉ đọc) | `s07-tree.html` |
| | Xem bằng link chia sẻ | `s15-share-readonly.html` |
| | Album ảnh (của mình) | `s12-albums.html` |

---

## 2. Quyết định sản phẩm theo màn

Mỗi mục = mọi dòng từng nằm trong ghi chú của màn đó. Giữ đúng khi sửa wireframe.

### `s01-landing.html` — Trang chủ

- Landing dành cho **mọi người**, bất kể đã đăng nhập hay chưa — không tự chuyển
  hướng, không bao giờ hiện lỗi inline. *(Căn cứ: `02-pham-vi-sua.md` §10 ·
  `01-pham-vi-bo.md` FE-B8)*
- Header và nút CTA chỉ đưa về màn xác thực (`s03-login.html` mô phỏng `/auth`);
  câu hỏi "có link mời hay tạo cây riêng" nằm trong luồng đăng ký
  (`s02-register.html` / `s03-login.html` / `s05-join.html`), không nằm ở trang chủ.
- Hero vẽ cây bằng `WF.renderTree` với 7 thành viên giả (`m1`–`m9`) để demo layout,
  không phải dữ liệu thật.
- Chỉ dùng token có sẵn trong `assets/ui.css` — không thêm màu mới.
- Không có `.bottom-nav` trên màn này.

### `s02-register.html` — Đăng ký tài khoản (không token)

- Đăng ký thuần, tách khỏi luồng mời. Không nhắc tới "mời", "token", invite.
- **Không đặt hướng dẫn / lối tắt tạo cây trên màn đăng ký.** Sau khi đăng ký, người
  dùng tự vào hướng dẫn từ trang chủ (`s01-landing.html` → `s02-guide.html`), và từ đó
  qua `s06-create.html`. *(Căn cứ: `06-workflow-user.md` §2.1 · `01-pham-vi-bo.md` FE-B11)*
- Câu "có link mời?" không xuất hiện ở đây; đã đăng nhập thì "Đăng nhập" →
  `s03-login.html`.

### `s02-guide.html` — Hướng dẫn tạo cây

- Guide là **màn riêng**, vào từ trang chủ (`s01-landing.html`), không nằm trên màn
  đăng nhập / đăng ký. *(Căn cứ: `02-pham-vi-sua.md` §10)*
- Bốn bước gắn link màn thật: Đăng ký (`s02-register.html`) → Tạo cây
  (`s06-create.html`) → Thêm thành viên & quan hệ (`s08-member-form.html`) → Mời &
  chia sẻ (`s14-share-manage.html`).
- CTA chính "Bắt đầu tạo cây" → `s06-create.html` (tài khoản mới chưa có cây).

### `s03-login.html` — Đăng nhập

- Giữ khung auth 2 cánh của `auth-content.tsx`, đảo chiều `lg:flex-row-reverse`
  khi ở chế độ login. *(Căn cứ: `06-workflow-user.md` §2.2)*
- `login` và `register` phải nằm trong `publicRoutes` (middleware `proxy.ts`).
- Khi vào từ link mời, giữ nguyên `?token=` xuyên suốt bước đăng nhập; link
  "Đăng kí ngay" lúc này trỏ `s02-register.html?token=…` (màn đăng ký sẽ hiểu
  token và cho "Tạo tài khoản và tham gia"), không trỏ `s05-join.html` để tránh
  vòng lặp xác nhận.
- Không hiện thông báo "tài khoản không tồn tại" — trả lời giống nhau cho mọi email.

### `s04-forgot.html` · `s04-forgot-sent.html` · `s04-forgot-reset.html` — Quên mật khẩu

- Ba chặng tách rời, mỗi file một chặng (trước đây gộp bằng tab). *(Căn cứ:
  `03-pham-vi-them.md` §7 · `01-pham-vi-bo.md` FE-B5)*
- Hai đường dẫn phải nằm trong `publicRoutes`; nếu quên, người dùng bị vòng lặp
  chuyển hướng về `/auth` vô hạn.
- Thông báo **giống hệt nhau** khi email có tồn tại và khi không — không nói
  "không tìm thấy email".
- Link đặt lại dùng một lần, tự huỷ sau vài phút.
- Đổi mật khẩu đăng xuất **mọi thiết bị** — phải nói rõ trước khi bấm.
- Đổi mật khẩu không đụng tới cây gia phả, không tạo dòng lịch sử nào.

### `s05-join.html` · `s05-join-expired.html` — Vào nhóm qua link mời

- Cùng đường dẫn `/invite` với `?token=`, một nhánh vào nhóm người mời. Nhánh
  không-token (tạo cây riêng) hiện là màn riêng `s06-create.html`. *(Căn cứ:
  `06-workflow-user.md` §2.1 · `04-thu-tu-thuc-hien.md` Stage 2)*
- Một link mời dùng chung cho **nhiều người** — không có trạng thái "đã dùng".
  Chỉ có hai trạng thái dừng: **hết hạn** (quá hạn) và **không tồn tại** (bị thu hồi).
  Cả hai gộp một màn dừng `s05-join-expired.html` — tuyệt đối không lặng lẽ tạo
  cây riêng cho người bấm nhầm, đó là mất tiền thật và mất luôn ý muốn.
- Vai trò khi vào là cố định: **Người xem**. Muốn sửa thì chủ nhóm đổi vai trò sau.
- Không có màn "quản lý lời mời" và không có API xem danh sách lời mời đã gửi.
- Đăng nhập từ link mời phải giữ nguyên token → `s03-login.html?token=inv_9c41f2`.
- `s05-join.html` là **màn xác nhận**, không phải form đăng ký: hiện thông tin
  người mời + nhóm + vai trò (Người xem) + hạn link, hỏi "Bạn có muốn tham gia
  nhóm này không?", rồi **đúng một nút** "Đăng nhập và tham gia" → sign in mang
  token, kèm **một dòng notice** "Chưa có tài khoản? Đăng kí và tham gia" →
  `s02-register.html?token=…`. Trình bày giống màn đăng nhập: một nút chính +
  một lối tắt đăng ký.
- `s02-register.html` khi nhận `?token=`: hiện banner "Sau khi tạo tài khoản, bạn
  sẽ vào thẳng nhóm … với quyền Người xem", nút đổi thành "Tạo tài khoản và tham
  gia", sau khi tạo hiện link "Vào cây gia phả của nhóm" → `s07-tree.html`.

### `s06-create.html` · `s06-create-conflict.html` — Tạo cây & 409

- Cùng đường dẫn `/invite`, nhánh không token → tạo cây riêng. *(Căn cứ:
  `06-workflow-user.md` §2.2 · `01-pham-vi-bo.md` FE-B11)*
- Một tài khoản chỉ có **một cây vĩnh viễn** — khi đã có cây mà vẫn bấm tạo, chặn
  bằng màn 409 `s06-create-conflict.html`, không cho tạo cây thứ hai. Màn conflict
  chỉ còn **một đường**: "Vào cây hiện có của tôi" → `s07-tree.html`.
- **Bắt buộc có nhóm trước** — không có đường "bỏ qua, vào cây trống". Muốn vào cây
  (`s07-tree`) thì phải tạo nhóm xong ở màn này.
- **Tên nhóm = tên cây (chung một gốc)** — form tạo chỉ có một ô tên (Tên nhóm);
  cây tự lấy tên nhóm. Không có bước đặt tên cây riêng.
- **Không có "xoá cây rồi tạo lại"** — cây vĩnh viễn theo tài khoản. Cây chỉ mất
  đi khi tài khoản bị xoá (`s17-profile`), và toàn bộ ảnh chuyển sang Chủ nhóm.
- Form tạo cây **không hiện khối "Link mời sẽ trỏ tới"** (preview/toggle hạn). Quản lý link mời
  (kèm "Cho hạn 7 ngày") nằm ở Tuỳ chọn gia đình `s17-profile.html` - card "Mời người mới".
- Link mời dùng chung cho nhiều người, hạn 7 ngày. Gửi link ở đâu cũng được — copy dán Zalo,
  Messenger; không cần gửi qua hệ thống.

### `s07-tree.html` — Cây gia phả (màn chính)

- Màn chính của nhóm; nút điều khiển theo `data-needs-perm` + `WF.can`.
  *(Căn cứ: `02-pham-vi-sua.md` §1–§5, §9, §12 · `04-thu-tu-thuc-hien.md` Stage 3)*
- **Tìm người là popup** — nút kính lúp ⌕ cạnh nút menu soạn thảo trong panel;
  mở hộp thoại tìm (gõ tên/năm sinh, bấm kết quả → nhảy tới node và đóng).
  Không còn ô tìm inline trong menu panel. Mọi vai trò đều tìm được.

### `s08-member-form.html` — Thêm / sửa thành viên

- Thực tế là **hộp thoại** bật từ `PanelEditor`, không phải trang riêng.
  *(Căn cứ: `06-workflow-user.md` §3.1–3.2)*
- Quan hệ gửi một chiều: chọn **cha/mẹ** (đọc hai chiều khi xem).
- Nút ghim ảnh ghi rõ **"Gắn ảnh của tôi vào node này"**, không phải "đổi ảnh".
- Gắn ảnh người khác cần quyền sửa cây; ảnh của tôi thì ai trong nhóm cũng không
  chặn được việc mình ghim.
- Ảnh ghim là **bản chụp tại thời điểm**, không theo bản gốc khi người kia sửa.
- Trùng tên là bình thường, không tự gộp.

### `s09-save-conflict.html` — Mâu thuẫn 409 khi lưu

- Máy chủ trả 409 khi bản ghi đã bị người khác ghi đè (so sánh bằng If-Match).
  *(Căn cứ: `02-pham-vi-sua.md` §3 · `03-pham-vi-them.md` §12 · `06-workflow-user.md` §6)*
- **Không tự thử lại, không tự gộp.**
- Hộp thoại **không chọn sẵn** lựa chọn nào — 3 bước; đóng dialog không mất trạng
  thái conflict; bảng so khác 5 cột + hộp thoại cảnh báo thứ hai cho thao tác Ghi đè.
- Chưa làm xong dialog thì chưa bật If-Match ở phía máy chủ.

### `s10-activity.html` — Lịch sử thay đổi

- Màn thật nằm trong menu **Hành động** của `PanelEditor`, không phải mục sidebar.
  *(Căn cứ: `03-pham-vi-them.md` §1 · `06-workflow-user.md` §7)*
- Phân trang theo **cursor**, không offset.
- Bộ lọc lấy từ `ACTIONS` / `TARGET_TYPES` trong `src/lib/family/labels.ts`.
- Đổi tên dạng `Tên: "A" → "B"`; xoá sinh 2 dòng và quan hệ kéo theo mũi tên ↳.
- Người xem (viewer) lọc album/ảnh/sự kiện: thấy mục nhưng bấm vào trả 403.
- Danh sách này là nguồn dựng hộp thoại 409 (`s09`).

### `s11-trash.html` — Thùng rác

- Thùng rác tách 2 theo luật: **cây–vai trò** và **ảnh–người xoá**. *(Căn cứ:
  `03-pham-vi-them.md` §2 · `06-workflow-user.md` Trục 2)*
- Khôi phục thành viên kéo theo quan hệ — làm ở máy chủ.
- Người xem mất mọi nút khôi phục (chỉ còn mục ảnh của mình).
- Xoá vĩnh viễn **không hoàn tác**, kể cả với Chủ nhóm.
- Đã bỏ 4 mục chết khỏi sidebar: Danh sách nhóm / Lời mời / Kho lưu trữ / Hỗ trợ–Phản hồi.

### `s12-albums.html` — Album ảnh

- Ảnh tính theo người tải lên: chủ nhóm sửa được mọi album; biên tập **không** sửa
  album của người khác. *(Căn cứ: `03-pham-vi-them.md` §8 · `06-workflow-user.md` §8.2)*
- Ẩn ảnh → người khác không thấy; người ẩn + chủ nhóm **vẫn thấy** kèm nút
  "Hiện lại".
- Xoá album không xoá ảnh, trừ khi ảnh không nằm album nào khác.
- Album không phải chỗ lưu ảnh thẻ (ảnh thẻ ở `s08-member-form`).
- Ai cũng xem được album (không 403); chỉ chặn quyền **sửa**.

### `s13-events.html` — Sự kiện

- Sự kiện gắn tối đa **1 thành viên** qua `familyMemberId`; để trống = sự kiện chung.
  *(Căn cứ: `03-pham-vi-them.md` §9)*
- Quyền sửa theo người tạo + chủ nhóm — cùng luật với ảnh.
- Danh sách khách mời cần bảng riêng, không nhét vào ghi chú.
- Ngày sinh/mất hiện icon nhỏ trên node (`s07-tree`).

### `s14-share-manage.html` — Quản lý link chia sẻ

- Link chia sẻ **≠ link mời**: mời để vào nhóm (dùng chung nhiều người); chia sẻ ai có link
  đều xem được
  không vào nhóm. *(Căn cứ: `03-pham-vi-them.md` §6)*
- Link chia sẻ xác thực bằng **token URL**, không cookie — cần lớp bảo vệ riêng.
- Chỉ chủ nhóm tạo/thu hồi; không có nút bật/tắt — muốn chặn thì thu hồi.
- Hạn 7/30/90 ngày; có ô sao chép; đếm số lần mở.
- **Đơn giản hóa luồng tạo**: xóa bảng mẫu cũ; sau khi bấm "Tạo link" thay vì chỉ
  hiện card "Link vừa tạo", sẽ có trạng thái ngay bên dưới ô chọn hạn: "Link còn
  hiệu lực" + nút "Sao chép" + "Mở thử". Nút Tạo link ẩn đi.
- Nút "Mở thử" → `s15-share-readonly.html` là điều hướng thật, giữ lại.

### `s15-share-readonly.html` — Xem cây bằng link chia sẻ

- Khách chỉ đọc: node không kéo được. *(Căn cứ: `03-pham-vi-them.md` §6)*
- Có băng cảnh báo rằng **ẩn nút không có nghĩa chặn được ghi** (chặn thật ở máy chủ).

### `s16-import-export.html` — Nhập / Xuất

- Khôi phục và nhập đều **chạy thử trước khi ghi** trong một lần; phải có bước xem
  trước khác biệt. *(Căn cứ: `03-pham-vi-them.md` §5, §13)*
- Khôi phục giữ mã cũ; nhập tạo mã mới → đứt tham chiếu nếu chưa đối chiếu.
- Mã trùng thì **dừng lại**, không tự ghi đè; khi 409 lựa chọn mặc định là "Dừng lại".
- Thanh tiến trình phải thật (không giả lập).
- Xuất ảnh chỉ đọc — không tăng bản, không dùng If-Match.
- Nút `demo-file`/`demo-gfile` đã bỏ: preview kích hoạt qua input file / đổi chế độ.

### `s17-profile.html` — Hồ sơ, xoá tài khoản

- Sidebar chỉ còn 5 mục thật — xoá khỏi dữ liệu điều hướng. *(Căn cứ:
  `03-pham-vi-them.md` §11 · `01-pham-vi-bo.md` FE-B6, FE-B11 · `06-workflow-user.md` §5)*
- Nút "Đổi vai trò" (cũ) không gắn sự kiện; vai trò đổi qua pill wireframe.
- Đổi vai trò chỉ xoay giữa **Biên tập / Người xem** — không có đường lên Chủ nhóm.
- Chuyển quyền sở hữu: người nhận thành Chủ nhóm, bạn ở lại làm **Biên tập viên**
  (nếu chưa có, người nhận bắt đầu ở Biên tập).
- Không có "rời nhóm" — chỉ có **xoá tài khoản**.

---

## 3. Phân quyền (tóm tắt)

Bảng phân quyền dùng chung giữ ở `README.md` §2 và `WF.PERM` trong
`assets/ui.js` (28 khoá máy đọc được). Ba điểm cốt lõi:

1. **Hai trục quyền, không phải một** (`02-pham-vi-sua.md` §15,
   `06-workflow-user.md` Trục 1–2):
   - **Dữ liệu cây** (thành viên, quan hệ, sơ đồ, lịch sử, nhập xuất) — theo **vai trò**.
   - **Media** (ảnh, album, sự kiện) — theo **chủ sở hữu**, không theo vai trò.
2. Người xem có ✓ ở phần media nhưng — ở phần cây; `media.editOwn` không dính gì
   tới việc nâng vai trò lên Biên tập viên.
3. Màn hình giữ đúng bản chất quyền mà tài liệu đang chốt, kể cả khi giao diện hiện
   tại của app chưa làm tới.