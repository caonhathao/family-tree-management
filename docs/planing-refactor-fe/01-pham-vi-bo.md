# 01 — Phạm vi BỎ (xoá hẳn khỏi frontend)

> Nguyên tắc: xoá thật, **không** comment lại "tạm chưa dùng". Mỗi mục dưới đây đều trả lời *"giữ lại thì giữ vì lý do kỹ thuật cụ thể nào"* — không có câu trả lời thì xoá.
>
> Thứ tự: **FE-B1 → FE-B2 → FE-B3 → FE-B4 → FE-B5** là tiền đề của nhau (xoá blog làm nhẹ admin plane; xoá admin plane làm nhẹ auth; xoá auth layer làm nhẹ enum). Phần còn lại độc lập, làm song song được.
>
> **Ký hiệu:** mục của file này ghi **`FE-B1`…`FE-B10`**; mục của bộ backend ghi **`BE-B1`…`BE-B10`**. Hai danh sách **không cùng nghĩa** và lệch nhau từ mục thứ 5 trở đi (`FE-B5` = `resetPassword` giả, còn `BE-B5` = `pinnedMemberId`). Khi tra chéo, **luôn viết kèm tiền tố** — ký hiệu `B3` trần là không xác định. Bảng ánh xạ 2 chiều ở `05` §I1–I5 ↔ F1–F6.

---

## FE-B1 — Blog + blog-media (theo D3)

Xoá toàn bộ mặt blog ở FE:

| Xoá | Vì sao |
|---|---|
| `src/app/admin/blog_editor/**` | Trang soạn thảo |
| `src/app/admin/blogs/**` | Trang danh sách |
| `src/modules/blog/**` (5 file) | `.action` / `.service` / `.dto` / `.client-schemas` / `.service-validator` |
| `src/modules/blog-media/**` (3 file) | Upload/cleanup ảnh bài viết |
| `src/store/blog/**` (3 file) | `blogSlice` + `blogThunk` + `blogQuery` — cùng pattern draft/origin sẽ bị xoá ở `02` §1 |
| `BLOG_MEDIA_TYPE` trong `src/types/enums.ts:18-22` | Enum mirror của enum bị xoá |
| 6 dependency `@editorjs/*` trong `package.json:17-22` | Editor.js là **package frontend**, chỉ có đúng 2 chỗ dùng: `admin/blog_editor/_components/FeatureEditorInternal.tsx:8-15` và `(public)/features/components/feature-editor-internal.tsx:8-15` — **cả hai đều render nội dung blog** |

⚠️ **Đã xác minh câu hỏi mở của backend `BE-B1`**: `Editor.js` nằm ở `package.json` của *frontend*, không phải backend. Xoá blog là xoá được cả 6 package.

⚠️ **Phụ thuộc ngược lại của `/features`** — xem `FE-B8`. `/features` hiện lấy nội dung từ blog theo `?part=<slug>`; xoá blog thì `/features` **không còn nguồn nội dung**. Đây là lý do `FE-B8` phải làm trong cùng một PR, không để PR sau.

---

## FE-B2 — Admin plane (theo D2)

Đây là mảng thương mại lớn nhất còn sót. Xoá:

| Xoá | Chi tiết |
|---|---|
| `src/app/admin/**` (13 file) | Toàn bộ route group. `page.tsx` gốc **đã là stub rỗng** từ lâu — xoá không mất gì |
| `src/lib/middleware/auth.lib.ts` → `getRoleFromToken` (`:~40`) | Tồn tại **chỉ** để phục vụ RBAC admin. Cả 3 hàm đều gọi `GET /api/users/me` |
| `roleRights` trong `src/proxy.ts:17-28` | 7 đường dẫn `/admin*` + map role. BƯỚC 3 trong `proxy.ts:129-139` xoá luôn |
| Nhánh admin trong `proxy.ts:131-139` | `isAdminRoute` + redirect `/403` |
| Header `x-user-role` (`proxy.ts:149`) | Chỉ tồn tại cho RBAC admin. ⚠️ `auth-response.type.ts` phía backend cũng mất `role` theo `FE-B2` |
| `USER_ROLE` trong `src/types/enums.ts:1-4` | Xoá cả enum, không giữ `USER` — không có chỗ nào cần nó sau khi RBAC toàn hệ thống biến mất |
| `getUserListAction` (`user.actions.ts:92-121`) | Caller duy nhất của `apiClient.user.getAll` (`GET /api/users`) |
| `apiClient.user.getAll` (`api-client.lib.ts:111`) | Endpoint bị xoá |

⚠️ **Thứ tự bắt buộc**: xoá header `x-user-role` chỉ khi backend đã bỏ `role` khỏi `auth-response`. Xoá sớm hơn sẽ để `userRole` thành `undefined` và redirect admin vẫn "chạy" nhưng không bao giờ chặn đúng. Chi tiết ở `04` stage 2.

⚠️ **`/403` không có trang** — redirect của `proxy.ts:136` dẫn tới route rỗng. Sau khi xoá nhánh admin thì `/403` không còn ai gọi, nên **xoá luôn khỏi `publicRoutes`** nếu có.

**Không xoá** (chuyển chỗ, xem `FE-B10`): `admin/_components/{data-table,pagination,search-bar,footer-table}.tsx` — đây là bộ table kit dùng lại được cho danh sách thành viên, lịch sử thay đổi, thùng rác.

---

## FE-B3 — `isLeader` (phía FE, theo `BE-B3` backend)

| Xoá / sửa | Vị trí |
|---|---|
| `isLeader: boolean` | `group-family.dto.ts:30-31` và `:50` |
| Đọc `m.isLeader` → `amILeader` | `family-info-drawer.tsx:44`, `family-setting-drawer.tsx:50` |
| Icon `IoMdKey` khi `item.isLeader` | `family-info-drawer.tsx:171` |
| Điều kiện `amILeader && !item.isLeader` | `family-info-drawer.tsx:189` |
| Điều kiện `amILeader` ở nút *Xóa nhóm* | `family-setting-drawer.tsx:145-197` |
| `UpdateGroupMemberLeaderAction` | `group-member.actions.ts:34-58` — xem `FE-B6` |
| `apiClient.groupMember.changeLeader` | `api-client.lib.ts:126-129` |

Lý do giống backend: `isLeader` là **cờ boolean vô hiệu hoá toàn bộ hệ thống phân quyền**. Ở FE nó còn tệ hơn — nó là nguồn sự thật duy nhất cho cả hai drawer quyết định ai được xoá nhóm.

⚠️ **Không mất chức năng**: khả năng *chuyển quyền sở hữu* phải còn, chuyển sang `PATCH /group-family/:groupId/transfer-ownership` (backend `04` bước **2.9**, nguồn `03` §2). Xem `02` §6.

---

## FE-B4 — `pinnedMemberId` (theo `BE-B5` backend)

| Xoá | Vị trí |
|---|---|
| `pinnedMemberId: string \| null` | `group-family.dto.ts:31` |
| Đọc từ server | `group-content.tsx:98`, `:424-433` (đẩy vào local state), `:435-438` (`computeLabels`), `:449` (`isPinned`), `:530` (truyền xuống form) |
| Checkbox *Đây là tôi* | `family-member-form.tsx:44,53,91,98,108` + UI `:378-398` |
| `handlePin` | `family-member-form.tsx:93-125` |
| `pinMemberAction` | `group-family.actions.ts:207-227` — caller duy nhất |
| `apiClient.groupFamily.pinMember` | `api-client.lib.ts:97-100` |

Lý do: đây là **trạng thái UI**, không phải dữ liệu gia đình. Một người dùng duy nhất ghim bản thân vào cây — mỗi lần đổi thiết bị là phải đăng nhập lại. Chuyển sang `localStorage` (xem `02` §7, cùng cơ chế với tầng bố cục cá nhân).

---

## FE-B5 — `resetPassword` giả (theo `BE-B7` backend)

`apiClient.auth.resetPassword` (`api-client.lib.ts:16`, `POST /api/auth/reset`) có **0 call site trong toàn repo** — grep `resetPassword|forgot|quên mật` chỉ ra đúng dòng định nghĩa.

Nghĩa là: endpoint giả ở backend (`auth.controller.ts:151` — tìm user theo email, không tạo token, không gửi gì, vẫn trả success) **chưa từng được frontend chạm tới**. Không có UI quên mật khẩu nào cả.

Xoá ngay khỏi `api-client.lib.ts`, xây lại thật ở `03` §7 cùng lúc backend làm `PasswordResetToken`.

---

## FE-B6 — `changeLeader` (đã chết trên thực tế)

`UpdateGroupMemberLeaderAction` (`group-member.actions.ts:34-58`) gọi `apiClient.groupMember.changeLeader`. **Không có UI nào gọi nó** — vì mục *"Đổi vai trò"* ở `family-info-drawer.tsx:212-224` được render ra **nhưng không có `onClick`**.

Xoá cả action lẫn endpoint khỏi `api-client.lib.ts`. Đồng thời hoặc xoá luôn mục menu chết đó, hoặc nối nó vào `UpdateGroupMemberRoleAction` — xem `02` §6 (chọn **nối**, vì đổi vai trò là thứ người dùng thật cần và backend giữ nguyên `PATCH /group-member/:groupId`).

---

## FE-B7 — 7 dependency chết

Grep trên 183 file `.ts`/`.tsx` trong `src` — **0 import** ở cả 7 cái:

| Package | Ghi chú |
|---|---|
| `jwt-decode` | Đã chuyển sang verify bằng remote call (`proxy.ts` gọi `GET /api/auth/me`), không decode token ở FE nữa |
| `@dagrejs/dagre` | Layout thật là **hand-rolled** trong `group-content.tsx:183-384`, không dùng dagre |
| `next-intl` | 0 import, không có plugin trong `next.config.ts`, không có `messages/`. UI strings là **chuỗi tiếng Việt hardcode** |
| `pg` | Package PostgreSQL trong frontend |
| `sharp` | Xử lý ảnh server-side |
| `bcrypt` | Băm mật khẩu — việc của backend |
| `next-cloudinary` | 0 import **hiện tại**. Xoá bây giờ, thêm lại ở `03` §4 khi làm ảnh thành viên — giữ nó chỉ để "sẵn sàng" là giữ 1 dependency không ai dùng |

`knip` đã có sẵn trong devDependencies → dùng nó làm bằng chứng cho PR này thay vì chỉ grep.

**Giữ lại** (đang dùng thật): `cmdk` (3), `vaul` (7), `framer-motion` (11), `uuid` (9), `lodash.isequal` (6), `@tanstack/react-table` (7).

---

## FE-B8 — Marketing shell `(public)/`

| Xoá / sửa | Vị trí | Lý do |
|---|---|---|
| `src/app/(public)/` (12 file) | toàn bộ | Landing marketing không còn ở app cá nhân. Nhưng `layout.tsx` chứa `BottomNavBar` → **di chuyển**, xem bên dưới |
| `home-sections.tsx` (181 dòng) | 3 section + trích Bác Hồ | Nội dung thương mại |
| `navigation-menu.tsx` (129 dòng) | nav tới `/features`, `/tutorials`, `/faq` | **`/tutorials` và `/faq` không có trang**; dropdown mobile gộp cả 3 item về `/features` |
| `user-menu.tsx` | trong layout marketing | Xem lại — nếu là menu đăng nhập thì chuyển sang layout mới |
| `/features` → trang tĩnh | `(public)/features/page.tsx` | Xem dưới |

⚠️ **`/features` cần quyết định, không xoá mặc định.** Nó nhận `?part=<blog slug>` rồi render `FeatureEditor` với `IBlogDto` lấy từ API. Xoá blog ⇒ không còn slug nào. Ba lựa chọn:

1. **Trang tĩnh thuần client** — nội dung viết thẳng trong `.tsx`, giữ URL, sửa nav trỏ về đúng chỗ. *(chọn)*
2. Xoá route, cho nav trỏ `/` — ít việc hơn nhưng mất trang giới thiệu tính năng, tức là mất thứ dễ dùng nhất để khách mới hiểu app.
3. Giữ route, trả về `undefined` khi không có slug — **không chọn**, đó chính là hành vi lỗi sẵn có.

⚠️ **`BottomNavBar` không được xoá cùng.** Nó nằm trong `(public)/layout.tsx` và là điều hướng chính trên mobile. Phải dựng lại ở layout gốc mới (`03` Q11) — nếu quên, mobile mất toàn bộ thanh điều hướng.

---

## FE-B9 — 4 mục menu không có trang (theo Q10)

Trong `sidebar-profile.tsx`, 8 mục menu chỉ có **4** có trang thật:

| Mục | URL | Trang | Quyết định |
|---|---|---|---|
| Thông tin cá nhân | `/user/profile` | ✅ | giữ |
| Bảo mật | `/user/secure` | ✅ | giữ |
| Danh sách nhóm | `/user/groups` | ✅ | giữ |
| **Lời mời** | `/user/invite-list` | ❌ | **xoá** |
| **Kho lưu trữ** | `/user/storage` | ❌ | **xoá** |
| Thùng rác | `/user/trash` | ❌ | giữ mục, **dựng trang** ở `03` §2 |
| **Hỗ trợ** | `/user/support` | ❌ | **xoá** |
| **Phản hồi** | `/user/feadback` | ❌ | **xoá** (kèm typo `feadback`) |

⚠️ **Vì sao *Lời mời* bị xoá chứ không dựng**: nó **không dựng được** vì không có API. `apiClient.invite` chỉ có `createInvite` + `getInviteInfo` — không có endpoint liệt kê lời mời đã gửi. Dựng trang đòi hỏi thêm `GET /api/v1/invite/mine` ở backend, tức là thêm việc cho cả 2 bên để giữ một mục menu phụ. Với app cá nhân, luồng chính là *tạo link mời rồi gửi qua Zalo/email* — không cần quản lý danh sách đã gửi. Nếu sau này cần, thêm cả endpoint lẫn mục menu cùng lúc.

Xoá xong, nhóm `support` trong `sidebar-profile.tsx:70-84` rỗng hoàn toàn → xoá luôn group khỏi `data`.

---

## FE-B10 — `publicRoutes` chứa route chết

`proxy.ts:6-16` liệt kê 9 route, **5 trong số đó không tồn tại**:

| Entry | Thực tế |
|---|---|
| `/` | ✅ có (nhưng `FE-B8` xoá → thay bằng redirector ở Q11) |
| `/features` | ✅ có |
| `/tutorials` | ❌ **không có trang** — nav vẫn trỏ tới |
| `/auth` | ✅ có |
| `/faq` | ❌ **không có trang** — nav vẫn trỏ tới |
| `/api/auth/login-base` | ❌ **không có route handler** |
| `/api/auth/register` | ❌ |
| `/api/auth/refresh` | ❌ |
| `/api/auth/login-google` | ❌ |

4 entry `/api/*` chết vì **Next không có route handler nào** — `src/app/api` không tồn tại. Nhánh `pathname.startsWith("/api")` trong `proxy.ts:171-173` trả 401 JSON là **code chết**: không request nào tới `/api/*` từ trình duyệt.

Sau `FE-B8`: xoá `/tutorials`, `/faq`, và 4 entry `/api/*`. `isPublicRoute` cũng nên chuyển từ `includes()` (không so khớp tiền tố) sang có xử lý tiền tố — hiện tại thêm bất kỳ route con nào cũng phải liệt kê đầy đủ, và quên là redirect `/auth` (bất biểu F6).

---

## Danh sách kiểm tra sau khi xoá

```bash
cd project/frontend
pnpm typecheck          # bắt được import tới file đã xoá
pnpm lint
pnpm test
pnpm exec knip          # bằng chứng dependency chết
```

Rồi grep thủ công, tất cả phải trả về **0** kết quả trong `src/`:

```bash
grep -rn "blog\|editorjs\|USER_ROLE\|isLeader\|pinnedMemberId\|roleRights\|/admin\|x-user-role" src/
grep -rn "/tutorials\|/faq\|invite-list\|feadback" src/
```

Và: chạy `pnpm dev`, vào `/admin`, `/features?part=x`, `/tutorials`, `/faq`, `/user/invite-list` — tất cả phải redirect hợp lý, không 404 trắng.
