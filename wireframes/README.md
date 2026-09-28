# Wireframe — Nhà họ

16 màn hình HTML tĩnh cộng một trang danh mục, mô phỏng giao diện thật của sản phẩm và
được dựng lại trên nền tảng UI đang có: **shadcn/ui new-york + Tailwind v4, lấy token từ
`project/frontend/src/app/globals.css`**.

Mở `index.html` để xem danh mục. Không cần build, không cần mạng ngoài ngoài phông.

```
file://.../wireframes/index.html          # hoặc phục vụ qua http
npx serve wireframes
```

> Playwright chặn giao thức `file:`. Nếu bạn định chạy test tự động, hãy phục vụ
> `wireframes/` bằng một static server bất kỳ rồi trỏ vào `http://127.0.0.1:<port>/`.

---

## 1. Màn hình

| File | Màn hình | Route thật | Căn cứ |
|---|---|---|---|
| `index.html` | Danh mục + bảng phân quyền | — | — |
| `s01-landing.html` | Trang chủ — landing giới thiệu, không tự chuyển hướng | `/` | `02-pham-vi-sua.md` §10 · `01-pham-vi-bo.md` FE-B8 |
| `s02-register-invite-fork.html` | Tham gia nhóm qua link mời, 4 nhánh token | `/invite?token=` | `06-workflow-user.md` §2.1 · `04-thu-tu-thuc-hien.md` Stage 2 |
| `s03-login.html` | Đăng nhập (giữ `?token=`) | `/auth` | `06-workflow-user.md` §2.2 |
| `s04-forgot-reset.html` | Quên / đặt lại mật khẩu | `/auth`, `/user/secure` | `03-pham-vi-them.md` §7 · `01-pham-vi-bo.md` FE-B5 |
| `s05-create-family.html` | Tạo cây gia phả (không có token) | `/invite` | `06-workflow-user.md` §2.2 · `01-pham-vi-bo.md` FE-B11 |
| `s06-tree-canvas.html` | Cây gia phả — màn hình chính | `/group` | `02-pham-vi-sua.md` §1–§5, §9, §12 · `04-thu-tu-thuc-hien.md` Stage 3 |
| `s07-member-form.html` | Hộp thoại thêm / sửa thành viên | `/group` | `06-workflow-user.md` §3.1–3.2 |
| `s08-save-conflict.html` | Mâu thuẫn 409 khi lưu | `/group` | `02-pham-vi-sua.md` §3 · `03-pham-vi-them.md` §12 · `06-workflow-user.md` §6 |
| `s09-activity.html` | Lịch sử thay đổi | `/group` (tab) | `03-pham-vi-them.md` §1 · `06-workflow-user.md` §7 |
| `s10-trash.html` | Thùng rác — cây và ảnh | `/group` (tab) | `03-pham-vi-them.md` §2 · `06-workflow-user.md` Trục 2 |
| `s11-albums.html` | Album ảnh | `/group` (tab) | `03-pham-vi-them.md` §8 · `06-workflow-user.md` §8.2 |
| `s12-share-manage.html` | Quản lý link chia sẻ | `/group` (tab) | `03-pham-vi-them.md` §6 |
| `s13-share-readonly.html` | Xem cây bằng link chia sẻ (khách) | `/share/:token` | `03-pham-vi-them.md` §6 |
| `s14-import-export.html` | Nhập / Xuất | `/group` (tab) | `03-pham-vi-them.md` §5, §13 |
| `s15-events.html` | Sự kiện | `/group` (tab) | `03-pham-vi-them.md` §9 |
| `s16-profile-hub.html` | Hồ sơ, người cùng nhóm, mời, xoá tài khoản | `/user/profile`, `/user/groups` | `03-pham-vi-them.md` §11 · `01-pham-vi-bo.md` FE-B6, FE-B11 · `06-workflow-user.md` §5 |

Cột "Căn cứ" trỏ tới `docs/planing-refactor-fe/`. Màn hình nào làm đúng bản chất
quyền hạn mà tài liệu đang chốt thì wireframe giữ nguyên bản chất đó, kể cả khi
giao diện hiện tại chưa làm.

---

## 2. Bảng phân quyền (dùng chung)

Bảng này xuất hiện đúng một lần ở `index.html` và đúng một lần ở đây. Không màn hình
nào lặp lại nó.

| Việc | Chủ nhóm | Biên tập viên | Người xem | Khách |
|---|:--:|:--:|:--:|:--:|
| Xem cây | ✓ | ✓ | ✓ | ✓ |
| Sửa cây, thành viên, quan hệ | ✓ | ✓ | — | — |
| Đổi tên nhóm | ✓ | ✓ | — | — |
| Xoá toàn bộ cây | ✓ | — | — | — |
| Kéo thả node trên màn hình | ✓ | ✓ | — | — |
| Sắp xếp sơ đồ | ✓ | ✓ | — | — |
| Lưu cho cả nhóm | ✓ | ✓ | — | — |
| Ghim ảnh hồ sơ của chính mình | ✓ | ✓ | ✓ | — |
| Gắn ảnh bất kỳ cho người khác | ✓ | ✓ | — | — |
| Xem toàn bộ lịch sử thay đổi | ✓ | ✓ | — | — |
| Xem lịch sử album, ảnh, sự kiện | ✓ | ✓ | ✓ | — |
| Tải ảnh lên | ✓ | ✓ | ✓ | — |
| Sửa / xoá ảnh của mình | ✓ | ✓ | ✓ | — |
| Khôi phục thành viên, quan hệ | ✓ | ✓ | — | — |
| Khôi phục ảnh của mình | ✓ | ✓ | ✓ | — |
| Sửa album của mình | ✓ | ✓ | ✓ | — |
| Đổi vai trò người khác | ✓ | — | — | — |
| Chuyển quyền sở hữu | ✓ | — | — | — |
| Tạo link mời | ✓ | ✓ | — | — |
| Tạo / thu hồi link chia sẻ | ✓ | — | — | — |
| Nhập và xuất cây | ✓ | ✓ | — | — |

Hai trục quyền, không phải một (`02-pham-vi-sua.md` §15, `06-workflow-user.md` Trục 1–2):

1. **Dữ liệu cây** (thành viên, quan hệ, sơ đồ, lịch sử, nhập xuất) — theo **vai trò**.
2. **Media** (ảnh, album, sự kiện) — theo **chủ sở hữu**, không theo vai trò. Ai cũng
   sửa được phần của mình; người khác thì không, kể cả chủ nhóm, trừ khi chủ nhóm
   *tạo ra* album đó.

Đây là lý do cột "Người xem" vẫn có ✓ ở phần media nhưng "—" ở phần cây, và vì sao
`media.editOwn` không dính gì tới việc nâng vai trò lên Biên tập viên.

Danh sách máy đọc được đầy đủ 28 khoá nằm ở `assets/ui.js` → `WF.PERM`. Bảng trên bỏ
`member.add`, `member.delete`, `member.deleteOther`, `relation.add`, `media.hide`,
`event.edit` vì chúng gộp trong các dòng đã có.

---

## 3. Đổi vai trò để xem

Góc dưới bên phải có một pill đổi vai trò (công cụ phát triển, không thuộc sản phẩm).
Vai trò lưu ở `localStorage` với khoá `wf:role`, nên đổi một lần rồi mở màn hình nào
cũng giữ nguyên.

`owner` · `editor` · `viewer` · `guest` · `anon`

Nút trên màn hình được ẩn/hiện theo `WF.can("khoá-quyền")`, nên đổi vai trò sẽ thấy
ngay phần nào biến mất. Với `anon`, phần cần đăng nhập hiện thẻ nhắc đăng nhập thay vì
nội dung.

---

## 4. Những ràng buộc đã cài trong wireframe

Các điểm dưới đây là quyết định sản phẩm, không phải chi tiết trang trí. Đừng làm mất
chúng khi sửa:

- **s01** là landing cho **mọi người**, bất kể đã đăng nhập hay chưa — không tự chuyển hướng, không bao giờ hiện lỗi inline. Header và nút CTA chỉ đưa về màn xác thực (`s03-login.html` mô phỏng `/auth`); câu hỏi "có link mời hay tạo cây riêng" nằm trong luồng đăng ký (s02 / s03 / s05), không nằm ở trang chủ.
- **s02** token hết hạn / đã dùng **không** được mở đường thoát "tự tạo cây của tôi".
- **s03** giữ nguyên `?token=` của link mời khi qua bước đăng nhập.
- **s04** thông báo trung tính, không tiết lộ email có tồn tại không; phần cảnh báo
  nói rõ **mọi thiết bị** đều bị đăng xuất.
- **s05** một tài khoản chỉ có một cây — 409 nêu rõ, không cho tạo cây thứ hai.
- **s07** nút ghim ảnh ghi rõ "Gắn ảnh của tôi vào node này", không phải "đổi ảnh".
- **s08** 409 có 3 bước, bảng so khác 5 cột, và một hộp thoại cảnh báo **thứ hai**
  cho thao tác Ghi đè. Không chọn sẵn, không tự thử lại.
- **s10** ảnh trong thùng rác chia theo người xoá, tự nhận diện bằng `WF.myId()`.
- **s11** album sửa được khi bạn là người tạo **hoặc** chủ nhóm; ảnh đã ẩn vẫn hiện
  kèm nhãn và nút Hiện lại.
- **s12** 403 trừ khi là chủ nhóm; hạn 7/30/90 ngày; có ô sao chép; đếm số lần mở.
- **s13** khách chỉ đọc: node không kéo được, và có băng cảnh báo rằng **ẩn nút không
  có nghĩa chặn được ghi**.
- **s14** khôi phục phải có bước xem trước khác biệt; khi 409, lựa chọn mặc định là
  **Dừng lại**; có bảng đối chiếu id cũ ↔ id mới; cảnh báo tiếng Việt trong PDF.
- **s15** gắn sự kiện với một người; **không** có danh sách người tham gia trong ghi chú.
- **s16** chuyển quyền sở hữu thì người gửi **vẫn ở trong nhóm** với vai Biên tập viên.
  Không có "rời nhóm" — chỉ có xoá tài khoản.

---

## 5. Nền tảng UI

`assets/ui.css` không phải một bảng màu mới. Nó lấy nguyên vẹn token từ
`project/frontend/src/app/globals.css` và mirror đúng class của shadcn/ui:

| Nhóm | Lớp trong wireframe | Nguồn trong app |
|---|---|---|
| Nút | `.btn[data-variant][data-size]` | `src/components/ui/button.tsx` |
| Thẻ | `.card` + `.card-header/-title/-content` | `src/components/ui/card.tsx` |
| Ô nhập | `.field`, `.field-group`, `.input`, `.select`, `.textarea` | `src/components/ui/{input,select,textarea,label}.tsx` |
| Hộp thoại | `.dialog` + `.dialog-header/-title/-description/-footer` | `src/components/ui/dialog.tsx` |
| Thanh báo | `.banner[data-tone]` | thay cho `Alert` |
| Sidebar | `.sidebar`, `.sidebar-inset`, `.sidebar-menu-button` | `src/app/group/_components/sidebar/sidebar-group-client.tsx` |
| Sơ đồ | `.flow-wrap`, `.node`, `.panel-editor` | `src/app/group/_components/react-flow/family-member-node.tsx` |

Các giá trị đã kiểm chứng bằng trình duyệt: header cao **48px**, sidebar rộng
**256px**, node rộng **150px** — khớp với app.

Một ngoại lệ: các lớp `.landing-*` (trang chủ `s01`) **không tồn tại trong app
hiện tại** — đó là bề mặt đề xuất mới cho `(public)/page.tsx`, dựng tạm chỉ bằng
token có sẵn. Nếu được duyệt thì phải viết lại bằng Tailwind như phần còn lại của
app, không copy nguyên CSS.

Nếu bạn đổi style trong `assets/ui.css`, nghĩa là bạn đang đề xuất đổi style của app.

---

## 6. File

```
wireframes/
  index.html                    danh mục + bảng phân quyền dùng chung
  s01 … s16 .html               16 màn hình
  assets/
    ui.css                      design system (token, component, tiện ích)
    ui.js                       WF.* — phân quyền, tab, hộp thoại, toast, vẽ cây
    mock-data.js                dữ liệu giả: 12 thành viên, 19 quan hệ, ảnh, sự kiện…
```

`ui.js` không phụ thuộc framework. Nó cung cấp:

- `WF.PERM`, `WF.can()`, `WF.getRole()`, `WF.setRole()`, `WF.myId()` — phân quyền
- `WF.mountRolePill()` — công cụ đổi vai trò
- `WF.tabs()` / `WF.wireTabs()` — tab
- `WF.openDialog()` / `WF.closeDialog()`, `WF.toast()`, `WF.runProgress()`
- `WF.renderTree()`, `WF.attachDrag()`, `WF.zoomBy()`, `WF.fitView()` — sơ đồ cây
- `WF.formatDate()`, `WF.esc()`, `WF.qs()`, `WF.qsa()`

---

## 7. Quy ước cho người sửa

- **Mọi chữ hiện ra với người dùng bằng tiếng Việt.**
- **Mỗi màn hình chỉ có đúng một `<details class="note">`**, đặt ở cuối trang, mặc
  định đóng. Không chú thích nổi trên giao diện.
- Mỗi màn hình có **một ghi chú duy nhất** nói phần nào là quyết định sản phẩm và
  phần nào chỉ là trang trí.
- Ảnh trong wireframe là khối màu phẳng, không tải từ mạng.
- Không thêm màu mới ngoài `globals.css`. Nếu cần một màu avatar mà app chưa định
  nghĩa (`--avatar-color-1..6`), đó là phát hiện về app, đừng giấu vào wireframe.
