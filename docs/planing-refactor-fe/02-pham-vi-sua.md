# 02 — Phạm vi SỬA

> §0 là **2 yêu cầu gửi backend** — đọc trước mọi thứ khác, vì §1–§3 không làm được nếu backend chưa đồng ý.
> §1–§3 là viết lại đường ghi dữ liệu: đây là phần khó nhất và cũng là phần quan trọng nhất.

---

## §0 — Yêu cầu gửi backend (tiền đề cứng)

Bản gửi chính thức: [`../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md`](../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md)

### R1 — `POST /api/v1/family/:groupId/changes` (batch)

**Vấn đề**: `04` backend bước 2.2 chỉ liệt kê CRUD lẻ. Nhưng quyết định **Q4** là *giữ nút Lưu toàn cục*. Lưu bằng N request lẻ thì **không nguyên tử**:

```
POST members/a      → 200, đã commit
POST members/b      → 200, đã commit
POST relationships/c → 409 (version lệch)
→ kết quả: a và b đã ghi, c không, người dùng không biết đã lưu được gì
```

Đây không phải chi tiết UI — nó phá vỡ trực tiếp bất biến **I4** và **I5**: mutation không cùng transaction thì `version++` sai và `ActivityLog` ghi vào thứ đã bị rollback.

```
POST /api/v1/family/:groupId/changes
Headers:
  If-Match: "<version>"
Body:
  {
    "baseVersion": 42,
    "operations": [
      { "type": "MEMBER_CREATE",       "data": { ... } },
      { "type": "MEMBER_UPDATE",       "id": "...", "baseUpdatedAt": "...", "data": { ... } },
      { "type": "MEMBER_DELETE",       "id": "..." },
      { "type": "RELATIONSHIP_CREATE", "data": { "fromRef": "r1", "toRef": "r2", "type": "PARENT" } },
      { "type": "RELATIONSHIP_DELETE", "id": "..." },
      { "type": "FAMILY_UPDATE",       "data": { ... } },
      { "type": "LAYOUT_SAVE",         "data": { "positions": [{ "id": "...", "x": 0, "y": 0 }] } }
    ]
  }

200 → { "version": 43, "tree": { ... }, "idMap": { "r1": "uuid-thật" }, "activityIds": ["..."] }
409 → { "currentVersion": 44, "conflicts": [{ "opIndex": 2, "memberId": "...", "reason": "STALE_VERSION" }] }
```

⚠️ Với `LAYOUT_SAVE`: `positions` là bản người dùng **đã kéo**, nhưng **server tidy (auto-arrange) trước khi ghi**. `tree` trả về có `positionX/Y` là **bản đã sắp** → phải vẽ lại từ `tree`, không dùng lại `positions` đã gửi. Nút *Sắp xếp* gửi `positions: []` (server tự tính từ đầu, bỏ qua mọi kéo tay). Chi tiết ở backend `06` R1.4.

⚠️ **Tên gọi:** ref phía client trong payload này tên là **`clientRef`** (không phải `localId` — bất biển **F1** nói bỏ hẳn `localId` khỏi body). `clientRef` chỉ hợp lệ ở đúng chỗ nó tham chiếu thành viên **chưa tồn tại**; thành viên đã có thì dùng `id`.

Yêu cầu bắt buộc kèm theo:

| # | Yêu cầu | Vì sao |
|---|---------|--------|
| R1.1 | **Mức quyền `edit` (EDITOR+), không phải `manage`** | Theo Q12. Siết thành OWNER-only là EDITOR bấm *Lưu* rồi nhận 403. `canManage` ở `group-content.tsx:477` đã là `OWNER \|\| EDITOR` |
| R1.2 | **Một `$transaction` duy nhất**: áp dụng hết operations → `version++` đúng 1 lần → ghi hết `ActivityLog` | I4 + I5 |
| R1.3 | **`RELATIONSHIP_CREATE` nhận `fromRef`/`toRef` là ref phía client**, không phải `id` | Thành viên mới tạo trong cùng batch chưa có `id` thật. Server cần bảng map trong `$transaction` để resolve; phải **từ chối** ref không resolve được |
| R1.4 | **`LAYOUT_SAVE` bump `version` và ghi `ActivityLog`** với action type mới `FAMILY_LAYOUT_CHANGED` | Theo bất biến **I4** + **I5**: mọi mutation phải bump `version` trong cùng `$transaction` và ghi log. Nút *Sắp xếp* là một mutation, không có ngoại lệ (xem `§7`) |
| R1.5 | **`idMap` trả về đủ** cho cả `MEMBER_CREATE` lẫn `RELATIONSHIP_CREATE` | Client re-key thành viên mới sau khi lưu |
| R1.6 | **`baseUpdatedAt` trên `MEMBER_UPDATE`** để phát hiện sửa chồng cùng 1 người | `version` chỉ bắt được xung đột cả cây; `updatedAt` bắt được xung đột 1 dòng |
| R1.7 | Trả `409` **kèm trạng thái server hiện tại** trong body | Không có dữ liệu để merge thì UI chỉ còn lựa chọn bỏ thay đổi của mình — tệ hơn nhiều so với hiện tại |

### R2 — Bổ sung vào `03`/`04` backend

`Event.familyMemberId` (đã có trong `03` §8) là đủ cho `03` §9 (gắn sự kiện vào người). Nhưng cần thêm 2 mục:

| # | Yêu cầu | Vì sao |
|---|---------|--------|
| R2.1 | `ActivityLog` có đủ action type cho layout + membership | Theo R1.4: `FAMILY_LAYOUT_CHANGED`. **Tổng 15 `ACTION_TYPE`** — bảng chuẩn ở backend `03` §10, đã chốt 2026-09-27; xét lại ở backend `06` R2.1 |
| R2.2 | `GET /api/v1/family/:groupId/activity` phân trang **bằng cursor** | Offset pagination sẽ trùng/mất dòng khi ai đó vừa ghi log. Xem `03` §10 |

✅ **Đã chốt 2026-09-27:** `Event.familyMemberId` là **đúng 1 cột** và là **đủ** cho `03` §9 (quan hệ 1–1 "sự kiện này thuộc về người này"). Backend **cố ý không** thêm bảng `EventParticipant` — nhu cầu "danh sách khách mời" (quan hệ n–n) bị **cắt khỏi phạm vi** và hạ xuống P2 ở `03` §10. Chi tiết ở backend `06` R2.3.

---

## §1 — P0: Viết lại toàn bộ đường ghi dữ liệu

### Hiện trạng

```ts
// familySlice.ts
interface FamilyState {
  draft:  IDraftFamilyData;   // bản đang sửa
  origin: IDraftFamilyData;   // bản server đã xác nhận
}

// familyThunk.ts:15
if (isEqual(draft, origin)) return;      // so sánh TOÀN BỘ cây
const result = await SyncFamilyAction(groupId, draft);  // gửi TOÀN BỘ cây
dispatch(syncSuccess());                 // clone lại
```

Ba vấn đề, tầng tầng:

1. **Chi phí**: `lodash.isequal` trên 300 thành viên + mọi quan hệ, **mỗi lần render**. `group-content.tsx:456-474` còn gọi lại nó trong `beforeunload`, và `panel-editor.tsx:157` lần nữa để quyết định bật/tắt nút *Lưu*. Ba lần deep-equal mỗi render, chỉ để hỏi "có gì thay đổi không".
2. **Không suy ra được diff**: để biết cần gửi gì, toàn bộ cây phải được gửi lại. Không có "sửa đúng một người".
3. **Mất dữ liệu**: server `deleteMany` mọi thứ không có trong payload (`family.service.ts:62`, `:130`). Hai người cùng sửa → lần sau xoá việc trước.

### Đích

Bỏ `draft`/`origin` — thay bằng **ảnh chụp server bất biến** + **tập thao tác chưa lưu**:

```ts
interface FamilyState {
  origin: IFamilyTree;   // server đã xác nhận — KHÔNG bao giờ mutate
  version: number;       // Family.version — đưa vào If-Match

  dirty: {
    memberCreates: Record<clientRef, IFamilyMemberDto>;  // chưa có id
    memberUpdates: Record<id,        IFamilyMemberDto>;  // đã có id
    memberDeletes: Record<id,        { fullName: string }>;
    relCreates:    IRelationshipDto[];
    relDeletes:    Record<id, unknown>;
    familyInfo?:   IFamilyDto;
  }

  status: "idle" | "saving" | "conflict" | "error";
  conflict: { currentVersion: number; conflicts: ConflictItem[] } | null;
}
```

Cây hiển thị là **giá trị dẫn xuất**, không phải state:

```ts
// src/store/family/selectors.ts
export const selectTree      = createSelector([selectOrigin, selectDirty], buildTree);
export const selectIsDirty  = (s) => Object.keys(s.family.dirty).length > 0;
```

### Hệ quả

| Việc | Trước | Sau |
|---|---|---|
| `isDirty` | `lodash.isequal(draft, origin)` | `Object.keys(dirty).length > 0` — O(1) |
| `diffTree` | phải viết hàm diff cây | **không cần** — tập `dirty` *là* diff |
| `beforeunload` | `!isEqual(draft, origin)` | `selectIsDirty(state)` |
| Bấm *Lưu* | 1 request toàn cây | 1 request batch (`R1`) |
| Xung đột | không có | `status: "conflict"` + hộp thoại merge |

### Phải xử lý

- **`isDirty` thô ở UI**: `Object.keys(dirty)` không kiểm tra giá trị bên trong. Phải so sánh **nội dung** từng entry với `origin` (so sánh nông là đủ — object phẳng), nếu không thì người dùng sửa rồi sửa lại về giá trị cũ vẫn thấy nút *Lưu* sáng.
- **`origin` không được mutate**: đây là điểm dễ vi phạm nhất. Không có `setDraft` để lỡ tay gán vào.
- **`dirty` phải sống sót qua `revalidatePath`**: `family.actions.ts` đang gọi `revalidatePath` sau mỗi mutation. Nếu có thay đổi chưa lưu mà server render lại trang, `origin` mới sẽ đè lên draft. Cần tách: chỉ `revalidatePath` sau khi lưu thành công.
- **Thêm mục đã xoá rồi tạo lại cùng tên**: `memberDeletes` giữ id đã xoá, `memberCreates` dùng `clientRef` mới → không đụng nhau. Nhưng cần kiểm tra: thêm lại một người vừa xoá có tạo 2 bản ghi không.
- **`04` stage 3 phải viết test cho selector `buildTree`** — nó là nơi mọi lỗi hiển thị sẽ xuất hiện.

---

## §2 — P0: `localId` → `id`

`localId` là khoá nối của **toàn bộ mô hình dữ liệu phía client** — 60+ chỗ:

```
familySlice.ts:16,21,34          familyThunk.ts:34        familyThunk.test.ts:21,28,104,126
lib/utils.ts:72,294,321,329,382,385,401,433,438,450
family.service-validator.ts:12,25,32   family.dto.ts:4     family.client-schemas.ts:5
family-member.schemas.ts:5             family-member.dto.ts:2
group-content.tsx ×7                   member-select.tsx:50,64,67,75
panel-editor.tsx:97,289,316            relationship-form.tsx ×9
new-family-form.tsx:56,66,74,81,105,224,225              family-member-form.tsx ×8
```

Và nó **không chỉ là chi tiết UI** — nó là gốc rễ của IDOR ở backend. `family.service.ts:35,71` `upsert` theo `id` do client sinh mà không scope `groupFamilyId`; một `localId` là UUID hợp lệ là đủ để ghi đè dữ liệu nhóm khác (`02` backend §1). FE đang chủ động *nuôi* UUID đó cho server.

### Cách làm: **một hình dạng duy nhất trong cây**

Không đổi tên 60 chỗ rồi còn một `localId` sót lại — sẽ quay lại lỗi cũ. Thay vào đó:

| Tình huống | Cây chứa gì |
|---|---|
| Thành viên đã lưu | `id` (UUID thật từ server) |
| Thành viên đang tạo | `id` = `clientRef` tạm + cờ `__unsaved: true` |

`buildTree()` (selector ở `§1`) chèn các thành viên chưa lưu vào cây với `id` tạm. Nhờ vậy:

- Mọi nơi đọc `member.id` — dùng chung một tên, 60 chỗ sửa theo một lần rename thuần cơ học.
- Sau khi lưu, `idMap` từ R1.5 re-key `clientRef` → UUID thật. Cây dựng lại, mọi tham chiếu tự khớp.
- Payload gửi đi (`buildOperations`) **tách riêng** phần `__unsaved` → server không bao giờ thấy `clientRef` trong `id` của `MEMBER_UPDATE`. Đây là bất biến **F1**.

### Xoá

- `SyncFamilyDtoSchema` (`family.service-validator.ts:12`) — `localId: z.string().uuid()` bắt buộc. Xoá cả file cùng `syncFamily` (`api-client.lib.ts:52-57`).
- `syncSuccess` / `deleteAll` — thay bằng reducer mới.
- `familyThunk.test.ts` — viết lại theo state mới (giữ nguyên tên file).

---

## §3 — P0: `If-Match` + xử lý 409

`http.client.ts` **chưa hỗ trợ `If-Match`**. `headers` là object tự do nên thêm vào là một dòng, nhưng cần chuẩn hoá để không ai quên:

```ts
// family.actions.ts
const res = await apiRequest<IBatchResult>(apiClient.family.applyChanges.url(groupId), {
  method: apiClient.family.applyChanges.method,
  headers: { "If-Match": String(version) },
  body: { baseVersion: version, operations },
});
```

### Xử lý 409 — không được tự ghi đè

Đây là mấu chốt. Hiện tại app **không có** khái niệm xung đột; nếu thêm `If-Match` mà phản ứng mặc định là "thử lại", thì ta quay lại đúng bug đang có.

Kịch bản 409 **luôn là hai EDITOR cùng sửa** (theo Q9 — chỉ `OWNER`/`EDITOR` mới bấm *Lưu*), nên thông điệp phải nói rõ **ai** đã sửa **gì**, dựa trên `ActivityLog` mà R2.1 đã bảo đảm có:

```
⚠ Cây gia đình vừa được cập nhật
   Bạn Tuấn đã thêm "Nguyễn Thị Lan" và 2 quan hệ lúc 14:32
   Bạn có 5 thay đổi chưa lưu.        [Xem khác biệt]  [Ghi đè]  [Huỷ]
```

| Hành động | API | Cảnh báo |
|---|---|---|
| **Ghi đè** | `POST /changes` lại với `version` mới nhận từ 409 | Phải cảnh báo rõ sẽ mất thay đổi của người kia — không phải hộp thoại "OK/Đóng" mặc định |
| **Giữ của mình** | lấy `tree` từ body 409 làm `origin` mới, giữ `dirty` | Có thể lệch ngữ nghĩa — cần ghi rõ |
| **Huỷ** | `origin = tree` mới, xoá `dirty` | Không mất gì trên server, mất thay đổi chưa lưu → phải hỏi lại |
| **Gộp tay** | so từng `member` bằng `baseUpdatedAt` | Để sau, chỉ khi thực sự cần |

⚠️ **Không tự động retry.** Một retry im lặng chính là bug "lần save sau xoá việc trước" mà `version` sinh ra để chặn.

⚠️ **Nút *Lưu* phải khoá khi `status === "saving"`**, và `beforeunload` phải cảnh báo khi `status === "conflict"` — dữ liệu đang ở trạng thái không chắc chắn.

---

## §4 — `generation`: server là nguồn sự thật

`relationship-form.tsx:190-219` hiện **tự tính lại `generation`**:

- `PARENT` → tăng `gen + 1`
- `SPOUSE` → **dịch cả subtree** theo một delta

Và `family-member-form.tsx:303-321` còn **cho người dùng tự nhập số thế hệ**. Cả hai phải bỏ (Q6, D10):

| Hiện tại | Sau |
|---|---|
| Input "Thế hệ" (`:303-321`) | **Xoá hẳn** khỏi form |
| `relationship-form.tsx:190-219` | Chuyển sang `derive.ts` thành `computeGenerations()` — **chỉ để vẽ** |
| `generation` trong DTO gửi đi | Không bao giờ gửi (bất biến **F2**) |

⚠️ **Sự thật khó chịu cần nói thẳng**: vì quyết định Q4 giữ nút *Lưu* toàn cục, code dịch subtree **không biến mất** — nó chuyển từ "ghi vào payload" sang "tính để hiển thị". Đây là cái giá trung thực của việc giữ nút Lưu, và chính bất biến **F2** tồn tại để chặn ai đó vô tình đưa nó ngược lại vào payload.

⚠️ Server có thể **từ chối** bằng `409` khi client gửi `generation` lệch (backend `02` §2). FE không gửi thì không bao giờ dính, nhưng nếu sau này thêm "gợi ý" client thì phải nhớ luật này.

---

## §5 — Quan hệ: gửi 1 chiều, đọc 2 chiều

**Hiện trạng — đã xác minh là bug hiển thị thật, không phải dư thừa:**

- Client **gửi 1 chiều**: `relationship-form.tsx:228` push `[...draft.relationships, values]`
- UI **đọc cả 2 chiều**: `group-content.tsx:207` (`r.toMemberId === id`) và `:331` (`r.fromMemberId === id`)
- Server tạo **đúng** những gì client gửi, không bao giờ sinh chiều ngược (`family.service.ts:130-148`)

⇒ Cặp cha–con hiện chỉ vẽ đúng **một phía**. Không có validation nào phát hiện.

**Sau (Q7):**

| Tầng | Hành vi |
|---|---|
| Gửi đi | 1 chiều, server tự sinh chiều ngược (backend D9) |
| Đọc | Vẫn 2 chiều — **tầng hiển thị cần cả hai** để vẽ đúng |
| Sinh chiều ngược | `derive.ts` → `materializeRelationships(rels)`, **chỉ để hiển thị**, không gửi |

⚠️ **`CHILD` không bao giờ được UI tạo ra** — `relationship-form.tsx:343-357` chỉ cho chọn `PARENT` và `SPOUSE`. Đây chính là lý do tầng đọc 2 chiều là bắt buộc: nếu chỉ đọc `PARENT` thì con sẽ biến mất. Giữ nguyên 3 giá trị enum.

⚠️ **`SPOUSE` là cặp không thứ tự** (backend D9): client gửi `from` = chồng, `to` = vợ theo quy ước giới tính trên UI, nhưng tầng lưu trữ sắp 2 id trước. `materializeRelationships` phải **giữ nguyên** cả 2 hướng đọc và không tự suy ra chồng/vợ từ hướng — phải suy từ `gender` của 2 người (đó là lý do backend không ghi giới tính vào quan hệ).

---

## §6 — `isLeader` → `MEMBER_ROLE.OWNER`, và nối 2 nút chết

Sau `FE-B3`, hai drawer phải đổi nguồn sự thật. `canManage` ở `group-content.tsx:477-481` **đã đúng** (`OWNER || EDITOR`) — chỉ cần dùng nó.

| Vị trí | Hiện tại | Sau |
|---|---|---|
| `family-info-drawer.tsx:44` | `amILeader` từ `m.isLeader` | `amIOwner` từ `m.role === MEMBER_ROLE.OWNER` |
| `:171` | icon `IoMdKey` khi `isLeader` | icon khi `role === OWNER` |
| `:189-203` | *Xóa khỏi nhóm* khi `amILeader && !item.isLeader` | `amIOwner && item.id !== me && item.role !== OWNER` |
| `family-setting-drawer.tsx:50` | `amILeader` | `amIOwner` |

### 2 nút chết phải nối

| Nút | Vị trí | Hiện tại | Sau |
|---|---|---|---|
| *Đổi vai trò* | `family-info-drawer.tsx:212-224` | Render **không có `onClick`** | Nối `UpdateGroupMemberRoleAction` (`PATCH /group-member/:groupId`) |
| *Cài đặt nhóm* | `family-setting-drawer.tsx:126-134` | **Section rỗng** | Dựng UI chuyển quyền sở hữu |

⚠️ **Chuyển quyền sở hữu** dùng `PATCH /group-family/:groupId/transfer-ownership` (backend `04` bước **2.9**, nguồn `03` §2) — **không phải** `changeLeader` đang xoá ở `FE-B6`.

✅ **Đã chốt 2026-09-27** (backend `06` R2.4): endpoint **nhận `memberId` bắt buộc**; người nhận thừa kế `EDITOR`, không có `EDITOR` thì fallback `VIEWER`; **OWNER cũ còn `EDITOR`, không bị kick**. → UI cần 1 bước chọn người nhận trước khi gọi, và **không** được hiển thị "bạn sẽ mất quyền" như `changeLeader` cũ.

⚠️ Backend giữ `PATCH /group-member/:groupId` nhưng chỉ cho đổi **EDITOR ↔ VIEWER** (backend `02` §3). Nên UI phải **không** hiện lựa chọn lên `OWNER` — hiện trừ OWNER ra là chưa đủ, phải cả chặn chọn.

⚠️ Chuyển quyền sở hữu phải cảnh báo rõ: sau đó người nhận có quyền xoá nhóm và mất quyền sửa. Không dùng dialog mặc định.

### `02` backend §3: `DELETE /group-family/:groupId` phải OWNER-only

Hiện `group-family.service.ts:199` **không phân biệt vai trò** — cả EDITOR lẫn VIEWER đều xoá được nhóm. `family-setting-drawer.tsx:145` chỉ ẩn nút, nghĩa là bất kỳ ai cũng gọi được endpoint. Đây là ví dụ điển hình của bất biến **I2** phía backend: UI che nút không phải authz.

### `pinnedMemberId` → gán ảnh cho node (Q14, đảo ngược `FE-B4`)

Bản nháp trước chuyển `pinnedMemberId` sang `localStorage` cùng cơ chế lớp phủ bố cục. **Sai theo cả hai đầu:**

| | Bản nháp cũ | Sau |
|---|---|---|
| Nơi lưu | `localStorage["ff:pin:{groupId}"]` | **Node trên server**, snapshot lúc pin |
| Vì sao | "ghim bản thân là lựa chọn cá nhân, không ai quan tâm" | Pin **gắn ảnh hồ sơ của tôi vào node** → là dữ liệu dùng chung |
| Kết quả nếu giữ cũ | Không ai tìm được node "của mình" sau khi đổi thiết bị, và **không ai gán được ảnh vào cây người khác** | Mỗi người tự gán ảnh mình; OWNER/EDITOR gán tay được ảnh khác |

**Luồng sau `§6` (nối vào pin hiện có):**

```ts
// family-member-form.tsx — handlePin (đã có, :93-125)
const res = await pinMemberAction({ groupId, memberId, pinned: true });
// → payload thêm photoId = avatar hiện tại của tôi
// → server ghi { pinnedMemberId, photoId } vào node, chụp tại thời điểm này
```

⚠️ **Phải chụp ảnh lúc pin, không đọc động khi render.** Nếu node chỉ lưu `pinnedMemberId` rồi render thì đọc `avatarUrl` của tài khoản đó mỗi lần vẽ → người A đổi ảnh hồ sơ của mình sẽ **tự đổi ảnh node trong cây của người B**. Đó là đường lách quyền *"không ai sửa được ảnh của người khác"*. → phải có cột `photoId` trên node, ghi 1 lần lúc pin, không bao giờ cập nhật theo.

⚠️ **Chủ pin chỉ gán được ảnh của chính mình.** Backend phải so `pinnedMemberId === me` thì mới cho đường này. Đường gán tay ảnh người khác là endpoint khác, cấp quyền `edit` — xem `03` §4 và `be/03` §3.

---

## §7 — Bố cục: 1 tầng, chỉ trên server (Q8, Q9)

### Quyết định

**Không còn tầng bố cục cá nhân.** Toàn bộ `localStorage["ff:layout:*"]`, version guard, và thông báo hết hạn bị xoá.

| Tính năng | Hành vi |
|---|---|
| Kéo thả tay | Chỉ tồn tại trong **RAM của phiên**. Không ghi `localStorage`, không ghi server |
| F5 / đóng tab | **Mất bố cục tay.** Không hỏi, không cảnh báo, không khôi phục |
| Bấm *Sắp xếp* | OWNER/EDITOR: tự arrange từ đầu, ghi `positionX/Y` qua `LAYOUT_SAVE` |
| Bấm *Lưu* | OWNER/EDITOR: ghi thay đổi dữ liệu **+** tự arrange + `LAYOUT_SAVE`, tất cả trong 1 lần bấm |

⚠️ **Đây là hệ quả trực tiếp của Q16.** Khi app là 1 người 1 cây, "bố cục riêng của bạn" không còn lý do tồn tại: không có nhóm khác để bố cục riêng nào chồng lên. Giữ tầng phủ sẽ tạo ra đúng cái bài toán *"lớp phủ của A che vĩnh viễn bố cục mới của B"* mà bản nháp trước phải thêm cả cơ chế version guard để tránh.

### Hành vi theo vai trò (Q9)

| | VIEWER | EDITOR / OWNER |
|---|---|---|
| Xem cây, pan, zoom | ✅ | ✅ |
| Kéo thả tay | ❌ **ẩn** | ✅ (chỉ trong phiên) |
| Nút *Sắp xếp* | ❌ ẩn | ✅ tự arrange + `LAYOUT_SAVE` |
| Nút *Lưu* | ❌ ẩn | ✅ ghi thay đổi + tự arrange + `LAYOUT_SAVE` |

⚠️ **VIEWER mất hẳn khả năng kéo.** Bản nháp trước cho VIEWER kéo tay và gọi đó là "thứ duy nhất họ làm được" — điều đó chỉ đúng khi còn tầng cá nhân. Không còn tầng đó thì kéo tay chỉ là sắp xếp vô nghĩa trên máy mình rồi mất, nên **không cho**. VIEWER chỉ xem và di chuyển tầm nhìn.

⚠️ **Không còn băng chuyền "bố cục riêng"** — mục `03` §11 bị xoá khỏi phạm vi. Không còn gì để cảnh báo.

⚠️ **`onNodeDragStop` (`group-content.tsx:406-416`)** hiện ghi `positionX/Y` **vào bản ghi member**. Đổi thành ghi vào state phiên (`useState` trong provider, không qua store, không qua `localStorage`). **Không debounce** — không ghi server nên không cần, và thêm debounce chỉ tạo cảm giác lag.

### Còn lại từ R1.4

`LAYOUT_SAVE` **vẫn là operation bắt buộc** trong batch endpoint, và **vẫn phải bump `version` + ghi `ActivityLog`** — nhưng lý do đã đổi hoàn toàn:

| | Lý do cũ (bản nháp trước) | Lý do mới |
|---|---|---|
| Vì sao `LAYOUT_SAVE` phải bump `version` | Để lớp phủ `localStorage` hết hạn đúng lúc | Theo bất biến **I4** + **I5**: mọi mutation phải bump `version` trong cùng `$transaction` và ghi log. Bố cục là mutation thật, không có ngoại lệ |
| Action type | `FAMILY_LAYOUT_CHANGED` | Giữ nguyên — cần cho màn hình lịch sử ("Bạn Tuấn vừa sắp xếp lại cây") |

Nếu bỏ `LAYOUT_SAVE` khỏi batch và ghi position bằng N request lẻ thì mỗi lần bấm *Lưu* lại phá vỡ I4/I5 y hệt trường hợp CRUD lẻ. Xem `be/06` R1.4.

---

## §8 — `/api` → `/api/v1` (Q: sau backend bước 2.13)

Backend thêm global version prefix. **60+ URL** trong `api-client.lib.ts` đều bắt đầu bằng `/api`. Sửa tay từng dòng là cách chắc chắn sót.

```ts
// api-client.lib.ts
export const API_PREFIX = "/api/v1";

auth: {
  me: { url: `${API_PREFIX}/auth/me`, method: "GET" as HttpMethod },
  ...
}
```

⚠️ **Bất biến F3**: mọi URL phải dựng từ `API_PREFIX`. Lý do cụ thể: một chữ gõ sai trong 60 URL không lộ ra lúc build, chỉ lộ **runtime 404** trên màn hình của người dùng. Không có type nào bắt được.

⚠️ `proxy.ts` cũng gọi `apiClient` — nó sẽ đổi theo, **nhưng** `publicRoutes` chứa 4 entry `/api/auth/*` phải đổi cùng (xem `FE-B10`; sau đó xoá hẳn).

⚠️ Đổi prefix phải **cùng lúc** với deploy backend. Không tuần tự: FE đổi trước thì toàn bộ app 404; backend đổi trước thì toàn bộ app 401. Nên để ở stage 3, ngay sau khi backend phase 2 lên production.

---

## §9 — 3 layout gần trùng nhau → 1

`admin/layout.tsx` (32 dòng), `user/layout.tsx` (36), `group/layout.tsx` (39) — cùng một khung: `SidebarProvider` → `Sidebar` → `Separator` → header → `SidebarInset`, chỉ khác nhãn header và `--sidebar-width`.

Sau `FE-B2` còn lại 2. Gộp thành `<ShellSidebarLayout sidebar={...} title="..." width="...">`.

⚠️ Cả hai đều `force-dynamic` — giữ nguyên, vì cả hai đọc session từ cookie qua `apiRequest` (header `x-access-token` do `proxy.ts` tiêm, xem `http.client.ts:73-84`).

---

## §10 — `/` và `/group` không có `groupId` phải redirect, không in text lỗi

**`/`** (`(public)/page.tsx`): sau `FE-B8` thành landing marketing không còn ý nghĩa. Theo Q11 + Q16, chỉ còn **2 nhánh**:

```
0 group  → màn tạo group (kèm lựa chọn tạo link mời)
1 group  → redirect thẳng /group?groupId=...
```

⚠️ **Không còn nhánh `≥2 group`** — vi phạm Q16. Và cũng không cần hỏi "bạn muốn vào cây nào" vì luôn có đúng 1.

**`/group?groupId=`** (`group-content-wrapper.tsx:48`): hiện render thẳng text *"Vui lòng chọn một gia đình."* hoặc *"Lỗi: …"* inline. Một màn hình trắng có câu text lỗi là ngõ cụt. Phải `redirect()` thay vì render text.

⚠️ Phân biệt **3 trường hợp** — nhưng **bỏ nhánh "thiếu `groupId` → chọn gia đình"**, vì không còn khái niệm chọn:

| Tình huống | Xử lý |
|---|---|
| Thiếu `groupId` | `redirect('/')` — về redirector, nơi duy nhất biết tình trạng group của tôi |
| `groupId` sai / không thuộc nhóm tôi | 404 + nút quay lại |
| Lỗi mạng / backend | Thông báo lỗi + nút thử lại |

Gộp cả 3 thành "Lỗi" là mất thông tin — nhưng giữ nhánh "thiếu `groupId` → chọn gia đình" cũng là ngõ cụt, vì màn đó bị xoá ở `01` **FE-B11**.

⚠️ `group/page.tsx` là `"use server"` — `redirect()` dùng được, nhưng `redirect()` **ném exception**, nên phải gọi ngoài `try/catch` (nuốt mất nó sẽ render trang sai).

---

## §11 — `isDirty` tốn O(n) mỗi render

Không tách khỏi `§1` về mặt nội dung, nhưng đáng nói riêng vì nó là **bug hiệu năng đang tồn tại**, không phải hệ quả của refactor:

`lodash.isequal` chạy **3 lần mỗi render**:
1. `familyThunk.ts:15` — trong thunk, mỗi lần dispatch
2. `panel-editor.tsx:157` — quyết định `disabled` của nút *Lưu*
3. `group-content.tsx:456-474` — trong `beforeunload`

Cây 300 người = hàng nghìn object so sánh sâu, lặp lại liên tục khi kéo chuột trên canvas. Sau `§1` cả 3 thành O(1). Nên ghi vào PR như **sửa hiệu năng có sẵn**, không giấu trong refactor.

---

## §12 — Tách `getLayoutedElements` ra khỏi component

`group-content.tsx` dài **577 dòng**, trong đó `getLayoutedElements` (`:183-384`) là **~200 dòng thuần tuý** — không đụng React, không đụng DOM. Nó có **0 test**.

Tách sang `src/lib/family/layout.ts` cùng các hằng số `NODE_WIDTH 150`, `NODE_HEIGHT 50`, `SPOUSE_GAP 24`, `SIBLING_GAP 40`, `RANK_SEP 160`, và các helper `getSpouseOf`, `getChildrenOf`, `sortChildren`, `measureSubtree`, `layoutSubtree`, `hasParent`.

⚠️ `getChildrenOf` (`:204-215`) **đọc cả 2 chiều** — đây là chỗ nhạy cảm nhất về hành vi, và cũng là bằng chứng cụ thể cho `§5`. Tách ra kèm test là cách giữ chức năng đó có kiểm chứng.

⚠️ `sortChildren` (`:220-234`) thứ tự là **ngày sinh → giới tính → tên**. Đổi thứ tự sẽ đổi bố cục cây mà không có ai hiểu vì sao.

---

## §13 — 3 enum đổi **hình dạng**, không chỉ mất giá trị

Cẩn thận: khác với `USER_ROLE`/`BLOG_MEDIA_TYPE` (xoá hẳn ở `01`), 3 enum sau **đổi cấu trúc** nên phải sửa chứ không xoá:

| Enum | Hiện tại | Sau | Ảnh hưởng FE |
|---|---|---|---|
| `ACTION_TYPE` | `{ UPDATE, DELETE, NEW }` | **15** giá trị chi tiết — bảng chuẩn ở backend `03` §10 (đã chốt 2026-09-27) | Màn hình lịch sử thay đổi (`03` §1) phải map **từng giá trị** sang nhãn tiếng Việt + icon |
| `TARGET_TYPE` | `{ ALBUM, FAMILY, EVENT_FAMILY, EVENT_SELF, USER }` | `{ FAMILY, MEMBER, RELATIONSHIP, ALBUM, PHOTO, EVENT, GROUP }` | Bộ lọc trong lịch sử thay đổi |
| `NOTIFICATION_TYPE` | `{ NEW, UPDATE, DELETE, OTHER }` | **bỏ hẳn**, thay bằng cột `entityType` + `entityId` | Thông báo phải hiển thị *cái gì* thay đổi, không hiển thị "NEW" |

⚠️ `NOTIFICATION_TYPE` không có bản thay thế trực tiếp → phải sửa mọi chỗ đang hiển thị nó **cùng lúc** với việc đọc `entityType`/`entityId`, nếu không sẽ hiện `undefined`.

⚠️ Nên để một bảng ánh xạ tập trung (`src/lib/family/labels.ts`) thay vì rải `switch` — **15 action type × 7 target type là 105 chỗ** dễ quên, và người dùng sẽ thấy `MEMBER_CREATED_RAW`.

⚠️ Vì con số này **lớn hơn nhiều** so với ước lượng ban đầu, `labels.ts` nên sinh từ **2 mảng hằng** (`ACTION_TYPES`, `TARGET_TYPES`) chứ không viết tay 105 dòng — nếu không, chính bảng "tiện lợi" đó sẽ là nơi sai tiếp theo.

---

## §14 — 2 lỗi sẵn có phải sửa luôn

| Lỗi | Vị trí | Vì sao phải sửa trong đợt này |
|---|---|---|
| `useRouter()` gọi **bên trong `catch`** của hàm async không phải component | `panel-editor.tsx:74` | Vi phạm rules-of-hooks. Chỉ sống sót vì nhánh lỗi hiếm khi chạy. Khi `§3` làm lại luồng lỗi 409 thì nhánh này sẽ chạy thường xuyên → lộ ngay |
| `/403` không có trang | `proxy.ts:136` | Sau `FE-B2` không còn ai redirect tới, xoá luôn entry nếu có. Nhưng nếu giữ bất kỳ nhánh RBAC nào thì phải có trang thật |

---

## §15 — Phân quyền: 2 trục độc lập, không phải 1 thang

Quyết định lớn nhất của đợt này, và là chỗ dễ làm sai nhất khi code.

### Sai lầm mặc định

Mọi hệ thống RBAC đều dễ khiến người ta nghĩ *"vai cao hơn = quyền nhiều hơn trên mọi thứ"*. Ở đây **sai**, vì dữ liệu thuộc 2 loại khác nhau về bản chất:

- **Dữ liệu cây** (thành viên, quan hệ, tên, bố cục) là **sự thật dùng chung**. Sửa sai nó làm sai thông tin của cả nhà. → phải cần người chịu trách nhiệm, tức OWNER/EDITOR.
- **Media** (ảnh, album) là **sự thật của người up**. Người up quyết định cái đó có ở nhà hay không, sửa thành gì. → vai trò không liên quan, chỉ quan trọng **ai là chủ**.

Hệ quả trực tiếp, và có chủ ý: **EDITOR sửa được mọi thứ trong cây nhưng không xoá được ảnh của người khác.**

### Trục 1 — Dữ liệu cây: đặc quyền theo vai

| | OWNER | EDITOR | VIEWER |
|---|---|---|---|
| Thành viên (thêm / sửa / xoá) | ✅ | ✅ | ❌ |
| Quan hệ (thêm / sửa / xoá) | ✅ | ✅ | ❌ |
| Tên / kiểu gia đình | ✅ | ✅ | ❌ |
| Gán ảnh cho node (tay, của người khác) | ✅ | ✅ | ❌ |
| Bố cục chung — *Sắp xếp* / *Lưu* | ✅ | ✅ | ❌ |
| Lịch sử thay đổi — dòng `MEMBER`/`RELATIONSHIP`/`FAMILY`/`GROUP` | ✅ | ✅ | ❌ |
| Import / export / xuất ảnh cây | ✅ | ✅ | ❌ |
| Đổi vai trò người khác | ✅ | ❌ | ❌ |
| Bàn giao quyền sở hữu | ✅ | ❌ | ❌ |

### Trục 2 — Media: theo chủ sở hữu, không theo vai

| | Chủ media | Khác phần EDITOR | Khác phần VIEWER | group OWNER (không phải chủ) |
|---|---|---|---|---|
| Xem media đang hiện | ✅ | ✅ | ✅ | ✅ |
| Thêm media | ✅ | ✅ | ✅ | ✅ |
| Sửa / xoá / ẩn / khôi phục media | ✅ | ❌ | ❌ | ✅ |
| Xem media **đã ẩn** của người khác | ❌ | ❌ | ❌ | ✅ |
| Mở ẩn media của người khác | ❌ | ❌ | ❌ | ✅ |
| Xem thùng rác **của mình** | ✅ | ✅ | ✅ | ✅ |
| Xem thùng rác của người khác | ❌ | ❌ | ❌ | ✅ |

⚠️ **`thùng rác` không dùng chung.** Mỗi người thấy cái của mình. Không có "toàn bộ thùng rác của nhà" trừ khi bạn là group OWNER — và ngay cả OWNER cũng thấy 2 tab: *của tôi* + *của người khác*, không trộn vào nhau.

⚠️ **Ẩn là riêng tư, trừ OWNER.** `hiddenById` chỉ giữ **1 người** (người ẩn), không phải danh sách. Nghĩa là: người B ẩn ảnh của C thì **OWNER vẫn thấy** — vì OWNER đã có quyền chủ động thay đổi trạng thái bất kỳ media nào. Đây là hệ quả có chủ ý, không phải sơ suất.

⚠️ **Ảnh hồ sơ (avatar) KHÔNG đi theo luật media.** Chủ avatar là chính người đó (Q14), và việc gán avatar lên node là việc của cây, quyền `edit`. Trộn 2 luật này sẽ ra nghịch lý: tôi không xoá được ảnh tôi up nhưng lại không sửa được ảnh hồ sơ của tôi.

### 3 hệ quả kỹ thuật bắt buộc

| # | Hệ quả | Vì sao |
|---|---|---|
| 1 | `hiddenById` là **userId đơn**, không phải mảng/danh sách. "Ẩn riêng cho tôi ở 3 thiết bị" cần bảng riêng — mô hình này không cần nên **không làm** | Giữ đúng 1 giá trị ⇒ filter được bằng index, không cần join |
| 2 | Bộ lọc phải nằm ở **tầng service**, không ở controller | `WHERE deletedAt IS NULL AND (hiddenById = me OR tôi là group OWNER)` — nếu để ở controller thì mỗi endpoint phải nhớ lặp, và lỡ 1 chỗ là lộ media đã ẩn. Đây là biến thể của bất biến **I1** |
| 3 | Ẩn / mở ẩn phải ghi `ActivityLog` với `PHOTO_HIDDEN` / `PHOTO_UNHIDDEN` | Người bị ẩn **không hề hay biết** mình bị ẩn. Không có log thì không có cách trả lời khiếu nại *"sao ảnh tôi biến mất"*. Xem `be/06` R2.1 |

⚠️ **Nếu chỉ muốn làm đúng một việc trong `§15` thì làm #2.** Bộ lọc sai tầng là lỗi rò dữ liệu, không phải lỗi UX.

---

## Bảng kiểm tra §1–§15

```bash
pnpm typecheck && pnpm lint && pnpm test
grep -rn "localId" src/                       # phải còn ≤ 1 chỗ: tên ref nội bộ, không có trong payload
grep -rn "syncFamily\|SyncFamilyDtoSchema\|SyncFamilyAction" src/    # 0
grep -rn "'/api/" src/                       # 0 — phải qua API_PREFIX
grep -rn "isLeader\|USER_ROLE" src/           # 0
grep -rn "ff:layout\|ff:pin" src/             # 0 — Q8 xoá hết tầng localStorage (§7)
grep -rn "generation" src/                    # chỉ còn trong derive.ts, không trong DTO
```

⚠️ **`pinnedMemberId` KHÔNG nằm trong danh sách grep này** — nó được giữ lại (`FE-B4` + `§6`).

Test bắt buộc của `§1`–`§3`:
- `buildTree` — thành viên tạo/sửa/xoá hiển thị đúng
- `buildOperations` — **không bao giờ** có `clientRef` trong `MEMBER_UPDATE.id` (F1), **không bao giờ** có `generation` hay quan hệ chiều ngược (F2)
- 409 → UI vào `status: "conflict"`, **không** retry tự động, `origin` được cập nhật
- bố cục 1 tầng: kéo tay rồi F5 → về đúng bố cục server, **không** có bất kỳ dữ liệu `localStorage` nào được đọc lại
- VIEWER: không thấy nút *Lưu* / *Sắp xếp*, không kéo được node
