# 04 — Thứ tự thực hiện

> 6 stage trên **một nhánh**: `refactor/individual-ui`.
> Thứ tự không phải tuỳ chọn — mỗi stage tiêu thụ output của stage trước. Stage nào cần backend thì ghi rõ ở cột cuối.
> Mỗi stage mở **PR riêng** để review được độc lập, nhưng cùng nhánh để không phải rebase lặp lại.

---

## Bảng tổng quan

| Stage | Cần backend | Kết quả | Deploy được khi backend còn cũ? |
|---|---|---|---|
| **0** — Chốt hợp đồng | ❌ | 7 file tài liệu + 2 yêu cầu gửi backend | — (không có code) |
| **1** — Gỡ vỏ SaaS | ❌ | Không còn admin, blog, marketing, danh sách nhóm; 3 layout gộp 1 | ✅ **có** |
| **2** — Auth & vai trò | Phase 0 + `POST /auth/register?token=` | Không còn `role`/`ADMIN`/`isLeader`; đăng ký ngã ba; có truyền quyền sở hữu | ⚠️ cần backend phase 0 |
| **3** — Đường ghi dữ liệu | Phase 2 bước **2.2b** (`/changes`) | CRUD từng người, `If-Match`, xử lý 409, bố cục 1 tầng | ❌ |
| **4** — Màn hình mới | Phase 2 **+ Phase 3 (3.3, 3.4)** | Lịch sử, thùng rác, tìm kiếm, ảnh, import/export | ❌ |
| **5** — Album & chia sẻ | 3.1, 4.1 | Album ảnh có chủ, link chỉ đọc | ❌ |

**Stage duy nhất có thể bắt đầu ngay hôm nay là stage 0.** Stage 1 cũng không cần backend — nó chỉ xoá thứ backend cũ vẫn phục vụ tốt.

---

## Stage 0 — Chốt hợp đồng

**Không viết code.** Deliverable là chính 7 file trong thư mục này + bản gửi backend.

Việc cần làm:
1. Đọc lại 7 file này, chỉnh những chỗ số dòng đã lệch.
2. Gửi [`../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md`](../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md) cho phía backend, **lấy phản hồi trước khi vào stage 3**. R1 (batch endpoint) là thứ tốn công nhất và **thêm bước 2.2b** vào kế hoạch backend — cần thống nhất sớm.

   > ✅ **Đã xong 2026-09-27.** Backend đã trả lời toàn bộ R1/R2 bằng văn bản (xem mục *"Câu hỏi đã trả lời"* trong `06`). `/changes` được chấp nhận là **đường ghi chính**; D6 đã đổi từ *Hybrid* sang *Batch-first*. Còn chốt: `MEMBER_PHOTO_CHANGED` (tuỳ chọn, không chặn stage nào).
3. ~~Chốt 2 câu còn treo~~ → **đã giải quyết 2026-09-27**: (a) xuất ảnh cây PDF/PNG **tách khỏi `03` §5, hạ xuống P2** thành mục riêng `03` §13 + `fe/03` §13, kèm cảnh báo render server-side phải xử lý font tiếng Việt — backend `03` §13; (b) `FAMILY_LAYOUT_CHANGED` **có** dùng trong bộ lọc lịch sử (đã chốt ở backend `06` R2.1, nằm trong 15 `ACTION_TYPE`). Còn treo duy nhất: `MEMBER_PHOTO_CHANGED` (tuỳ chọn, không chặn stage nào).
4. Dán 7 bất biến F1–F7 vào PR template.

**Nghiệm thu**: backend đã trả lời R1/R2 bằng văn bản; 17 quyết định Q1–Q17 không còn mục nào để `?`.

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
| 1.8 | `FE-B11` — xoá mục *Danh sách nhóm* + page `/user/groups` + nút *Rời khỏi nhóm* + `leaveGroup` (Q16). Chỉ xoá phía FE, **giữ** endpoint `leaveGroup` ở backend (D8) |
| 1.9 | `FE-B10` (nửa còn lại) — chuyển bộ table kit `admin/_components` → `components/table/` |
| 1.10 | `§8` chỉ phần `API_PREFIX` — **dùng giá trị `/api`**, chuyển `/api/v1` để ở stage 3 |
| 1.11 | `§9` — gộp 3 layout thành `<ShellSidebarLayout>` |
| 1.12 | `§10` — `/` và `/group` redirect thay vì in text lỗi; redirector chỉ còn **2 nhánh** (0 group / 1 group) |

⚠️ **FE-B2 phải chờ backend phase 0 xong mới deploy** (cột "cần backend" ở bảng tổng quan ghi ⚠️). Lý do: xoá `x-user-role` trong khi backend vẫn trả `role` thì không chết, nhưng **giữ** nó thì RBAC admin đã xoá mà `roleRights` thì chưa → cần làm cùng lúc với nhánh. Nếu tuyệt đối phải deploy sớm hơn thì giữ nguyên 3 dòng `x-user-role` và xoá sau, **đánh dấu TODO kèm link issue** — đừng xoá một nửa.

⚠️ **Không đụng `FE-B3`/`FE-B4`** (`isLeader`, `pinnedMemberId`) ở stage này — chúng cần backend phase 0/2 mới đổi nguồn sự thật. Để ở stage 2/3.

⚠️ **1.8 chỉ xoá phía UI, không xoá `leaveGroup` phía backend.** Xem `01` FE-B11 — giữ endpoint là giữ lưới an toàn cho bất biến **I6** (1 tài khoản chỉ 1 group). Xoá hẳn thì không còn đường nào chặn tạo group thứ 2 từ phía server nếu có ai đó gọi tay.

⚠️ **1.8 phụ thuộc backend chặn group thứ 2 (409) phải lên trước**, nếu không thì sau khi xoá UI người dùng vẫn tạo được group thứ 2 bằng cách gọi tay endpoint. Xem `be/03` và `be/04`.

**Nghiệm thu**:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm exec knip
```
- Chạy dev: `/admin`, `/features?part=x`, `/tutorials`, `/faq`, `/user/invite-list`, `/user/groups` → tất cả redirect hợp lý, không 404 trắng
- Sidebar chỉ còn 4 mục, tất cả có trang thật
- `grep -rn "blog\|editorjs\|USER_ROLE\|roleRights\|x-user-role" src/` → 0
- `grep -rn "user/groups\|leaveGroup" src/` → 0
- Mobile vẫn có `BottomNavBar`
- Bất biến F1–F7: không vi phạm mới (PR này xoá, không viết lại service)

---

## Stage 2 — Auth & vai trò

**Cần backend phase 0** (FE-B2 xoá `role` khỏi auth response, FE-B3 xoá `isLeader`).

| Bước | Việc |
|---|---|
| 2.1 | Xoá `x-user-role` (`proxy.ts:149`) + `getRoleFromToken` — kèm backend đã bỏ `role` |
| 2.2 | `§6` — `isLeader` → `MEMBER_ROLE.OWNER` ở `family-info-drawer.tsx:44,171,189` và `family-setting-drawer.tsx:50` |
| 2.3 | `§6` — **nối nút *Đổi vai trò*** (`family-info-drawer.tsx:212-224`, đang không có `onClick`) vào `UpdateGroupMemberRoleAction`. Chặn chọn `OWNER` trong dropdown — backend chỉ cho `EDITOR ↔ VIEWER` |
| 2.4 | `§6` — dựng UI chuyển quyền sở hữu trong section rỗng `family-setting-drawer.tsx:126-134`, dùng `PATCH /group-family/:groupId/transfer-ownership` |
| 2.5 | `§6` của `02` — `pinnedMemberId` **chuyển thành cơ chế gắn ảnh cho node** (Q14): payload pin mang thêm `photoId` chụp tại thời điểm pin; đổi nhãn checkbox *Đây là tôi* → *"gắn ảnh của tôi vào node này"* |
| 2.5b | `§6` của `02` — dựng UI **gán tay ảnh cho node** (quyền `edit`) ở `panel-editor.tsx` |
| 2.5c | **Q15** — `POST /auth/register` nhận `?token=`. FE: `/auth/register?token=` đọc token → gửi lên; backend trả `groupId` + `role`; không có token → hiện màn tạo cây riêng |
| 2.5d | **Q15/F7** — `publicRoutes` thêm `/auth/forgot-password`, `/auth/reset-password`, `/auth/register` (kể cả khi có `?token=`) |
| 2.6 | `§7` của `03` — `/auth/forgot-password` + `/auth/reset-password?token=` (**chỉ UI**, chờ backend `03` §9) |
| 2.7 | `§14` — sửa `useRouter()` trong `catch` (`panel-editor.tsx:74`) |
| 2.8 | `§10` — `/auth` mà đã đăng nhập thì redirect (đã có sẵn ở `proxy.ts:141`) — kiểm lại không hỏng sau khi dọn `publicRoutes` |

⚠️ **2.3 là một bug thật, không phải tính năng mới.** Người dùng thấy menu *Đổi vai trò*, bấm, **không có gì xảy ra**. Nhìn như app hỏng. Sửa nó sớm, không gộp vào PR lớn.

⚠️ **2.4 phải cảnh báo trước khi chuyển**: người nhận có quyền xoá nhóm. Không dùng dialog mặc định.

⚠️ **2.5 là thay đổi hướng, không phải đổi chi tiết.** Bản nháp trước ghi *"chuyển `pinnedMemberId` sang `localStorage`"* — đã sai, xem `01` FE-B4 và `02` §6. Không implement bản cũ rồi sửa sau: nó sẽ tạo ra 2 nơi lưu trạng thái pin cùng lúc.

⚠️ **2.5 chụp ảnh lúc pin, không đọc động khi render** — nếu không, đổi ảnh hồ sơ sẽ tự đổi ảnh node trong cây của người khác. Xem `03` §4.

⚠️ **2.5c không được tự quyết bước 2 phía FE.** Nếu có `?token=` mà backend chưa xử lý, **không** được fallback sang "tạo cây riêng" — người được mời sẽ vào nhầm cây riêng của họ và không ai báo lỗi. Phải hiện lỗi rõ ràng và dừng. Xem `be/03`.

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
- **Pin node ở máy A → sau đó A đổi ảnh hồ sơ → node trong cây của người khác KHÔNG đổi ảnh**
- Gửi tay payload pin với `pinnedMemberId` của tài khoản khác → bị từ chối
- Mở `/auth/register?token=<hợp lệ>` → đăng ký xong vào thẳng cây, vai **VIEWER**; không có token → tạo cây riêng, vai **OWNER**
- Mở `/auth/register?token=<hết hạn>` → hiện lỗi rõ ràng, **không** tạo cây riêng
- Đã đăng nhập rồi mà vào `/auth/register?token=` → redirect về cây, không tạo tài khoản thứ 2
- VIEWER không thấy nút *Lưu*/*Sắp xếp* (`§7` của `02` — nút sẽ có ở stage 3, tạm chưa kiểm được)
- F1–F7 không vi phạm mới

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
| 3.10 | `§7` của `02` — **1 tầng bố cục**: `onNodeDragStop` ghi vào state phiên (`useState` trong provider, không store, không `localStorage`, không debounce); `LAYOUT_SAVE` trong `buildOperations` |
| 3.11 | `§7` của `02` — nút *Sắp xếp* (gửi `positions: []` → server tự arrange); nút *Lưu* toàn cục **luôn kèm** `LAYOUT_SAVE` với `positions[]` đã kéo. **Vẽ lại từ `tree` trả về, không dùng lại `positions` đã gửi**. Xoá nút *Lưu bố cục* và *Chỉnh sửa lại*. Xoá toàn bộ code lớp phủ: `ff:layout:*`, version guard, thông báo hết hạn |
| 3.12 | `§8` — đổi `API_PREFIX` `/api` → `/api/v1` (**cùng lúc deploy backend**) |
| 3.13 | `§11` của `03` — **xoá, không dựng** (băng chuyền bố cục cá nhân — đã cắt khỏi phạm vi theo Q8) |
| 3.14 | `panel-editor.tsx` — nối lại *Lưu*, *Tạo sơ đồ*, *Xóa toàn bộ*, *Chi tiết* (xoá) |

⚠️ **3.12 phải cùng lúc với deploy backend.** Tuần tự bất kỳ chiều nào cũng làm hỏng toàn bộ app: FE đổi trước → 404 hàng loạt; backend đổi trước → 401 hàng loạt. Deploy cùng nhịp hoặc dùng feature flag ở `API_PREFIX`.

⚠️ **3.1–3.3 phải xong trước 3.4.** `buildTree` phụ thuộc `materializeRelationships` + `computeGenerations`. Làm đảo thứ tự sẽ phải viết lại selector.

⚠️ **3.8 và 3.9 là một đôi.** Không bật `If-Match` mà không có UI xử lý 409 thì tệ hơn hiện trạng. Hoặc làm cả hai, hoặc tạm để `version` luôn khớp (tức chưa bật) cho tới khi 3.9 xong.

⚠️ **3.10 không còn lý do cũ của R1.4.** Bản nháp trước nói `LAYOUT_SAVE` phải bump `version` *"để lớp phủ hết hạn"* — lớp phủ đã bị xoá nên lý do đó không còn. Yêu cầu bump `version` + ghi `ActivityLog` **vẫn giữ**, theo bất biến **I4**/**I5**: mọi mutation đều bump + log, bố cục không có ngoại lệ. Chi tiết ở `02` §7 và backend `06` R1.4.

⚠️ **3.10 là cắt chứ không phải thêm.** Đừng viết lớp phủ rồi bỏ — sẽ mất thời gian và dễ để lại 1 nhánh đọc `localStorage` sót. Xoá thẳng `ff:layout:*`, `readLocalLayout`, và mọi chỗ kiểm tra `version` lúc load.

⚠️ **3.13 xoá thẳng, không dựng rồi bỏ.** Bản nháp trước coi đây là tính năng cần dựng; nó đã bị cắt khỏi phạm vi.

⚠️ **`§11` của `02` (deep-equal 3 lần mỗi render)** được xoá tự nhiên khi làm 3.4. Ghi vào mô tả PR như **sửa hiệu năng có sẵn**, không giấu trong refactor — người đọc PR cần biết vì sao render nhanh hơn.

**Nghiệm thu**:
- `grep -rn "localId\|syncFamily\|SyncFamilyDtoSchema" src/` → 0 (trừ 1 chỗ tên ref nội bộ nếu giữ)
- `grep -rn "ff:layout\|ff:pin" src/` → 0
- Bấm *Lưu* với 1 cây 300 người, 3 thay đổi → **1** request, body nhỏ hơn nhiều lần
- Thêm 1 người → cây vẽ đúng **ngay**, không cần F5
- Hai EDITOR mở cùng một cây: A lưu → B bấm Lưu → **hộp thoại xung đột hiện ra, không retry, không ghi đè im lặng**
- `payload` không bao giờ có `clientRef` trong `id` của `MEMBER_UPDATE`; không có `generation`; không có quan hệ chiều ngược
- **Kéo tay → F5 → bố cục tay MẤT, về đúng bố cục server, không có thông báo nào** (đây là hành vi đã chốt, không phải bug)
- Bấm *Lưu* → cây vẽ lại **đã sắp** (không phải bản thô vừa kéo); `version +1` đúng 1; lịch sử có dòng `FAMILY_LAYOUT_CHANGED`
- VIEWER: không thấy *Lưu*/*Sắp xếp*, **không kéo được node**, vẫn pan/zoom được
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
| 4.5 | `§4` của `03` — **gán ảnh cho node** (Q14): thêm lại `next-cloudinary`, `CldUploadWidget`, endpoint gán tay quyền `edit` |
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

⚠️ **4.5 dựng cả 2 đường, không chỉ 1.** Đường tay (gán ảnh người khác, quyền `edit`) và đường pin (tự lấy ảnh hồ sơ của chính mình) là 2 endpoint khác nhau với 2 bộ quyền khác nhau. Chỉ dựng đường tay thì người dùng phải upload lại ảnh hồ sơ của mình cho từng người; chỉ dựng đường pin thì không gán được ảnh cho người không có tài khoản. Chi tiết ở `03` §4.

**Nghiệm thu**:
- Export JSON → xoá group → **import lại bằng `mode: 'restore'`** → **cây giống hệt kể cả id** *(vòng bảo đảm dữ liệu thật — dòng này quan trọng nhất của stage)*
- Cùng file đó nhưng dùng `mode: 'create'` → cây đúng nhưng **id đổi hết** → UI phải cảnh báo trước, không cho bấm một cách im lặng
- `mode: 'restore'` với file đã bị chiếm id → `409`, **không** ghi đè, không báo "khôi phục một phần thành công"
- GEDCOM thật bẩn → import không crash, báo lỗi **theo dòng**
- Thành viên soft-delete **không** xuất hiện ở: cây, tìm kiếm, lịch sử, export
- VIEWER gọi `/group/activity` → 403
- Xoá 1 người → lịch sử hiện **2 dòng**
- Tất cả `ACTION_TYPE` mới có nhãn tiếng Việt, **không** hiện `*_RAW`
- **Lịch sử của VIEWER hiện dòng `ALBUM`/`PHOTO`/`EVENT` nhưng không hiện `MEMBER`/`RELATIONSHIP`/`FAMILY`/`GROUP`** — lọc ở tầng service, không phải ẩn bằng CSS
- Pin 1 node lúc A có avatar X → A đổi avatar sang Y → **node vẫn là X**
- `pnpm typecheck && pnpm lint && pnpm test`

---

## Stage 5 — Album & chia sẻ

**Cần backend `03` §4 (albums) và `03` §6 (share link)** — tức là bước **3.1** và **4.1**.

| Bước | Việc |
|---|---|
| 5.1 | `§8` của `03` — `/group/albums` + dùng bộ table kit đã chuyển chỗ ở 1.9 |
| 5.2 | Gắn ảnh album cho thành viên (dùng `photoId` sẵn có, **không** nhân bản) |
| 5.3 | **Q17** — album có `createdById`; UI áp bảng quyền theo chủ ở `02` §15 (chỉ chủ / group OWNER được sửa-xoá) |
| 5.4 | Trạng thái *"đã ẩn"* + nút *Mở ẩn*; mỗi người thấy thùng rác media **của mình** |
| 5.5 | `§6` của `03` — tạo/thu hồi link chỉ đọc |
| 5.6 | `/share/[token]` — chỉ đọc |

⚠️ **5.4 là bề mặt tấn công mới.** Phải scope `groupFamilyId` y hệt mọi route khác (bất biền I1 phía backend), rate limit riêng, guard riêng — **không** dùng `AtGuard`.

⚠️ **5.6 phải tách component, không được chỉ ẩn nút.** Route chia sẻ dùng cùng component cây với `/group` thì giấu UI không chặn được ghi. Phải chặn ở tầng data.

⚠️ **`/share/[token]` không dùng cookie nên không đi qua `publicRoutes` kiểu hiện tại** — nó tự xác thực bằng token. Phải sửa `isPublicRoute` cho đúng (xem `FE-B10`).

⚠️ **Trang chia sẻ là VIEWER của bên ngoài** — mọi dòng quyền `edit` trong bảng `02` §15 đều là ❌, kể cả *gán ảnh cho node* và *thêm media*. Đừng dùng chung component với `/group` rồi chỉ ẩn nút Lưu.

**Nghiệm thu**:
- Link bị thu hồi → mất truy cập **ngay lập tức**
- Trang chia sẻ **không có** nút Lưu / Sắp xếp / Xoá / Thêm thành viên / Thêm ảnh, và gọi tay API vẫn bị chặn
- **EDITOR xoá album của người khác → 403**, nhưng **sửa được thành viên trong cây**. Đây là dòng kiểm chứng `02` §15
- Ẩn 1 ảnh của người khác → hiện nhãn + nút *Mở ẩn*; **không** biến mất im lặng
- Xoá album → ảnh còn nằm album khác thì **giữ nguyên**, chỉ gỡ khỏi album
- Upload 100 ảnh → không rò media nào trên Cloudinary
- Bất biến I1–I7 phía backend vẫn 7/7 sau khi thêm share link
- `pnpm typecheck && pnpm lint && pnpm test`

---

## Cổng phát hành

Không mở cho người lạ cho tới khi **tất cả** mục sau xong:

- [ ] Stage 0 + 1 xong, review được
- [ ] Stage 3 xong: 1 lần *Lưu* = 1 request, có xử lý 409
- [ ] Stage 4 xong: **export → xoá group → import → cây giống hệt**
- [ ] Gán ảnh cho node chạy được (cả 2 đường: tự pin + gán tay)
- [ ] Lịch sử thay đổi hiện đúng (kể cả 2 dòng khi xoá), **và lọc theo vai**
- [ ] **Không còn màn/menu quản lý lời mời** (F7), **không còn `/user/groups`** (Q16)
- [ ] **Đăng ký qua link vào thẳng cây người mời, vai VIEWER** (Q15)
- [ ] **Không còn tầng bố cục `localStorage`** — grep `ff:layout` = 0 (Q8)
- [ ] Không còn menu nào trỏ tới trang không tồn tại
- [ ] Bất biến F1–F7 không vi phạm, đã dán vào PR template
- [ ] Backend đã lên phase 2 (không còn `POST /family/sync-data/:groupId`)
- [ ] Clone sạch → `cp .env.example .env` → chạy được không cần sửa tay

Thiếu một mục thì vẫn dùng được với người thân, nhưng **không mở cho người lạ**.

---

## Ghi chú cho người nhận bàn giao

Sau mỗi stage:

1. Chạy đủ gate theo thứ tự: `prettier --check` → `lint` → `typecheck` → `test` → `build` (đây là thứ tự CI dùng — sai thứ tự là tự tạo việc sửa lại).
2. Dán 7 dòng F1–F7 vào mô tả PR. Một dòng không tick → chưa xong.
3. Nếu phát hiện một bất biến F1–F7 **sai**: sửa bất biến trước, viết lý do kỹ thuật vào file, rồi mới code. Không sửa code trước rồi giấu.
4. Số dòng trong tài liệu là ảnh chụp tại `9076749`. Trước khi sửa theo, kiểm tra lại — chính các đợt refactor này sẽ làm dịch chuyển chúng.
5. **Có 2 mục trong bộ tài liệu này đã bị đảo ngược sau khi viết** — `FE-B4`/`§6` (`pinnedMemberId`, từ "xoá" thành "giữ") và `§11` của `03` (băng chuyền bố cục, từ "dựng" thành "xoá"). Nếu gặp mô tả cũ ở đâu đó (comment trong code, tài liệu cũ hơn, tin nhắn), **file này là bản đúng**. Đừng implement theo bản cũ rồi sửa sau.
