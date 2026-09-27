# Kế hoạch refactor backend → dự án quản lý gia đình cá nhân

> Trạng thái: **đề xuất, chưa ai code**.
> Ngày khảo sát: 2026-09-26 · Phạm vi: `project/backend/` (chỉ tư vấn kiến trúc, không đụng frontend trong đợt này).

## Mục tiêu

Biến backend hiện tại (được dựng với hướng dẫn thương mại: admin plane, blog SEO, user directory) thành một hệ thống quản lý gia đình **cho cá nhân / nhóm nhỏ** — giữ nguyên domain, cắt sạch dấu vết thương mại, và sửa những chỗ kiến trúc đang gây rò dữ liệu.

## Các quyết định đã chốt

| # | Quyết định | Chọn |
|---|-----------|------|
| D1 | Domain | **Giữ nguyên gia đình.** Không đổi sang CRM / life-OS |
| D2 | Chia sẻ nhiều người | **Giữ group + role, rút gọn.** Nhưng quyền phải tách **2 trục độc lập**, xem D15 |
| D3 | Blog | **Bỏ hẳn** blog + blog-media + toàn bộ code liên quan |
| D4 | Ảnh | **Giữ, có cả album** — build thật `AlbumsModule` (đang là stub) |
| D5 | Phạm vi lần này | **Chỉ backend.** Frontend sẽ cần sửa theo, ghi rõ ở từng mục |
| D6 | Write-path | **Batch-first** — `POST /family/:groupId/changes` là đường ghi **chính**; CRUD lẻ + `/import` giữ làm API **cấp thấp** cho e2e/CLI. Chi tiết ở [06](./06-bo-sung-tu-khao-sat-fe.md) R1. Mọi operation trong batch — kể cả `LAYOUT_SAVE` — **đều bump `version` + ghi `ActivityLog`** trong cùng `$transaction` (I4/I5), không có ngoại lệ |
| D7 | Phân quyền | **Giữ 3 vai `OWNER`/`EDITOR`/`VIEWER`**, chỉ bỏ `isLeader`. EDITOR **không** xoá được group. Thêm `PATCH /group-family/:groupId/transfer-ownership` |
| D8 | Nhóm mồ côi | OWNER rời group → tự chuyển OWNER cho **EDITOR lâu năm nhất** + notification. Không còn EDITOR thì xuống **VIEWER lâu năm nhất**; hết thành viên thì `GroupFamily` bị xoá theo cascade. OWNER cũ giữ `EDITOR`, **không** bị kick. Chi tiết ở [03](./03-pham-vi-them.md) §2. ⚠️ **Không có tính năng "rời nhóm" phía người dùng** (D14) — nhánh này chỉ kích hoạt qua **xoá tài khoản**; media của người xoá **chuyển chủ** cho group OWNER, không cascade xoá |
| D9 | Quan hệ | **Giữ bảng `Relationship`.** Client gửi 1 chiều, server tự sinh chiều đối. `SPOUSE` là **cặp không thứ tự** (sort 2 id trước khi ghi), tầng đọc mới suy ra "ai là chồng" |
| D10 | `generation` | **Server là nguồn sự thật** (BFS). Node trong chu trình → `generation = 0` + cảnh báo, **không throw**. Client gửi giá trị lệch → `409` |
| D11 | Tài khoản | **Password reset làm thật** (bảng token lưu **hash**, Resend, rate limit, thu hồi mọi `Session`). Email verification = **pending** — không thêm `emailVerifiedAt` |
| D12 | Audit | **`ActivityLog` làm thật, gồm cả delete.** Soft-delete `FamilyMember` là tiền đề kỹ thuật. Lọc theo vai (D2) + `targetType`. Nâng lên **P0** vì log phải ghi trong cùng `$transaction` |
| D13 | Tầng authz | **Service chịu trách nhiệm.** Mọi method nhận `userId` phải tự gọi `MembershipService.assertCan(userId, groupId, level)`. Guard chỉ là lớp ngoài |
| D14 | Số nhóm / tài khoản | **1 tài khoản chỉ thuộc 1 group.** Không có ngoại lệ. Backend **chặn tạo group thứ 2** (`409`) — nếu không, chỉ cần gọi API là tạo ra trạng thái ngõ cụt mà UI không có lối ra. Bất biến **I6** |
| D15 | Chủ sở hữu media | **Ai upload thì đó là media của người đó** (`createdById`, không null). Sửa/xoá/ẩn/khôi phục: **chủ media hoặc group OWNER** — không phải "cả nhóm". Bất biến **I7**. Chi tiết ở [03](./03-pham-vi-them.md) §11 |
| D16 | Ảnh node = ảnh hồ sơ | ⚠️ **Đảo ngược B5.** `pinnedMemberId` **được giữ**, và trở thành cơ chế gắn node ↔ tài khoản ↔ ảnh: ai pin node thì node lấy **ảnh hồ sơ** của họ, **chụp tại thời điểm pin** (snapshot, không đọc động lúc render). Nhờ vậy không ai sửa được ảnh của người khác nếu không có quyền `edit` |

## Mô hình sản phẩm — đọc trước tài liệu nào khác

Hệ thống phục vụ **một người / một gia đình**. Ba hệ quả cụ thể:

| Hệ quả | Nghĩa là gì | Ở đâu |
|---|---|---|
| **1 tài khoản = 1 group** (D14) | Không có khái niệm "quản lý danh sách nhóm", không có `GET /group-family/mine` trả về nhiều dòng. Xoá `leaveGroup` phía API — nếu còn thì đó là đường lách I6 | `03` §2, bất biến I6 |
| **Cây = đặc quyền, media = có chủ** (D15) | Hai trục quyền độc lập. EDITOR sửa được **mọi thứ trong cây** nhưng **không xoá được ảnh của người khác** — có chủ ý, không phải sơ suất | `03` §11, bất biến I7 |
| **Lời mời không cần quản lý** | Tạo link → gửi đi đâu thì kệ → người ta bấm vào đăng ký là vào. Không `GET /invite/mine`, không toggle bật/tắt. **Không có màn danh sách ở phía FE** | `03` §9 |

⚠️ Ba hệ quả này khiến những thứ đang tồn tại trở nên vô nghĩa nếu không dọn: danh sách nhóm, nút *Rời khỏi nhóm*, `GET /invite/mine`, và mọi tầng bố cục `localStorage` phía FE. Xem `01` **B11** và `fe/01` **FE-B11**.

## Kết luận khảo sát

Backend **đã hỏng ở tầng kiến trúc**, không chỉ thiếu feature. Vấn đề nghiêm trọng nhất không nằm ở việc "chưa làm gì" mà ở chỗ **thiết kế hiện tại cho phép ghi đè dữ liệu của nhóm khác** (xem `02-pham-vi-sua.md` §1).

Mức độ hoàn thiện hiện tại:
- Demo nội bộ / test với vài người thân → gần đủ
- Cho người dùng thật → **chưa đủ**, vì 1 lỗi rò dữ liệu + ảnh chưa có + không import/export

## Kết luận quan trọng nhất

Hệ thống không hỏng vì thiếu tính năng, mà hỏng vì **không có bất biến nào được viết ra**. `RolesGuard` có thật, `Prisma` scope có thật — nhưng cả hai đều là thói quen của tác giả chứ không phải quy tắc của hệ thống, nên một method viết sai là IDOR.

Vì vậy ngoài 4 danh sách việc (xoá / sửa / thêm / thứ tự), còn một danh sách thứ 5: **7 bất biến phải giữ** ở [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md). Đó là thứ biến các phát hiện trong đợt khảo sát này thành thứ không quay lại.

## Danh sách

| Tài liệu | Nội dung |
|----------|----------|
| [01-pham-vi-bo.md](./01-pham-vi-bo.md) | 9 nhóm cần xoá — blog, admin plane, `isLeader`, `pin`, `Verification`, env giả, docs sai. *(B4 `OWNER` đã hủy theo D7; **B5 `pinnedMemberId` đã hủy theo D16** — xem cuối file)* |
| [02-pham-vi-sua.md](./02-pham-vi-sua.md) | 9 nhóm cần sửa — **IDOR P0**, mất data, thiếu authz ở service, thiếu rate limit, DTO lỏng |
| [03-pham-vi-them.md](./03-pham-vi-them.md) | 12 nhóm cần thêm — granular CRUD, gán ảnh cho node, register `?token=`, chặn group thứ 2, cột chủ media, import/export, search, timeline |
| [04-thu-tu-thuc-hien.md](./04-thu-tu-thuc-hien.md) | 5 phase, thứ tự phụ thuộc, tiêu chí nghiệm thu |
| [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md) | **7 bất biến bắt buộc** — dùng làm review gate cho mọi PR, kèm danh sách vi phạm hiện tại |
| [06-bo-sung-tu-khao-sat-fe.md](./06-bo-sung-tu-khao-sat-fe.md) | **Bổ sung từ khảo sát frontend** (2026-09-27) — 2 yêu cầu chặn tiến độ, nổi bật là `POST /family/:groupId/changes` (batch) |

## Ghi chú bắt buộc khi đọc

Tài liệu `docs/pending_features.md` hiện có **đã lỗi thời** — nó mô tả events/notification là stub rỗng, nhưng thực tế 2 module đó đã implement đầy đủ. Không dùng nó làm nguồn sự thật. Xem `01-pham-vi-bo.md` B9.

## Kế hoạch frontend đi kèm

Khảo sát frontend ([`../planing-refactor-fe/README.md`](../planing-refactor-fe/README.md)) được làm sau và phát hiện **nhiều mục mà bộ kế hoạch này còn thiếu** — xem [06-bo-sung-tu-khao-sat-fe.md](./06-bo-sung-tu-khao-sat-fe.md). Nổi bật: frontend quyết định **giữ nút *Lưu* toàn cục**, nên bước 2.2 bên dưới chỉ có CRUD lẻ là chưa đủ.

**Đã chốt (2026-09-27):** `/changes` được chấp nhận và là **đường ghi chính** — D6 ở trên đã sửa theo. `/changes` là bước **2.2b**, tách riêng khỏi 2.2 (CRUD lẻ, nay là API cấp thấp). R2.3, R2.4, R2.5 cũng đã có câu trả lời — xem mục "Câu hỏi đã trả lời" ở `06`.

**Đã chốt (2026-09-27, vòng 2):** khảo sát FE chốt mô hình sản phẩm **1 người 1 cây** ⇒ bộ kế hoạch này thêm **D14/D15/D16** và 2 bất biến **I6/I7**. Trong đó **D16 đảo ngược B5** (`pinnedMemberId` từ "xoá" thành "giữ, làm cơ chế ảnh node").

⚠️ **Hai bộ kế hoạch phải đọc cùng nhau.** Khi hai tài liệu mâu thuẫn, file này ăn và file kia phải sửa.

## Có 2 mục trong bộ tài liệu này đã bị đảo ngược sau khi viết

Đọc `01` và `03` từng mục, không đọc cả file một lượt rồi làm theo:

| Mục | Viết ban đầu | Chốt sau | Ở đâu ghi lại |
|---|---|---|---|
| **`01` B5** | Xoá cột `pinnedMemberId` | **Giữ** — thành cơ chế node ↔ tài khoản ↔ ảnh hồ sơ | `be/01` cuối file · `be/README` D16 · `fe/01` FE-B4 |
| **`03` §3** | Upload ảnh đại diện thành viên, không gắn cứng với cây | **Gán ảnh cho node**, cấp quyền `edit`, có snapshot lúc pin | `be/03` §3 · `be/README` D16 |

Các file khác trong bộ này đã được sửa theo; riêng 2 mục trên có ghi chú tại chỗ để không ai implement theo bản cũ.
