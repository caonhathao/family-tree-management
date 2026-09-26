# 04 — Thứ tự thực hiện

> 6 stage trên **một nhánh**: `refactor/individual-ui`.
> Thứ tự không phải tuỳ chọn — mỗi stage tiêu thụ output của stage trước. Stage nào cần backend thì ghi rõ ở cột cuối.
> Mỗi stage mở **PR riêng** để review được độc lập, nhưng cùng nhánh để không phải rebase lặp lại.

---

## Bảng tổng quan

| Stage | Cần backend | Kết quả | Deploy được khi backend còn cũ? |
|---|---|---|---|
| **0** — Chốt hợp đồng | ❌ | 6 file tài liệu + 2 yêu cầu gửi backend | — (không có code) |
| **1** — Gỡ vỏ SaaS | ❌ | Không còn admin, blog, marketing; 3 layout gộp 1 | ✅ **có** |
| **2** — Auth & vai trò | Phase 0 | Không còn `role`/`ADMIN`/`isLeader`; có truyền quyền sở hữu | ⚠️ cần backend phase 0 |
| **3** — Đường ghi dữ liệu | Phase 2 bước **2.2b** (`/changes`) | CRUD từng người, `If-Match`, xử lý 409 | ❌ |
| **4** — Màn hình mới | Phase 2 **+ Phase 3 (3.3, 3.4)** | Lịch sử, thùng rác, tìm kiếm, ảnh, import/export | ❌ |
| **5** — Album & chia sẻ | 3.1, 4.1 | Album ảnh, link chỉ đọc | ❌ |

**Stage duy nhất có thể bắt đầu ngay hôm nay là stage 0.** Stage 1 cũng không cần backend — nó chỉ xoá thứ backend cũ vẫn phục vụ tốt.

---

## Stage 0 — Chốt hợp đồng

**Không viết code.** Deliverable là chính 6 file trong thư mục này + bản gửi backend.

Việc cần làm:
1. Đọc lại 6 file này, chỉnh những chỗ số dòng đã lệch.
2. Gửi [`../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md`](../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md) cho phía backend, **lấy phản hồi trước khi vào stage 3**. R1 (batch endpoint) là thứ tốn công nhất và **thêm bước 2.2b** vào kế hoạch backend — cần thống nhất sớm.

   > ✅ **Đã xong 2026-09-27.** Backend đã trả lời toàn bộ R1/R2 bằng văn bản (xem mục *"Câu hỏi đã trả lời"* trong `06`). `/changes` được chấp nhận là **đường ghi chính**; D6 đã đổi từ *Hybrid* sang *Batch-first*. Còn chốt: `MEMBER_PHOTO_CHANGED` (tuỳ chọn, không chặn stage nào).
3. ~~Chốt 2 câu còn treo~~ → **đã giải quyết 2026-09-27**: (a) xuất ảnh cây PDF/PNG **tách khỏi `03` §5, hạ xuống P2** thành mục riêng `03` §13 + `fe/03` §13, kèm cảnh báo render server-side phải xử lý font tiếng Việt — backend `03` §13; (b) `FAMILY_LAYOUT_CHANGED` **có** dùng trong bộ lọc lịch sử (đã chốt ở backend `06` R2.1, nằm trong 15 `ACTION_TYPE`). Còn treo duy nhất: `MEMBER_PHOTO_CHANGED` (tuỳ chọn, không chặn stage nào).
4. Dán 6 bất biến F1–F6 vào PR template.

**Nghiệm thu**: backend đã trả lời R1/R2 bằng văn bản; 13 quyết định Q1–Q13 không còn mục nào để `?`.

---

## Stage 1 — Gỡ vỏ SaaS

**Không cần backend.** Đây là PR lớn nhất về số file nhưng **không đụng logic** — chỉ xoá và dọn.

Thứ tự trong PR (giữ mỗi bước build được):

| Bước | Việc |
|---|---|
| 1.1 | `FE-B1` — blog, blog-media, `store/blog`, 6 package `@editorjs/*`, `BLOG_MEDIA_TYPE` |
| 1.2 | `FE-B8` — xoá `app/(public)/`, dựng `/` redirector (Q11), dựng lại `BottomNavBar` ở layout mới, chuyển `/features` thành trang tĩnh |
| 1.3 | `FE-B2` — xoá `app/admin/**`, `roleRights`, nhánh admin trong `proxy.ts`, `getRoleFromToken`, `USER_ROLE`, `getUserListAction` |
| 1.4 | `FE-B10` — dọn `publicRoutes` |
| 1.5 | `FE-B5`, `FE-B6` — `resetPassword` giả, `changeLeader` chết |
| 1.6 | `FE-B7` — 7 dependency chết (có `knip` làm bằng chứng) |
| 1.7 | `FE-B9` — xoá 4 mục menu chết |
| 1.8 | `FE-B10` (nửa còn lại) — chuyển bộ table kit `admin/_components` → `components/table/` |
| 1.9 | `§8` chỉ phần `API_PREFIX` — **dùng giá trị `/api`**, chuyển `/api/v1` để ở stage 3 |
| 1.10 | `§9` — gộp 3 layout thành `<ShellSidebarLayout>` |
| 1.11 | `§10` — `/` và `/group` redirect thay vì in text lỗi |

⚠️ **FE-B2 phải chờ backend phase 0 xong mới deploy** (cột "cần backend" ở bảng tổng quan ghi ⚠️). Lý do: xoá `x-user-role` trong khi backend vẫn trả `role` thì không chết, nhưng **giữ** nó thì RBAC admin đã xoá mà `roleRights` thì chưa → cần làm cùng lúc với nhánh. Nếu tuyệt đối phải deploy sớm hơn thì giữ nguyên 3 dòng `x-user-role` và xoá sau, **đánh dấu TODO kèm link issue** — đừng xoá một nửa.

⚠️ **Không đụng `FE-B3`/`FE-B4`** (`isLeader`, `pinnedMemberId`) ở stage này — chúng cần backend phase 0/2 mới đổi nguồn sự thật. Để ở stage 2/3.

**Nghiệm thu**:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm exec knip
```
- Chạy dev: `/admin`, `/features?part=x`, `/tutorials`, `/faq`, `/user/invite-list` → tất cả redirect hợp lý, không 404 trắng
- Sidebar chỉ còn 4 mục, tất cả có trang thật
- `grep -rn "blog\|editorjs\|USER_ROLE\|roleRights\|x-user-role" src/` → 0
- Mobile vẫn có `BottomNavBar`
- Bất biến F1–F6: không vi phạm mới (PR này xoá, không viết lại service)

---

## Stage 2 — Auth & vai trò

**Cần backend phase 0** (FE-B2 xoá `role` khỏi auth response, FE-B3 xoá `isLeader`).

| Bước | Việc |
|---|---|
| 2.1 | Xoá `x-user-role` (`proxy.ts:149`) + `getRoleFromToken` — kèm backend đã bỏ `role` |
| 2.2 | `§6` — `isLeader` → `MEMBER_ROLE.OWNER` ở `family-info-drawer.tsx:44,171,189` và `family-setting-drawer.tsx:50` |
| 2.3 | `§6` — **nối nút *Đổi vai trò*** (`family-info-drawer.tsx:212-224`, đang không có `onClick`) vào `UpdateGroupMemberRoleAction`. Chặn chọn `OWNER` trong dropdown — backend chỉ cho `EDITOR ↔ VIEWER` |
| 2.4 | `§6` — dựng UI chuyển quyền sở hữu trong section rỗng `family-setting-drawer.tsx:126-134`, dùng `PATCH /group-family/:groupId/transfer-ownership` |
| 2.5 | `§7` — `pinnedMemberId` → `localStorage` (`FE-B4`) |
| 2.6 | `§3` của `03` — `/auth/forgot-password` + `/auth/reset-password?token=` (**chỉ UI**, chờ backend `03` §9) |
| 2.7 | `§14` — sửa `useRouter()` trong `catch` (`panel-editor.tsx:74`) |
| 2.8 | `§10` — `/auth` mà đã đăng nhập thì redirect (đã có sẵn ở `proxy.ts:141`) — kiểm lại không hỏng sau khi dọn `publicRoutes` |

⚠️ **2.3 là một bug thật, không phải tính năng mới.** Người dùng thấy menu *Đổi vai trò*, bấm, **không có gì xảy ra**. Nhìn như app hỏng. Sửa nó sớm, không gộp vào PR lớn.

⚠️ **2.4 phải cảnh báo trước khi chuyển**: người nhận có quyền xoá nhóm. Không dùng dialog mặc định.

✅ **Sửa 2026-09-27** (backend `06` R2.4) — bản cũ ghi *"người gửi mất quyền sửa"*, **đã sai**:

| | Đúng |
|---|---|
| Endpoint | `PATCH /group-family/:groupId/transfer-ownership`, `memberId` **bắt buộc** — không tự chọn theo luật D8 (D8 là đường nội bộ của `MembershipService` khi OWNER *rời group*, không đi qua HTTP) |
| Người nhận | Thừa kế `EDITOR`; không còn `EDITOR` thì fallback `VIEWER` |
| Người gửi | OWNER cũ **còn `EDITOR`, không bị kick** |

⚠️ Vì vậy dialog phải có **1 bước chọn người nhận** trước khi gọi, và **không** được hiển thị "bạn sẽ mất quyền" như `changeLeader` cũ — câu đó giờ sai. Nếu vẫn giữ câu cảnh báo cũ thì người dùng ngại bàn giao, mà người nhập dữ liệu thường **chính là** người hiểu ngữ cảnh nhất.

⚠️ **2.6 chỉ dựng UI.** Backend `POST /auth/reset` hiện là endpoint giả — chạy UI này lên là hiển thị "đã gửi" cho một email **không bao giờ được gửi**. Hoặc dựng sau khi backend xong, hoặc dựng UI ở trạng thái disabled có chú thích. Đừng ship UI đang nói dối.

**Nghiệm thu**:
- `grep -rn "isLeader\|x-user-role\|getRoleFromToken\|USER_ROLE" src/` → 0
- Bấm *Đổi vai trò* thật sự đổi được, và dropdown **không** có lựa chọn `OWNER`
- Chuyển quyền sở hữu → người nhận thành OWNER, người gửi thành EDITOR, cả hai thấy đúng UI
- Xoá nhóm: EDITOR **không** thấy nút; và gọi tay endpoint vẫn 403
- VIEWER không thấy nút *Lưu*/*Sắp xếp* (`§7` của `02` — nút sẽ có ở stage 3, tạm chưa kiểm được)
- F1–F6 không vi phạm mới

---

## Stage 3 — Đường ghi dữ liệu (phần khó nhất)

**Cần backend phase 2 + R1 đã được đồng ý và đã implement.**

| Bước | Việc |
|---|---|
| 3.0 | `§12` — tách `getLayoutedElements` + `derive.ts`. **Làm trước** để mọi test tiếp theo có chỗ đứng |
| 3.1 | `§4` — `generation` chỉ để hiển thị; xoá input "Thế hệ" |
| 3.2 | `§5` — `materializeRelationships` (chỉ để vẽ), client gửi 1 chiều |
| 3.3 | `§2` — `src/lib/family/derive.ts` + `computeGenerations` |
| 3.4 | `§1` — `familySlice` mới (`origin` + `dirty` + `status`), selector `buildTree` |
| 3.5 | `§2` — `localId` → `id` + `clientRef`; `buildOperations` tách `__unsaved` |
| 3.6 | `§0`/`§3` — `apiClient.family.applyChanges` + `If-Match` |
| 3.7 | Xoá `SyncFamilyAction` + `SyncFamilyDtoSchema` + `apiClient.family.syncFamily`; `family.actions.ts` còn 2 hàm |
| 3.8 | `§3` — xử lý 409. `status: "conflict"` + `conflict` trong store |
| 3.9 | `§12` của `03` — hộp thoại xung đột (dùng `ActivityLog`) |
| 3.10 | `§7` — 2 tầng bố cục + lớp phủ theo `version`; `LAYOUT_SAVE` trong `buildOperations` |
| 3.11 | `§11` — nút *Sắp xếp* (gửi `positions: []` → server tự arrange); nút *Lưu* toàn cục **luôn kèm** `LAYOUT_SAVE` với `positions[]` đã kéo, không hỏi "có publish không"; sửa `onNodeDragStop` ghi vào state riêng. **Vẽ lại từ `tree` trả về, không dùng lại `positions` đã gửi**. Xoá nút *Lưu bố cục* và *Chỉnh sửa lại* |
| 3.12 | `§8` — đổi `API_PREFIX` `/api` → `/api/v1` (**cùng lúc deploy backend**) |
| 3.13 | `§11` của `03` — băng chuyền bố cục cá nhân |
| 3.14 | `panel-editor.tsx` — nối lại *Lưu*, *Tạo sơ đồ*, *Xóa toàn bộ*, *Chi tiết* (xoá) |

⚠️ **3.12 phải cùng lúc với deploy backend.** Tuần tự bất kỳ chiều nào cũng làm hỏng toàn bộ app: FE đổi trước → 404 hàng loạt; backend đổi trước → 401 hàng loạt. Deploy cùng nhịp hoặc dùng feature flag ở `API_PREFIX`.

⚠️ **3.1–3.3 phải xong trước 3.4.** `buildTree` phụ thuộc `materializeRelationships` + `computeGenerations`. Làm đảo thứ tự sẽ phải viết lại selector.

⚠️ **3.8 và 3.9 là một đôi.** Không bật `If-Match` mà không có UI xử lý 409 thì tệ hơn hiện trạng. Hoặc làm cả hai, hoặc tạm để `version` luôn khớp (tức chưa bật) cho tới khi 3.9 xong.

⚠️ **3.10–3.11 cần R1.4.** Nếu `LAYOUT_SAVE` không bump `version`, lớp phủ của mọi người không bao giờ hết hạn → đúng bug "che mất thay đổi của người khác" quay lại. Nhưng R1.4 **không** kéo theo cảnh báo trước hay polling `version`: server tidy rồi mới ghi, mô hình 1 OWNER + 1 EDITOR. Chi tiết ở backend `06` R1.4.

⚠️ **`§11` của `02` (deep-equal 3 lần mỗi render)** được xoá tự nhiên khi làm 3.4. Ghi vào mô tả PR như **sửa hiệu năng có sẵn**, không giấu trong refactor — người đọc PR cần biết vì sao render nhanh hơn.

**Nghiệm thu**:
- `grep -rn "localId\|syncFamily\|SyncFamilyDtoSchema" src/` → 0 (trừ 1 chỗ tên ref nội bộ nếu giữ)
- Bấm *Lưu* với 1 cây 300 người, 3 thay đổi → **1** request, body nhỏ hơn nhiều lần
- Thêm 1 người → cây vẽ đúng **ngay**, không cần F5
- Hai EDITOR mở cùng một cây: A lưu → B bấm Lưu → **hộp thoại xung đột hiện ra, không retry, không ghi đè im lặng**
- `payload` không bao giờ có `clientRef` trong `id` của `MEMBER_UPDATE`; không có `generation`; không có quan hệ chiều ngược
- Kéo tay → F5 → bố cục riêng còn; bấm *Lưu* → bố cục chung thay thế
- Người khác bấm *Sắp xếp* → F5 → lớp phủ tự hết hạn + có thông báo
- VIEWER: không thấy *Lưu*/*Sắp xếp*, vẫn kéo tay được
- `pnpm typecheck && pnpm lint && pnpm test`

---

## Stage 4 — Màn hình mới

**Cần backend phase 2** (`03` bước 2.7–2.11, 2.13) **+ phase 3 bước 3.3/3.4** (import/export).

⚠️ **Sửa 2026-09-27:** bản cũ của dòng này ghi *"Cần backend phase 2"* và trích `03` bước 2.7–2.11, 2.13 — nhưng 4.6–4.8 là **export/import**, mà export/import nằm ở **phase 3** bước **3.3/3.4** của kế hoạch backend, không phải phase 2. Thiếu phụ thuộc này thì stage 4 bị chặn vô lý.

| Bước | Việc |
|---|---|
| 4.1 | `§1` của `03` — màn hình lịch sử `/group/activity` |
| 4.2 | `§2` của `03` — `/user/trash` (**dùng đúng URL menu hiện tại**) |
| 4.3 | `§13` của `02` — 3 enum đổi hình dạng + bảng ánh xạ nhãn |
| 4.4 | `§3` của `03` — tìm kiếm thành viên |
| 4.5 | `§4` của `03` — ảnh thành viên (**thêm lại `next-cloudinary`**) |
| 4.6 | `§5.1` của `03` — export JSON — phải **đủ id** để `restore` dùng lại được |
| 4.7 | `§5.2` của `03` — **khôi phục từ JSON** (`mode: 'restore'`, giữ nguyên id) |
| 4.8 | `§5.3` của `03` — import GEDCOM + báo lỗi theo dòng (`mode: 'create'`) |
| 4.9 | `§5` — xử lý `idMap` sau import để cây không lệch id |
| 4.10 | `§9` của `03` — gắn sự kiện vào người |
| 4.11 | `§14` của `02` — dọn nốt 2 lỗi sẵn có |

⚠️ **4.1 trước 4.3.** Lịch sử hiển thị `ACTION_TYPE`/`TARGET_TYPE` mới — xây UI trước rồi đổi enum sau sẽ làm **105 chỗ** (15 action type × 7 target type) lệch. Con số này lớn hơn nhiều so với ước lượng *"18 chỗ"* trước đây, nên bảng nhãn ở 4.3 phải **sinh từ 2 mảng hằng**, không viết tay.

⚠️ **4.2 đổi ý nghĩa `DELETE`**, không chỉ thêm trang. Dialog xoá phải nói *"Có thể khôi phục trong 30 ngày"*. Thiếu câu này thì người dùng quen cách cũ sẽ xoá rồi đóng dialog mà không biết.

⚠️ **4.7/4.8 là đường *nạp hàng loạt từ file***, không phải đường ghi DUY NHẤT (bản cũ ghi sai). `/changes` mới là đường ghi chính — xem `R1`. Cả hai đều phải qua `dryRun` → xem diff → xác nhận. **Tuyệt đối không** dựng lại đường sync cũ.

⚠️ **4.6 → 4.7 là cặp khép kín, không phải 2 tính năng rời.** Export mà không có `restore` thì chỉ là tải file về rồi không dùng được. UI phải cho chọn chế độ rõ ràng, và cảnh báo khi người dùng chọn `create` với file backup: *mọi id sẽ đổi, mọi tham chiếu (album, ảnh, log) sẽ đứt*.

⚠️ **4.5 upload ảnh** phải debounce + huỷ request cũ, nếu không mỗi lần đổi ảnh nhanh sẽ để lại media cũ trên Cloudinary.

**Nghiệm thu**:
- Export JSON → xoá group → **import lại bằng `mode: 'restore'`** → **cây giống hệt kể cả id** *(vòng bảo đảm dữ liệu thật — dòng này quan trọng nhất của stage)*
- Cùng file đó nhưng dùng `mode: 'create'` → cây đúng nhưng **id đổi hết** → UI phải cảnh báo trước, không cho bấm một cách im lặng
- `mode: 'restore'` với file đã bị chiếm id → `409`, **không** ghi đè, không báo "khôi phục một phần thành công"
- GEDCOM thật bẩn → import không crash, báo lỗi **theo dòng**
- Thành viên soft-delete **không** xuất hiện ở: cây, tìm kiếm, lịch sử, export
- VIEWER gọi `/group/activity` → 403
- Xoá 1 người → lịch sử hiện **2 dòng**
- Tất cả `ACTION_TYPE` mới có nhãn tiếng Việt, **không** hiện `*_RAW`
- `pnpm typecheck && pnpm lint && pnpm test`

---

## Stage 5 — Album & chia sẻ

**Cần backend `03` §4 (albums) và `03` §6 (share link)** — tức là bước **3.1** và **4.1**.

| Bước | Việc |
|---|---|
| 5.1 | `§8` của `03` — `/group/albums` + dùng bộ table kit đã chuyển chỗ ở 1.8 |
| 5.2 | Gắn ảnh album cho thành viên (dùng `avatarUrl` sẵn có, **không** nhân bản) |
| 5.3 | `§6` của `03` — tạo/thu hồi link chỉ đọc |
| 5.4 | `/share/[token]` — chỉ đọc |
| 5.5 | `§10` của `03` — sự kiện có người tham gia (chỉ nếu backend có cột) |

⚠️ **5.4 là bề mặt tấn công mới.** Phải scope `groupFamilyId` y hệt mọi route khác (bất biến I1 phía backend), rate limit riêng, guard riêng — **không** dùng `AtGuard`.

⚠️ **5.4 phải tách component, không được chỉ ẩn nút.** Route chia sẻ dùng cùng component cây với `/group` thì giấu UI không chặn được ghi. Phải chặn ở tầng data.

⚠️ **`/share/[token]` không dùng cookie nên không đi qua `publicRoutes` kiểu hiện tại** — nó tự xác thực bằng token. Phải sửa `isPublicRoute` cho đúng (xem `FE-B10`).

**Nghiệm thu**:
- Link bị thu hồi → mất truy cập **ngay lập tức**
- Trang chia sẻ **không có** nút Lưu / Sắp xếp / Xoá / Thêm thành viên, và gọi tay API vẫn bị chặn
- Upload 100 ảnh → không rò media nào trên Cloudinary
- Bất biến I1–I5 phía backend vẫn 5/5 sau khi thêm share link
- `pnpm typecheck && pnpm lint && pnpm test`

---

## Cổng phát hành

Không mở cho người lạ cho tới khi **tất cả** mục sau xong:

- [ ] Stage 0 + 1 xong, review được
- [ ] Stage 3 xong: 1 lần *Lưu* = 1 request, có xử lý 409
- [ ] Stage 4 xong: **export → xoá group → import → cây giống hệt**
- [ ] Ảnh thành viên chạy được
- [ ] Lịch sử thay đổi hiện đúng (kể cả 2 dòng khi xoá)
- [ ] Không còn menu nào trỏ tới trang không tồn tại
- [ ] Bất biến F1–F6 không vi phạm, đã dán vào PR template
- [ ] Backend đã lên phase 2 (không còn `POST /family/sync-data/:groupId`)
- [ ] Clone sạch → `cp .env.example .env` → chạy được không cần sửa tay

Thiếu một mục thì vẫn dùng được với người thân, nhưng **không mở cho người lạ**.

---

## Ghi chú cho người nhận bàn giao

Sau mỗi stage:

1. Chạy đủ gate theo thứ tự: `prettier --check` → `lint` → `typecheck` → `test` → `build` (đây là thứ tự CI dùng — sai thứ tự là tự tạo việc sửa lại).
2. Dán 6 dòng F1–F6 vào mô tả PR. Một dòng không tick → chưa xong.
3. Nếu phát hiện một bất biến F1–F6 **sai**: sửa bất biến trước, viết lý do kỹ thuật vào file, rồi mới code. Không sửa code trước rồi giấu.
4. Số dòng trong tài liệu là ảnh chụp tại `9076749`. Trước khi sửa theo, kiểm tra lại — chính các đợt refactor này sẽ làm dịch chuyển chúng.
