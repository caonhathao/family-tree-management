# 06 — Bổ sung từ khảo sát frontend

> Trạng thái: **đề xuất, chưa ai code**.
> Ngày: 2026-09-27 · Nguồn: [khảo sát frontend](../planing-refactor-fe/README.md).
> File này **không thay thế** `01`–`05`. Nó chỉ ghi những mục khảo sát frontend phát hiện ra là kế hoạch backend hiện tại **thiếu hoặc chưa đủ chi tiết**.
>
> Ưu tiên: **R1** (batch endpoint) và **R2** (action type + cursor pagination) là hai mục **chặn tiến độ frontend**. Cần trả lời bằng văn bản trước khi frontend vào stage 3.

---

## Vì sao cần file này

Kế hoạch backend được chốt trước khảo sát frontend. Frontend quyết định **giữ nút *Lưu* toàn cục** (quyết định Q4), điều mà kế hoạch backend không tính tới. Hệ quả là bước 2.2 trong `04-thu-tu-thuc-hien.md` — chỉ liệt kê CRUD từng người — **không đủ**.

> **✅ Đã chốt 2026-09-27.** `/changes` được chấp nhận, là **đường ghi chính**. D6 trong `README.md` đã sửa theo (từ *Hybrid — CRUD lẻ là đường chính* → *Batch-first*). Bước 2.2 trong `04` giữ nguyên là CRUD lẻ nhưng đã ghi rõ là **API cấp thấp**; `/changes` là **bước 2.2b**. Xem "Câu hỏi đã trả lời" ở cuối file.

---

## R1 — `POST /api/v1/family/:groupId/changes` (batch)

**Mức độ: chặn stage 3. Đây là thứ quan trọng nhất của file này.**

### Vấn đề

Bước 2.2 của `04-thu-tu-thuc-hien.md` liệt kê:

```
POST   /family/:groupId/members
PATCH  /family/:groupId/members/:memberId
DELETE /family/:groupId/members/:memberId
POST   /family/:groupId/relationships
PATCH  /family/:groupId/relationships/:relationshipId
DELETE /family/:groupId/relationships/:relationshipId
```

Frontend giữ một nút *Lưu* toàn cục, nên một lần bấm *Lưu* = **N request**. Với `If-Match` (bước 2.2) thì:

```
POST members/a       → 200, đã commit
POST members/b       → 200, đã commit
POST relationships/c → 409 (version lệch)
→ a và b đã ghi, c không. Người dùng không biết đã lưu được gì.
```

Đây không chỉ là xử lý lỗi ở UI. Nó **phá trực tiếp I4 và I5**:

- **I4** — `version++` phải trong cùng `$transaction` với mutation. Nhiều transaction thì `version` không còn ý nghĩa làm optimistic lock.
- **I5** — `ActivityLog` phải ghi trong cùng `$transaction`. Request 3 rollback thì log của request 1-2 là log của một trạng thái đã không tồn tại.

Nói cách khác: **lưu bằng N request lẻ là lưu không nguyên tử, và vi phạm đúng 2 bất biến mà bước 2.2 tạo ra.**

### Đề xuất

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
      { "type": "RELATIONSHIP_UPDATE", "id": "...", "data": { "type": "..." } },
      { "type": "RELATIONSHIP_DELETE", "id": "..." },
      { "type": "FAMILY_UPDATE",       "data": { ... } },
      { "type": "LAYOUT_SAVE",         "data": { "positions": [{ "id": "...", "x": 0, "y": 0 }] } }
    ]
  }

200 → {
  "version": 43,
  "tree": { ... },                          // trạng thái sau khi áp dụng; với LAYOUT_SAVE,
                                           // positionX/Y là BẢN ĐÃ AUTO-ARRANGE, không phải bản client gửi
  "idMap": { "r1": "uuid-thật", ... },      // clientRef → id, để re-key cây
  "activityIds": ["..."]                    // các dòng log vừa ghi
}

409 → {
  "currentVersion": 44,
  "conflicts": [
    { "opIndex": 2, "memberId": "...", "reason": "STALE_VERSION" }
  ],
  "tree": { ... }                           // trạng thái server hiện tại, để client merge
}
```

### Yêu cầu chi tiết

| # | Yêu cầu | Vì sao |
|---|---------|--------|
| R1.1 | **Mức quyền `edit` (EDITOR+), không phải `manage` (OWNER)** | Frontend hiện đã dùng `canManage = OWNER \|\| EDITOR` cho cả hai nút *Lưu* và *Sắp xếp*. Nếu endpoint siết OWNER-only thì EDITOR bấm *Lưu* rồi nhận 403 |
| R1.2 | **Một `$transaction` duy nhất**: áp dụng hết operations → `version++` **đúng 1 lần** → ghi hết `ActivityLog` | I4 + I5. Đây là toàn bộ lý do tồn tại của endpoint |
| R1.3 | **`RELATIONSHIP_CREATE` nhận `fromRef`/`toRef` là ref phía client**, không phải `id` | Thành viên tạo trong cùng batch chưa có `id` thật. Server phải có bảng map trong `$transaction` để resolve. **Phải từ chối** ref không resolve được — không được âm thầm bỏ qua |
| R1.4 | **`LAYOUT_SAVE` bump `version` và ghi `ActivityLog`** với action type `FAMILY_LAYOUT_CHANGED` | Xem bên dưới. ✅ **Đã chốt** — xem mục kế tiếp |
| R1.5 | **`idMap` trả về đủ** cho `MEMBER_CREATE` và `RELATIONSHIP_CREATE` | Client cần re-key cây sau khi lưu. Thiếu nó thì cây hiển thị lệch id so với server |
| R1.6 | **`baseUpdatedAt` trên `MEMBER_UPDATE`** | `version` chỉ bắt xung đột **cả cây**. `updatedAt` bắt xung đột **1 dòng** — cần thiết để biết chính xác dòng nào xung đột khi trả 409 |
| R1.7 | **`409` phải kèm trạng thái server hiện tại** trong body | Không có dữ liệu để merge thì UI chỉ còn lựa chọn bỏ thay đổi của mình — tệ hơn hẳn so với hiện trạng |
| R1.8 | **`MEMBER_UPDATE` / `MEMBER_DELETE` phải scope `groupFamilyId` trong cùng `where`** | I1. Ranh giới được nêu ở `05` backend §"Ranh giới hợp lệ": ref tới thứ **chưa tồn tại** thì được (`fromRef`); id của thứ **đã tồn tại** thì phải scope group |
| R1.9 | ✅ **Đã chốt:** các route CRUD lẻ ở `03` §1 **giữ nguyên**, coi như API cấp thấp | Frontend sẽ chỉ dùng `/changes`. Nhưng chúng vẫn cần cho script/CLI và cho e2e test. Xoá thì mất mà không đổi được gì |

### R1.4 — Vì sao `LAYOUT_SAVE` phải bump `version`

Frontend quyết định bố cục 2 tầng (Q8):

| Tầng | Lưu ở đâu | Ghi khi nào |
|---|---|---|
| Cá nhân | `localStorage` phía client | khi kéo thả tay |
| Dùng chung | `FamilyMember.positionX/Y` | **chỉ** khi bấm *Sắp xếp* hoặc *Lưu* — cả hai đều tự arrange trước khi ghi |

Client ràng lớp phủ `localStorage` theo `version` để nó **tự hết hạn**:

```ts
localStorage["ff:layout:{groupId}"] = {
  version: <Family.version lúc kéo>,
  positions: { ... },
};
// load: version khớp → dùng; lệch → xoá lớp phủ, dùng bố cục server
```

Nếu *Sắp xếp* ghi `position` mà **không bump `version`**, thì lớp phủ của mọi người không bao giờ hết hạn:

> A kéo tay → lưu riêng. B bấm *Sắp xếp* → server đổi bố cục chung. A F5 → lớp phủ của A vẫn khớp version → **A không bao giờ thấy bố cục mới của B**, và bị che vĩnh viễn.

Nên `LAYOUT_SAVE` là một mutation thật, và theo I4/I5 phải bump + ghi log. Action type đề xuất: `FAMILY_LAYOUT_CHANGED` (xem R2.1).

#### Hợp đồng `LAYOUT_SAVE` — ✅ đã chốt 2026-09-27

Client **có** gửi tọa độ, nhưng **server tidy trước khi ghi**, và response trả lại bản đã sắp:

```
{ "type": "LAYOUT_SAVE", "data": { "positions": [{ "id": "...", "x": 0, "y": 0 }, ...] } }
→ 200: { version, tree, idMap, activityIds }
        tree.positionX/Y  =  BẢN ĐÃ AUTO-ARRANGE
```

Client vẽ lại từ `tree` trả về → người dùng thấy **bố cục đã sắp xếp**, không phải bản thô họ vừa kéo. Xoá lớp phủ `localStorage` sau khi lưu là **đúng** — người dùng vừa chủ động publish lên cây chung.

Hai nút dùng chung 1 endpoint, khác ở payload:

| Nút | Gửi lên | `version` |
|---|---|---|
| *Lưu* (toàn cục) | `[MEMBER_UPDATE ×N, RELATIONSHIP_*, LAYOUT_SAVE]` — `LAYOUT_SAVE.positions` = **bản kéo hiện tại** | +1 |
| *Sắp xếp* | `[LAYOUT_SAVE]` với `positions: []` → server tự tính từ đầu, **bỏ qua** mọi kéo tay | +1 |

❌ **Không có nút thứ 3.** Bản cũ của file này liệt kê thêm *Lưu bố cục* (`fe/03` §11) — đã bỏ 2026-09-27: nó là **tập con** của *Lưu*, không có năng lực nào mà *Lưu* không làm được, và tách riêng chỉ tạo thêm 1 lần bump `version` vô nghĩa. Vì vậy băng chuyền `fe/03` §11 chỉ còn nút *Xem bố cục chung* (0 request) — client thuần, không chạm endpoint.

**Vì sao không tách endpoint riêng cho layout:** nếu có `PATCH /family/:groupId/layout`, bấm *Lưu* (kèm cả bố cục) thành **2 request = 2 transaction = 2 lần bump `version`**. Nếu layout fail sau khi data đã ghi thì cây và bố cục lệch nhau. I4 bắt buộc mọi mutation bump version trong *cùng* một `$transaction` — 2 request không bao giờ nằm trong cùng 1 transaction.

**Hệ quả chấp nhận được — mô hình 1 lưu = 1 `version`, không có ngoại lệ:**

- Mỗi lần bấm *Lưu* hoặc *Sắp xếp* → `version +1`, không lần nào bump "nửa" hay bỏ qua.
- **Chưa lưu = không tồn tại.** Đang kéo mà không bấm *Lưu* → thay đổi mất. Không cứu, không hỏi, không cảnh báo trước, không giữ để lần sau.
- Lớp phủ `localStorage` **không phải tài sản** — nó là thứ *chưa lưu*. Vì mỗi lần bump làm lớp phủ của *mọi* người lệch `version` nên nó tự xoá; với mô hình 1 OWNER + 1 EDITOR thì đây không phải rủi ro thực tế. Thông báo sau khi mất đã có ở `fe/03` §11.
- Không cần cảnh báo trước, không cần polling `version`, không cần `layoutKey`/checksum. `version` là con số duy nhất quyết định lớp phủ còn hiệu lực.

---

## R2 — Bổ sung vào `02`/`03`/`04` backend

### R2.1 — `ACTION_TYPE` — ✅ đã chốt 2026-09-27: **15 giá trị**

Con số **11** ở các bản trước của file này (và ở `02` §6, `fe/02` §13) là **sai**. Bảng "action phải ghi" trong `03` §10 thực tế liệt kê **13** giá trị phân biệt, và danh sách "8 mục mở rộng" ở `02` §6 là một danh sách **khác hẳn** — nó thiếu `MEMBER_CREATED`/`MEMBER_UPDATED`/`MEMBER_DELETED`/`RELATIONSHIP_*`/`FAMILY_UPDATED`, đồng thời thừa `MEMBER_GENERATION_RECOMPUTED`.

**Chốt: lấy bảng 13 mục của `03` §10 làm chuẩn, cộng 2 mục còn thiếu → 15.**

| Action type | Vì sao |
|---|---|
| `FAMILY_LAYOUT_CHANGED` | Bắt buộc cho R1.4. Không có nó thì nút *Sắp xếp* là đường lách duy nhất qua I4/I5 |
| `MEMBER_GENERATION_RECOMPUTED` | Đã được yêu cầu ở `02` §6 nhưng **thiếu** trong bảng `03` §10. Ghi khi BFS gặp chu trình: `generation = 0` + cảnh báo, không throw (D10) |

`MEMBER_PHOTO_CHANGED` (tuỳ chọn) — cho phép "anh Tuấn vừa đổi ảnh" trong lịch sử. **Chưa chốt**: nếu thấy thừa thì bỏ; nếu giữ thì tổng là **16**. Frontend nên coi đây là giá trị có thể xuất hiện và có nhãn dự phòng, không hard-code danh sách đóng.

13 giá trị gốc trong `03` §10: `MEMBER_CREATED`, `MEMBER_UPDATED`, `MEMBER_DELETED` (ghi **2 dòng** log nhưng là 1 enum value), `MEMBER_RESTORED`, `RELATIONSHIP_CREATED`, `RELATIONSHIP_DELETED`, `FAMILY_UPDATED`, `FAMILY_DELETED`, `FAMILY_IMPORTED`, `OWNERSHIP_TRANSFERRED`, `MEMBER_ROLE_CHANGED`, `MEMBER_JOINED`, `MEMBER_LEFT`.

Hệ quả bên frontend: bảng ánh xạ nhãn phải phủ **15 × 7 `TARGET_TYPE` = 105 chỗ**, không phải "11 × 7 = 18 chỗ" như `fe/02` §13 ghi. Thiếu nhãn sẽ hiện `MEMBER_CREATED_RAW` ra UI — đúng thứ `fe/02` §13 đã cảnh báo.

### R2.2 — `GET /family/:groupId/activity` phân trang bằng **cursor** — ✅ đã xác nhận 2026-09-27

`03` §10 đã ghi "paginated by cursor (`createdAt + id`, not offset)". Xác nhận đây là yêu cầu bắt buộc, không phải tuỳ chọn:

Offset pagination sẽ trùng hoặc mất dòng **ngay khi có ai đó vừa ghi log** — mà bảng này được ghi bởi *mọi* mutation, nên nó luôn đang lớn lên khi người dùng đang xem.

Cụ thể: người A đang xem trang 3 (`OFFSET 40 LIMIT 20`), người B thêm 3 thành viên, A bấm trang 4 → 3 dòng đầu bị lặp, 3 dòng cuối bị bỏ sót.

Contract đề xuất:

```
GET /family/:groupId/activity?limit=20&cursor=<createdAt|id>&action=&targetType=&from=&to=
200 → { items: [...], nextCursor: "..." | null }
```

### R2.3 — `Event.familyMemberId` — ✅ đã chốt 2026-09-27: **đủ cho (1), không đủ cho (2)**

`02` §6 thêm `Event.familyMemberId`. Frontend cần xác nhận đây là đủ cho cả 2 nhu cầu:

1. Gắn sự kiện vào một người (lễ cưới của ông nội) — **quan hệ 1–1** → 1 cột là đủ ✅
2. Danh sách khách mời sự kiện — **quan hệ nhiều–nhiều** → 1 cột **không đủ** ❌

**Trả lời: KHÔNG đủ cho cả 2.** Frontend đã ghi ở `fe/03` §10 rằng chỉ làm nếu backend có cột tương ứng, và **không** tự lưu vào `biography` hay ghi chú — đúng bất biến `F1` (dữ liệu phái sinh phải do server đặt tên và đặt schema).

**Quyết định: cắt nhu cầu (2) khỏi phạm vi đợt này. Không thêm bảng `EventParticipant`.**

| | |
|---|---|
| `Event.familyMemberId` (1 cột, P1) | **Giữ** — phục vụ `fe/03` §9, và là thứ làm cho module Events trở nên hữu ích với gia đình thật (sinh nhật, kỷ niệm, timeline cá nhân) |
| `fe/03` §10 (khách mời) | **Xoá khỏi phạm vi**, chuyển xuống P2 để sau |
| Bảng `EventParticipant` | **Không làm** lúc này. Khách mời là use case sự kiện lớn (cưỡi, tang), không phải lõi "quản lý gia đình cá nhân". Thêm bảng = +1 schema, +2 endpoint, +UI — tốn hơn giá trị lúc này |

Khi nào làm lại thì phải thêm bảng `EventParticipant` (`eventId` + `familyMemberId`, unique index) và **giữ nguyên** `Event.familyMemberId` cho khái niệm "sự kiện thuộc về người này" — hai ý nghĩa khác nhau, không nên dồn vào 1 cột.

### R2.4 — `PATCH /group-family/:groupId/transfer-ownership` — ✅ đã chốt 2026-09-27

`04` **bước 2.9** liệt kê endpoint. (Bản cũ của file này ghi nhầm `03` §2.9 — `03` §2 là MembershipService; endpoint nằm ở `04` bước 2.9.) Frontend cần biết trước:

| Câu hỏi | Trả lời |
|---|---|
| Endpoint có nhận `memberId` mới OWNER không, hay tự chọn theo luật D8? | **`memberId` là bắt buộc.** Luật D8 (OWNER rời group) là **đường nội bộ của MembershipService** — gọi cùng hàm service nhưng **không đi qua HTTP**. Endpoint này là bàn giao chủ động của người dùng, phải chỉ định rõ đang bàn giao cho ai; không để server tự chọn. UI khác nhau: chọn tay trong dropdown vs chỉ hiện thông báo "đã chuyển cho X" |
| Có thừa kế được `EDITOR` không? Hay chỉ `VIEWER`? | **Thừa kế `EDITOR`.** Nếu group không còn `EDITOR` nào thì mới xuống `VIEWER` (thành viên lâu năm nhất) — đúng luật D8. Bản cũ của file này ghi "chỉ `VIEWER`" là **sai**. Ảnh hưởng danh sách trong dropdown |
| OWNER cũ còn `EDITOR` hay bị kick? | **Còn `EDITOR`, không kick.** Bàn giao không phải là rời nhóm. Ảnh hưởng UI sau khi chuyển |

Vì sao "không kick" là quyết định đúng: nếu bàn giao xong mà OWNER cũ biến mất khỏi group, thì nhóm mất người hiểu ngữ cảnh gia đình nhất — thường là người nhập dữ liệu, là người biết quan hệ nào đúng. Kick cũng khiến người dùng ngại bàn giao.

⚠️ Vì `memberId` là bắt buộc nên **UI phải có bước chọn người nhận** — không phải một nút *Bàn giao* xong là xong. Xem `fe/02` §6 (gỡ `isLeader` → `MEMBER_ROLE.OWNER`).

### R2.5 — `POST /family/:groupId/import` dùng chung contract với `/changes` — ✅ đã chốt 2026-09-27

`03` §5 nói import là **đường ghi hàng loạt riêng**, phải có `dryRun`. Frontend sẽ gọi `/changes` cho mọi thao tác thường và `/import` cho import.

**Trả lời: CÓ, cùng hình dạng.** `dryRun` trả về `idMap` + `conflicts` giống hệt `R1` — UI import dùng chung một bộ merge, không viết bộ thứ hai.

```
POST /api/v1/family/:groupId/import
  headers: If-Match, Idempotency-Key
  body: { mode: 'create' | 'restore', dryRun?: boolean, baseVersion, payload }

    mode: 'create'   → mọi thành viên mới, tham chiếu trong file bằng clientRef
    mode: 'restore'  → giữ nguyên id trong file (chỉ hợp lệ khi file do chính hệ thống này xuất)

200          → { version, tree, idMap, activityIds, report }
dryRun: true → { dryRun: true, idMap, conflicts, report, tree }   // không ghi gì
```

**Vì sao `/import` vẫn là endpoint riêng mà không gộp vào `/changes`:** vì nó nhận **file** và phải **parse + báo lỗi theo dòng** (GEDCOM dở nên phải nói "dòng 214: `INDI` không có `FAM`"). `/changes` nhận object đã parse sẵn và không có khái niệm dòng. Gộp chúng sẽ phải nhét cả hai kiểu payload vào một body và nhánh ở tầng DTO — tệ hơn là tách.

**Vì sao cần `mode: 'restore'`:** nếu không có nó thì "Export JSON là bản sao lưu thật" (`03` §5) là nói dối — lúc nhập lại, server sinh id mới và mọi tham chiếu (album, ảnh, log, bố cục) đứt hết. `mode: 'restore'` là chỗ biến "sao lưu" thành "khôi phục" thật sự.

⚠️ `mode: 'restore'` là **chiến lược tương thích** chứ không phải công cụ gộp thông minh: nếu id trong file đã tồn tại với nội dung khác thì phải **409 liệt kê `conflicts`**, không tự ghi đè. Xem `fe/03` §5.

---

## Câu hỏi đã trả lời (2026-09-27)

Bảng này trước đây là "Cần backend trả lời". Tất cả đã có câu trả lời — xem mục R1/R2 tương ứng ở trên.

| # | Câu hỏi | Trả lời | Chặn stage | Ở đâu |
|---|---|---|---|---|
| 1 | Có đồng ý thêm `/changes` không? | **Có** — là **đường ghi chính** (batch-first) | ✅ stage 3 | R1 + D6 `README` |
| 2 | Đưa vào bước 2.2 hay tách thành 2.2b? | **Tách thành bước 2.2b.** Bước 2.2 giữ là CRUD lẻ, nay là API cấp thấp | ✅ stage 3 | `04` bảng phase 2 |
| 3 | `LAYOUT_SAVE` có bump `version` + ghi log không? | **Có** — cả hai, theo I4/I5 | ✅ stage 3 | R1.4 |
| 4 | Có thêm `FAMILY_LAYOUT_CHANGED` vào `ACTION_TYPE` không? | **Có.** Tổng `ACTION_TYPE` = **15** | ✅ stage 4 | R2.1 |
| 5 | `/activity` dùng cursor `createdAt + id` — xác nhận | **Xác nhận**, bắt buộc. `200 → { items, nextCursor }` | ✅ stage 4 | R2.2 |
| 6 | R2.3 (`Event.familyMemberId`) | **Không đủ cho khách mời.** Giữ 1 cột cho `fe/03` §9, cắt §10, **không** thêm bảng | ✅ stage 4 | R2.3 |
| 6 | R2.4 (`transfer-ownership`) | `memberId` bắt buộc · thừa kế `EDITOR` → fallback `VIEWER` · OWNER cũ còn `EDITOR` | ✅ stage 4 | R2.4 |
| 6 | R2.5 (`/import`) | **Cùng shape** với `/changes`, thêm `report`. 2 chế độ `create` / `restore` | ✅ stage 4, 5 | R2.5 |

**Còn chưa chốt:** `MEMBER_PHOTO_CHANGED` (tuỳ chọn, sẽ đưa `ACTION_TYPE` lên 16 — xem R2.1). Không chặn stage nào.

---

## Không cần gửi backend

Ba mục sau **không** phải yêu cầu, chỉ là ghi chú để tránh hiểu nhầm khi đọc `01`–`05`:

| Mục | Ghi chú |
|---|---|
| `GET /api/v1/invite/mine` | **Đã bỏ yêu cầu.** Menu *Lời mời* không có trang, và không dựng được vì không có endpoint liệt kê lời mời đã gửi. `03` bước 5.1 chỉ cần import/export |
| Vị trí node (`positionX/Y`) | Không cần endpoint riêng. Lưu qua `LAYOUT_SAVE` trong R1 |
| `USER_ROLE.ADMIN`, `isLeader`, `pinnedMemberId`, `GET /users`, blog | Frontend xoá theo `01` bộ khảo sát FE. Không cần thêm gì phía backend — các mục này **đã** có trong `01`/`03` backend |
