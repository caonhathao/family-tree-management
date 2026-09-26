# 06 — Bổ sung từ khảo sát frontend

> Trạng thái: **đề xuất, chưa ai code**.
> Ngày: 2026-09-27 · Nguồn: [khảo sát frontend](../planing-refactor-fe/README.md).
> File này **không thay thế** `01`–`05`. Nó chỉ ghi những mục khảo sát frontend phát hiện ra là kế hoạch backend hiện tại **thiếu hoặc chưa đủ chi tiết**.
>
> Ưu tiên: **R1** (batch endpoint) và **R2** (action type + cursor pagination) là hai mục **chặn tiến độ frontend**. Cần trả lời bằng văn bản trước khi frontend vào stage 3.

---

## Vì sao cần file này

Kế hoạch backend được chốt trước khảo sát frontend. Frontend quyết định **giữ nút *Lưu* toàn cục** (quyết định Q4), điều mà kế hoạch backend không tính tới. Hệ quả là bước 2.2 trong `04-thu-tu-thuc-hien.md` — chỉ liệt kê CRUD từng người — **không đủ**.

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
      { "type": "LAYOUT_SAVE",         "data": { "members": [{ "id": "...", "positionX": 0, "positionY": 0 }] } }
    ]
  }

200 → {
  "version": 43,
  "tree": { ... },                          // trạng thái sau khi áp dụng
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
| R1.4 | **`LAYOUT_SAVE` bump `version` và ghi `ActivityLog`** với action type `FAMILY_LAYOUT_CHANGED` | Xem bên dưới |
| R1.5 | **`idMap` trả về đủ** cho `MEMBER_CREATE` và `RELATIONSHIP_CREATE` | Client cần re-key cây sau khi lưu. Thiếu nó thì cây hiển thị lệch id so với server |
| R1.6 | **`baseUpdatedAt` trên `MEMBER_UPDATE`** | `version` chỉ bắt xung đột **cả cây**. `updatedAt` bắt xung đột **1 dòng** — cần thiết để biết chính xác dòng nào xung đột khi trả 409 |
| R1.7 | **`409` phải kèm trạng thái server hiện tại** trong body | Không có dữ liệu để merge thì UI chỉ còn lựa chọn bỏ thay đổi của mình — tệ hơn hẳn so với hiện trạng |
| R1.8 | **`MEMBER_UPDATE` / `MEMBER_DELETE` phải scope `groupFamilyId` trong cùng `where`** | I1. Ranh giới được nêu ở `05` backend §"Ranh giới hợp lệ": ref tới thứ **chưa tồn tại** thì được (`fromRef`); id của thứ **đã tồn tại** thì phải scope group |
| R1.9 | Có thể để các route CRUD lẻ ở `03` §1 **giữ nguyên**, coi như API cấp thấp | Frontend sẽ chỉ dùng `/changes`. Nhưng chúng vẫn cần cho script/CLI và cho e2e test. Xoá thì mất mà không đổi được gì |

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

---

## R2 — Bổ sung vào `02`/`03`/`04` backend

### R2.1 — `ACTION_TYPE` cần thêm 2 giá trị

`03` §10 liệt kê 11 action type. Frontend cần thêm:

| Action type | Vì sao |
|---|---|
| `FAMILY_LAYOUT_CHANGED` | Bắt buộc cho R1.4. Không có nó thì nút *Sắp xếp* là đường lách duy nhất qua I4/I5 |
| `MEMBER_PHOTO_CHANGED` (tuỳ chọn) | Cho phép "anh Tuấn vừa đổi ảnh" trong lịch sử. Nếu thấy thừa thì bỏ — 11 action type đã là nhiều |

Các action type còn lại (`MEMBER_JOINED`, `MEMBER_LEFT`, `MEMBER_ROLE_CHANGED`, `OWNERSHIP_TRANSFERRED`, `MEMBER_GENERATION_RECOMPUTED`) **đã có sẵn** trong `03` §10 — frontend chỉ cần đọc và hiển thị.

### R2.2 — `GET /family/:groupId/activity` phân trang bằng **cursor**

`03` §10 đã ghi "paginated by cursor (`createdAt + id`, not offset)". Xác nhận đây là yêu cầu bắt buộc, không phải tuỳ chọn:

Offset pagination sẽ trùng hoặc mất dòng **ngay khi có ai đó vừa ghi log** — mà bảng này được ghi bởi *mọi* mutation, nên nó luôn đang lớn lên khi người dùng đang xem.

Cụ thể: người A đang xem trang 3 (`OFFSET 40 LIMIT 20`), người B thêm 3 thành viên, A bấm trang 4 → 3 dòng đầu bị lặp, 3 dòng cuối bị bỏ sót.

Contract đề xuất:

```
GET /family/:groupId/activity?limit=20&cursor=<createdAt|id>&action=&targetType=&from=&to=
200 → { items: [...], nextCursor: "..." | null }
```

### R2.3 — Xác nhận `Event.familyMemberId` đủ dùng

`02` §6 thêm `Event.familyMemberId`. Frontend cần xác nhận đây là đủ cho cả 2 nhu cầu:

1. Gắn sự kiện vào một người (lễ cưới của ông nội)
2. Danh sách khách mời sự kiện

Nếu (2) cần bảng riêng (`EventParticipant`), xin ghi rõ phạm vi — hiện frontend **không** tự lưu vào `biography` hay ghi chú, vì đó là bằng chứng cho vi phạm bất biến `F1` phía FE (dữ liệu phái sinh phải do server đặt tên và đặt schema).

### R2.4 — Xác nhận phạm vi của `PATCH /group-family/:groupId/transfer-ownership`

`03` §2.9 liệt kê endpoint. Frontend cần biết trước:

| Câu hỏi | Vì sao cần |
|---|---|
| Endpoint có nhận `memberId` mới OWNER không, hay tự chọn theo luật D8? | UI khác nhau: chọn tay trong dropdown vs chỉ hiện thông báo "đã chuyển cho X" |
| Có thừa kế được `EDITOR` không? Hay chỉ `VIEWER`? | Ảnh hưởng danh sách trong dropdown |
| OWNER cũ còn `EDITOR` hay bị kick? | Ảnh hưởng UI sau khi chuyển |

### R2.5 — Xác nhận `POST /family/:groupId/import` dùng chung contract với `/changes`

`03` §5 nói import là **đường ghi hàng loạt duy nhất**, phải có `dryRun`. Frontend sẽ gọi `/changes` cho mọi thao tác thường và `/import` cho import.

Cần xác nhận: `dryRun` trả về **cùng hình dạng** `idMap` + `conflicts` như `R1` không? Nếu không, UI import sẽ phải viết bộ merge thứ hai.

---

## Cần backend trả lời

| # | Câu hỏi | Chặn stage nào |
|---|---|---|
| 1 | Có đồng ý thêm `/changes` không? Nếu không, lý do? | **stage 3** |
| 2 | Nếu có: đưa vào bước 2.2 của `04` backend, hay tách thành bước 2.2b? | **stage 3** |
| 3 | `LAYOUT_SAVE` có được bump `version` + ghi log không? | **stage 3** |
| 4 | Có thêm `FAMILY_LAYOUT_CHANGED` vào `ACTION_TYPE` không? | stage 4 |
| 5 | `/activity` dùng cursor theo `createdAt + id` — xác nhận | stage 4 |
| 6 | R2.3, R2.4, R2.5 | stage 4, 5 |

---

## Không cần gửi backend

Ba mục sau **không** phải yêu cầu, chỉ là ghi chú để tránh hiểu nhầm khi đọc `01`–`05`:

| Mục | Ghi chú |
|---|---|
| `GET /api/v1/invite/mine` | **Đã bỏ yêu cầu.** Menu *Lời mời* không có trang, và không dựng được vì không có endpoint liệt kê lời mời đã gửi. `03` bước 5.1 chỉ cần import/export |
| Vị trí node (`positionX/Y`) | Không cần endpoint riêng. Lưu qua `LAYOUT_SAVE` trong R1 |
| `USER_ROLE.ADMIN`, `isLeader`, `pinnedMemberId`, `GET /users`, blog | Frontend xoá theo `01` bộ khảo sát FE. Không cần thêm gì phía backend — các mục này **đã** có trong `01`/`03` backend |
