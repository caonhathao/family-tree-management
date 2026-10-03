# Wireframe — Nhà họ

22 màn hình HTML tĩnh cộng một trang danh mục theo **4 luồng vai trò**, mô phỏng
giao diện thật của sản phẩm và được dựng lại trên nền tảng UI đang có:
**shadcn/ui new-york + Tailwind v4, lấy token từ `project/frontend/src/app/globals.css`**.

100% tĩnh: mở thẳng `file://.../wireframes/index.html` bằng double-click, bấm link để
qua màn kế tiếp — không cần build, không cần server, không cần mạng ngoài.

```
file://.../wireframes/index.html          # mở thẳng từ ổ đĩa
npx serve wireframes                      # hoặc phục vụ qua http
```

> Playwright chặn giao thức `file:`. Nếu bạn định chạy test tự động, hãy phục vụ
> `wireframes/` bằng một static server bất kỳ rồi trỏ vào `http://127.0.0.1:<port>/`.

Quyết định sản phẩm theo màn nằm ở [`PLAN.md`](PLAN.md). Wireframe chỉ minh hoạ layout.

---

## 1. Màn hình theo 4 luồng vai trò

| File | Màn hình | Route thật | Căn cứ |
|---|---|---|---|
| `index.html` | Danh mục 4 luồng vai trò (link kèm `?role=`) | — | — |
| `s01-landing.html` | Trang chủ — landing giới thiệu | `/` | `02-pham-vi-sua.md` §10 · `01-pham-vi-bo.md` FE-B8 |
| `s02-register.html` | Đăng ký tài khoản (không token) | `/auth` | `06-workflow-user.md` §2.2 · `01-pham-vi-bo.md` FE-B11 |
| `s03-login.html` | Đăng nhập (giữ `?token=`) | `/auth` | `06-workflow-user.md` §2.2 |
| `s04-forgot.html` | Quên mật khẩu — gửi link | `/auth` | `03-pham-vi-them.md` §7 · `01-pham-vi-bo.md` FE-B5 |
| `s04-forgot-sent.html` | Đã gửi link | `/auth` | `03-pham-vi-them.md` §7 · `01-pham-vi-bo.md` FE-B5 |
| `s04-forgot-reset.html` | Đặt mật khẩu mới | `/user/secure` | `03-pham-vi-them.md` §7 · `01-pham-vi-bo.md` FE-B5 |
| `s05-join.html` | Vào nhóm bằng link mời (còn hạn) | `/invite?token=` | `06-workflow-user.md` §2.1 · `04-thu-tu-thuc-hien.md` Stage 2 |
| `s05-join-expired.html` | Link mời hết hạn | `/invite?token=` | `06-workflow-user.md` §2.1 · `04-thu-tu-thuc-hien.md` Stage 2 |
| `s05-join-used.html` | Link mời đã dùng | `/invite?token=` | `06-workflow-user.md` §2.1 · `04-thu-tu-thuc-hien.md` Stage 2 |
| `s06-create.html` | Tạo cây gia phả (không token) | `/invite` | `06-workflow-user.md` §2.2 · `01-pham-vi-bo.md` FE-B11 |
| `s06-create-conflict.html` | 409 — tài khoản đã có cây | `/invite` | `06-workflow-user.md` §2.2 · `01-pham-vi-bo.md` FE-B11 |
| `s07-tree.html` | Cây gia phả — màn chính | `/group` | `02-pham-vi-sua.md` §1–5, §9, §12 · `04-thu-tu-thuc-hien.md` Stage 3 |
| `s08-member-form.html` | Hộp thoại thêm / sửa thành viên | `/group` | `06-workflow-user.md` §3.1–3.2 |
| `s09-save-conflict.html` | Mâu thuẫn 409 khi lưu | `/group` | `02-pham-vi-sua.md` §3 · `03-pham-vi-them.md` §12 · `06-workflow-user.md` §6 |
| `s10-activity.html` | Lịch sử thay đổi | `/group` (tab) | `03-pham-vi-them.md` §1 · `06-workflow-user.md` §7 |
| `s11-trash.html` | Thùng rác — cây và ảnh | `/group` (tab) | `03-pham-vi-them.md` §2 · `06-workflow-user.md` Trục 2 |
| `s12-albums.html` | Album ảnh | `/group` (tab) | `03-pham-vi-them.md` §8 · `06-workflow-user.md` §8.2 |
| `s13-events.html` | Sự kiện | `/group` (tab) | `03-pham-vi-them.md` §9 |
| `s14-share-manage.html` | Quản lý link chia sẻ | `/group` (tab) | `03-pham-vi-them.md` §6 |
| `s15-share-readonly.html` | Xem cây bằng link chia sẻ (khách) | `/share/:token` | `03-pham-vi-them.md` §6 |
| `s16-import-export.html` | Nhập / Xuất | `/group` (tab) | `03-pham-vi-them.md` §5, §13 |
| `s17-profile.html` | Hồ sơ, người cùng nhóm, xoá tài khoản | `/user/profile`, `/user/groups` | `03-pham-vi-them.md` §11 · `01-pham-vi-bo.md` FE-B6, FE-B11 · `06-workflow-user.md` §5 |

Cột "Căn cứ" trỏ tới `docs/planing-refactor-fe/`. Màn hình nào làm đúng bản chất
quyền hạn mà tài liệu đang chốt thì wireframe giữ nguyên bản chất đó, kể cả khi
giao diện hiện tại chưa làm. Quyết định chi tiết theo từng màn → `PLAN.md` §2.

---

## 2. Bảng phân quyền (dùng chung)

Bảng này dùng chung cho mọi màn hình, không lặp lại trên từng file.

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

**Điều hướng theo flow:** mọi link trong `index.html` mang `?role=<vai trò>`, ví dụ
`s07-tree.html?role=owner`. Khi mở màn kèm tham số này, pill được đặt sẵn theo vai trò
đó (không cần chạm localStorage). Vẫn đổi tay được sau đó. Vai trò hợp lệ:
`owner` · `editor` · `viewer` · `anon` (luồng Khách dùng `anon`). Nếu trình duyệt chặn
`localStorage` (ví dụ Firefox mở `file://`), tham số này vẫn hoạt động.

---

## 4. Quyết định sản phẩm

Mọi quyết định sản phẩm theo màn (từng nằm trong `<details class="note">` trên từng
màn hình) đã được dời về **[`PLAN.md`](PLAN.md)** — bảng chặng theo 4 flow ở §1, quyết
định chi tiết theo màn ở §2, tóm tắt phân quyền ở §3. Wireframe không còn ghi chú nổi
trên giao diện.

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
  index.html                    danh mục 4 luồng vai trò (link kèm ?role=)
  PLAN.md                       quyết định sản phẩm theo flow × chặng
  s01 … s05 .html               luồng Khách: landing, register, login, forgot ×3, join ×3
  s06-*.html                    luồng Chủ nhóm: tạo cây, 409 đã có cây
  s07 … s14 .html               luồng trong nhóm: cây, thành viên, 409, lịch sử, thùng rác, album, sự kiện, chia sẻ
  s15-share-readonly.html       xem cây bằng link chia sẻ (khách)
  s16-import-export.html        nhập / xuất
  s17-profile.html              hồ sơ, xoá tài khoản
  assets/
    ui.css                      design system (token, component, tiện ích)
    ui.js                       WF.* — phân quyền, tab, hộp thoại, toast, vẽ cây
    mock-data.js                dữ liệu giả: 12 thành viên, 19 quan hệ, ảnh, sự kiện…
```

`ui.js` không phụ thuộc framework. Nó cung cấp:

- `WF.PERM`, `WF.can()`, `WF.getRole()`, `WF.setRole()`, `WF.myId()` — phân quyền
- `WF.mountRolePill()` — công cụ đổi vai trò (đọc `?role=` trên URL để đặt sẵn)
- `WF.tabs()` / `WF.wireTabs()` — tab
- `WF.openDialog()` / `WF.closeDialog()`, `WF.toast()`, `WF.runProgress()`
- `WF.renderTree()`, `WF.attachDrag()`, `WF.zoomBy()`, `WF.fitView()` — sơ đồ cây
- `WF.formatDate()`, `WF.esc()`, `WF.qs()`, `WF.qsa()`

---

## 7. Quy ước cho người sửa

- **Mọi chữ hiện ra với người dùng bằng tiếng Việt.**
- **Không còn `<details class="note">` trên màn hình.** Mọi chỉ dẫn và quyết định sản
  phẩm nằm ở `PLAN.md` — sửa quyết định thì sửa PLAN.md, không viết chú thích nổi trên
  giao diện.
- Không có nút giả lập ("Mô phỏng", "Dùng tệp mẫu", "Thử lại", "i" gợi ý dev) trên
  màn hình. Nút phải làm việc thật hoặc bỏ.
- Ảnh trong wireframe là khối màu phẳng, không tải từ mạng.
- Không thêm màu mới ngoài `globals.css`. Nếu cần một màu avatar mà app chưa định
  nghĩa (`--avatar-color-1..6`), đó là phát hiện về app, đừng giấu vào wireframe.