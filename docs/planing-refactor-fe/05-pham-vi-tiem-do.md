# 05 — Phạm vi TIẾM ĐỘ (bất biến bắt buộc)

> **Đây không phải danh sách việc. Đây là điều không được vi phạm ở bất kỳ PR nào** — kể cả PR không thuộc đợt refactor này.
>
> Đây là phát hiện quan trọng nhất của toàn bộ khảo sát frontend, và nó **lặp lại y hệt** phát hiện của khảo sát backend: hệ thống không hỏng vì thiếu tính năng, mà hỏng vì **không có bất biến nào được viết ra**. `familySlice` giữ `draft` + `origin` là một thói quen, không phải quy tắc — nên `family-member-form.tsx:136` mới mời sinh `v4()` làm `localId` mà không ai ngăn được.
>
> 5 bất biến backend (I1–I5) là phía server. 6 bất biến ở đây là phía client. **Hai bộ phải được kiểm tra cùng nhau** trong mọi PR đụng cả hai.
>
> ⚠️ **Ký hiệu `B` đã có tiền tố.** Cột "Sửa ở" ở bảng bên dưới dùng `FE-B*` cho mục của `planing-refactor-fe/01` và `BE-B*` cho mục của `planing-refactor-be/01` — **hai danh sách này không cùng nghĩa** và lệch nhau từ mục thứ 5 trở đi. Bảng ánh xạ 2 chiều ở [dòng 126](#) là nơi duy nhất trong file này dùng `BE-B*`, vì nó nói về việc *backend* xoá cột. Viết `B3` trần là không xác định.

---

## 6 bất biến

| # | Bất biến | Vì sao | Bắt được bug nào đã xảy ra |
|---|---|---|---|
| **F1** | **Không `localId`/`clientRef` nào trong body của bất kỳ request nào** | Danh tính phải do server cấp. Client cấp identity là gốc rễ của IDOR: `family.service.ts:35,71` `upsert` theo `id` client sinh mà không scope `groupFamilyId` — đúng ID của nhóm khác là đủ để ghi đè dữ liệu người khác | `family-member-form.tsx:149` mời sinh `v4()`; `family.service-validator.ts:12` bắt buộc `localId` là UUID — FE đang *nuôi* UUID cho server dùng |
| **F2** | **Không giá trị dẫn xuất nào trong payload** (`generation`, quan hệ chiều ngược) | Server là nguồn sự thật. Client tự tính rồi gửi lên là vừa thừa vừa nguy hiểm — và `version` **không** bắt được, vì client vẫn gửi `version` đúng | `relationship-form.tsx:190-219` dịch cả subtree khi thêm vợ; `:228` chỉ gửi 1 chiều trong khi UI đọc 2 chiều |
| **F3** | **Mọi URL dựng từ `API_PREFIX` trong `api-client.lib.ts`** | 60+ URL đều bắt đầu bằng `/api`. Đổi `/api` → `/api/v1` là một lần tìm-thay-thế. Một chữ gộp sai **không lộ lúc build**, chỉ lộ runtime 404 trên màn hình người dùng. Không có type nào bắt được | Sau backend bước 2.13: sửa tay chắc chắn sót |
| **F4** | **Mọi mutation mang `If-Match` và xử lý 409 bằng cách hiện ra, không phải ghi đè** | Hai người cùng sửa mà không có optimistic lock thì lần save sau âm thầm xoá việc trước. Và nếu phản ứng mặc định là "thử lại" thì ta quay lại đúng bug đó | `family.service.ts:62,130` `deleteMany` xoá sạch thứ không có trong payload |
| **F5** | **Không UI nào đọc field mà kế hoạch backend xoá** (`isLeader`, `pinnedMemberId`, `user.role`, `ADMIN`) | Server xoá cột = response không còn field = `undefined` lọt vào UI và điều kiện so sánh. Thường biểu hiện là *"tính năng tự tắt"* chứ không phải lỗi rõ ràng | `family-info-drawer.tsx:44,171,189,212`; `family-setting-drawer.tsx:50`; `group-family.dto.ts:30-31,50` |
| **F6** | **Không route hay menu entry nào mà không có trang thật** | Ấn vào rồi thấy trang trắng = app hỏng. Đồng thời mỗi route trong `publicRoutes` mà không có trang là một cái bẫy: quên thêm = redirect `/auth` vô tận | 4 menu không có trang; `/tutorials` + `/faq` không có trang nhưng nav trỏ tới; 4 entry `/api/*` trong `publicRoutes` không có route handler |

---

## Cách dùng

### 1. Nhúng vào mọi PR

Ghép 6 dòng này vào mô tả PR hoặc checklist review:

```
- [ ] F1  không có localId/clientRef trong body request
- [ ] F2  không có generation hay quan hệ chiều ngược trong payload
- [ ] F3  mọi URL dựng từ API_PREFIX, không viết "/api/..." trực tiếp
- [ ] F4  mutation mang If-Match; 409 thì hiện ra, không retry, không ghi đè
- [ ] F5  không đọc field backend đã xoá (isLeader, pinnedMemberId, user.role, ADMIN)
- [ ] F6  mọi route/menu đều có trang thật; route mới đã thêm vào publicRoutes nếu cần
```

Một dòng không tick → PR chưa xong, không merge.

### 2. Bất biến sai thì sửa bất biến, không sửa code

Nếu có lý do kỹ thuật để phá một bất biến: **viết lý do vào đây**, đổi mã bất biến, rồi mới code. Không sửa code trước rồi giấu.

Ví dụ hợp lệ về F1: nếu backend **thực sự** trả về `idMap` và chấp nhận `clientRef` trong `RELATIONSHIP_CREATE` (`R1.3`), thì `clientRef` vẫn hợp lệ **ở đúng chỗ đó** — vì nó tham chiếu một thành viên **chưa tồn tại**, chứ không phải định danh một thành viên đã tồn tại. Ranh giới là: **ref tới thứ chưa tồn tại thì được; id của thứ đã tồn tại thì không**.

### 3. Áp dụng cho mọi stage, không chỉ đợt refactor

6 stage trong `04-thu-tu-thuc-hien.md` đều nghiệm thu theo 6 dòng này. Nhưng ràng buộc có hiệu lực **từ PR đầu tiên** — nghĩa là các đoạn code sẵn có đang vi phạm cũng phải nằm trong danh sách việc.

---

## Danh sách vi phạm hiện tại (phải về 0)

Đây là phần cụ thể nhất của file. Mỗi dòng là một chỗ phải sửa, không phải một nguyên tắc để nhớ.

| Bất biến | Chỗ vi phạm | Sửa ở |
|---|---|---|
| F1 | `family.service-validator.ts:12` — `localId: z.string().uuid()` **bắt buộc** trong payload sync | `02` §2 |
| F1 | `family.service-validator.ts:25,32` — `localId` ở 2 chỗ nữa | `02` §2 |
| F1 | `family-member-form.tsx:149` — `v4()` sinh `localId` cho thành viên mới | `02` §2 |
| F1 | `family.dto.ts:4`, `family.client-schemas.ts:5`, `family-member.dto.ts:2`, `family-member.schemas.ts:5` — `localId` trong 4 file type | `02` §2 |
| F1 | `familySlice.ts:34` — `updateMemberInDraft` khớp theo `localId` | `02` §2 |
| F1 | `familyThunk.ts:34` — `deleteFamily` lấy `draft.family.localId` làm tham số | `02` §2 |
| F1 | `new-family-form.tsx:56,66,74,81,105,224,225` — `localId` cho family mới | `02` §2 |
| F1 | `group-content.tsx` ×7 (`:104,117,126,191,391,409,441`), `member-select.tsx:50,64,67,75`, `panel-editor.tsx:97,289,316`, `relationship-form.tsx` ×9, `family-member-form.tsx` ×8 — **tổng 60+ chỗ** | `02` §2 |
| F2 | `relationship-form.tsx:190-219` — client tự tính lại `generation`, dịch cả subtree khi thêm `SPOUSE` | `02` §4 |
| F2 | `family-member-form.tsx:303-321` — **cho người dùng tự nhập số thế hệ** | `02` §4 |
| F2 | `relationship-form.tsx:228` — gửi 1 chiều trong khi `:207,331` của `group-content.tsx` đọc 2 chiều ⇒ cặp cha–con chỉ vẽ đúng một phía | `02` §5 |
| F3 | `api-client.lib.ts` — 60+ URL viết cứng `/api/...` | `02` §8 |
| F3 | `proxy.ts:12-15` — 4 entry `/api/auth/*` trong `publicRoutes` không có route handler | `01` `FE-B10` |
| F4 | `familyThunk.ts:15-27` — không `version`, không `If-Match`; server `deleteMany` phần không trong payload | `02` §3 |
| F4 | `http.client.ts` — không hỗ trợ `If-Match`; chỉ tự động gắn Bearer | `02` §3 |
| F4 | Không có đường xử lý 409 ở bất kỳ đâu trong `src/` | `02` §3 + `03` §12 |
| F5 | `family-info-drawer.tsx:44` — `amILeader` từ `m.isLeader` | `02` §6 |
| F5 | `family-info-drawer.tsx:171` — icon `IoMdKey` theo `item.isLeader` | `02` §6 |
| F5 | `family-info-drawer.tsx:189-203` — điều kiện `amILeader && !item.isLeader` cho nút *Xóa khỏi nhóm* | `02` §6 |
| F5 | `family-info-drawer.tsx:212-224` — nút *Đổi vai trò* **không có `onClick`** (chức năng chết) | `02` §6 |
| F5 | `family-setting-drawer.tsx:50` — `amILeader` | `02` §6 |
| F5 | `group-family.dto.ts:30-31,50` — `isLeader`, `pinnedMemberId` trong response DTO | `01` `FE-B3`, `FE-B4` |
| F5 | `group-content.tsx:98,424-433,435-438,449,530` — `pinnedMemberId` từ server | `01` `FE-B4` |
| F5 | `family-member-form.tsx:44,53,91,98,108,378-398` — `handlePin` + checkbox *Đây là tôi* | `01` `FE-B4` |
| F5 | `proxy.ts:17-28,131-139,149` — `roleRights`, nhánh admin, `x-user-role` | `01` `FE-B2` |
| F5 | `enums.ts:1-4` — `USER_ROLE { ADMIN, USER }` | `01` `FE-B2` |
| F5 | `auth.lib.ts` — `getRoleFromToken` chỉ tồn tại cho RBAC admin | `01` `FE-B2` |
| F6 | `sidebar-profile.tsx:46-51` — menu *Lời mời* → `/user/invite-list`, không có trang | `01` `FE-B9` |
| F6 | `sidebar-profile.tsx:57-62` — menu *Kho lưu trữ* → `/user/storage`, không có trang | `01` `FE-B9` |
| F6 | `sidebar-profile.tsx:71-76` — menu *Hỗ trợ* → `/user/support`, không có trang | `01` `FE-B9` |
| F6 | `sidebar-profile.tsx:77-83` — menu *Phản hồi* → `/user/feadback` (typo), không có trang | `01` `FE-B9` |
| F6 | `sidebar-profile.tsx:64-67` — menu *Thùng rác* → `/user/trash`, không có trang (**giữ mục, dựng trang**) | `03` §2 |
| F6 | `sidebar-group-client.tsx` — dropdown *Hướng dẫn* → `/tutorials`, không có trang | `01` `FE-B8` |
| F6 | `navigation-menu.tsx` — nav trỏ `/tutorials` và `/faq`, **cả hai không có trang**; dropdown mobile gộp 3 item về `/features` | `01` `FE-B8` |
| F6 | `proxy.ts:8,10` — `publicRoutes` chứa `/tutorials` và `/faq` | `01` `FE-B10` |
| F6 | `proxy.ts:136` — redirect `/403`, **không có trang `/403`** | `01` `FE-B2`, `02` §14 |
| F6 | `proxy.ts:30-33` — `isPublicRoute` dùng `includes()` **không so khớp tiền tố**; thêm route con phải liệt kê đầy đủ, quên là redirect `/auth` | `01` `FE-B10` |
| F6 | `group-content-wrapper.tsx:48` — thiếu `groupId` thì in text lỗi inline thay vì redirect | `02` §10 |
| F6 | `admin/page.tsx` — stub rỗng | `01` `FE-B2` |
| F6 | `panel-editor.tsx` — mục *Chi tiết* không có handler | `01` `FE-B7`, `02` §7 |

---

## Lỗ hổng đã biết: 3 bug mà 6 bất biến này **không** bắt

Ghi lại để không quên. Nguyên tắc: khi tìm thấy bug không thuộc 6 bất biến này, **thêm một dòng vào bảng trên**, và cân nhắc nâng thành F7, F8…

| Bug | Vì sao 6 bất biến không bắt | Sửa ở |
|---|---|---|
| `lodash.isequal` trên **toàn bộ cây** 3 lần mỗi render (`familyThunk.ts:15`, `panel-editor.tsx:157`, `group-content.tsx:456-474`) | Không phải lỗi tenant, không phải lỗi versioning — đây là **hiệu năng**. `F4` ngăn được mất dữ liệu nhưng không ngăn được render 300 người chậm | `02` §11 |
| `useRouter()` gọi **bên trong `catch`** của hàm async không phải component (`panel-editor.tsx:74`) | Vi phạm rules-of-hooks. Chỉ sống sót vì nhánh lỗi hiếm khi chạy — không có bất biến nào nói về điều đó | `02` §14 |
| Nút *Đổi vai trò* render mà không có `onClick` (`family-info-drawer.tsx:212-224`) | Không phải lỗi dữ liệu — là lỗi **UI chết**. `F6` nói về route/menu không có trang, không nói về nút không có handler | `02` §6 |

Mục tiêu của bảng này không phải "phát hiện đủ hết lần này", mà là **không lặp lại "tìm ra, viết vào tài liệu, rồi quên"**.

---

## Ánh xạ 2 chiều với bất biến backend

Đợt refactor này đụng cả 2 bản. Bảng dưới để một PR đụng cả hai bên không bỏ sót bên nào.

| Bất biến FE | Bất biến backend liên quan | Ghi chú |
|---|---|---|
| F1 (không `localId` trong body) | **I1** (mọi `where` phải scope `groupFamilyId`) | Cùng một bug, hai đầu. FE ngừng cấp identity → `upsert` theo `id` client không còn tồn tại → I1 có thể được siết |
| F2 (không giá trị dẫn xuất) | **D10** (`generation` server là nguồn sự thật) + **I4** | `version` **không** bắt được lỗi `generation` — vì client vẫn gửi `version` đúng. Đây là lý do F2 là bất biến riêng chứ không gộp vào F4 |
| F3 (mọi URL từ `API_PREFIX`) | **2.13** (`/api` → `/api/v1`) | Cùng một lần đổi, hai bên phải deploy **cùng nhịp** |
| F4 (mọi mutation mang `If-Match`) | **I4** (`version++` trong `$transaction`) + **R1** (batch endpoint) | F4 vô nghĩa nếu không có R1: N request lẻ thì lưu không nguyên tử |
| F5 (không đọc field bị xoá) | **D2** (bỏ admin) · **BE-B3** (bỏ `isLeader`) · **BE-B5** (bỏ `pinnedMemberId`) | Mỗi lần backend xoá cột là một lần F5 có thêm vi phạm |
| F6 (route/menu có trang thật) | **D3** (bỏ blog) — `/features` mất nguồn nội dung | Không có bất biến backend nào; đây là thứ FE tự phát hiện |
| — | **I5** (mọi mutation ghi `ActivityLog`) | FE dựa vào để hiển thị lịch sử thay đổi (`03` §1) và thông điệp 409 (`03` §12). Nếu I5 không giữ, 2 màn hình đó hỏng theo |

---

## Khi tìm thấy bug mới

1. Kiểm tra 6 bất biến này có bắt được không.
2. **Không bắt được** → thêm vào bảng *Lỗ hổng đã biết* ở trên, ghi rõ vì sao không bắt được.
3. **Bắt được** → thêm vào bảng *Danh sách vi phạm hiện tại* với đường dẫn + số dòng.
4. Nếu nó là một **dạng lỗi mới** (không phải chỉ là một chỗ) → cân nhắc nâng thành **F7, F8…** và viết lý do kỹ thuật vào đây, trước khi code.

Bất biến mới chỉ được thêm khi ta chứng minh được: *đã có bug thật xảy ra vì thiếu quy tắc đó*. Không thêm nguyên tắc "nên làm" — 6 bất biến ở đây đều bắt được một lỗi đã xảy ra.
