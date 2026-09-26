# Kế hoạch refactor backend → dự án quản lý gia đình cá nhân

> Trạng thái: **đề xuất, chưa ai code**.
> Ngày khảo sát: 2026-09-26 · Phạm vi: `project/backend/` (chỉ tư vấn kiến trúc, không đụng frontend trong đợt này).

## Mục tiêu

Biến backend hiện tại (được dựng với hướng dẫn thương mại: admin plane, blog SEO, user directory) thành một hệ thống quản lý gia đình **cho cá nhân / nhóm nhỏ** — giữ nguyên domain, cắt sạch dấu vết thương mại, và sửa những chỗ kiến trúc đang gây rò dữ liệu.

## Các quyết định đã chốt

| # | Quyết định | Chọn |
|---|-----------|------|
| D1 | Domain | **Giữ nguyên gia đình.** Không đổi sang CRM / life-OS |
| D2 | Chia sẻ nhiều người | **Giữ group + role, rút gọn** |
| D3 | Blog | **Bỏ hẳn** blog + blog-media + toàn bộ code liên quan |
| D4 | Ảnh | **Giữ, có cả album** — build thật `AlbumsModule` (đang là stub) |
| D5 | Phạm vi lần này | **Chỉ backend.** Frontend sẽ cần sửa theo, ghi rõ ở từng mục |
| D6 | Write-path | **Hybrid** — CRUD lẻ là đường chính, 1 endpoint bulk riêng cho import/GEDCOM |
| D7 | Phân quyền | **Giữ 3 vai `OWNER`/`EDITOR`/`VIEWER`**, chỉ bỏ `isLeader`. EDITOR **không** xoá được group. Thêm `PATCH /group-family/:groupId/transfer-ownership` |
| D8 | Nhóm mồ côi | OWNER rời group → tự chuyển OWNER cho EDITOR lâu năm nhất + notification |
| D9 | Quan hệ | **Giữ bảng `Relationship`.** Client gửi 1 chiều, server tự sinh chiều đối. `SPOUSE` là **cặp không thứ tự** (sort 2 id trước khi ghi), tầng đọc mới suy ra "ai là chồng" |
| D10 | `generation` | **Server là nguồn sự thật** (BFS). Node trong chu trình → `generation = 0` + cảnh báo, **không throw**. Client gửi giá trị lệch → `409` |
| D11 | Tài khoản | **Password reset làm thật** (bảng token lưu **hash**, Resend, rate limit, thu hồi mọi `Session`). Email verification = **pending** — không thêm `emailVerifiedAt` |
| D12 | Audit | **`ActivityLog` làm thật, gồm cả delete.** Soft-delete `FamilyMember` là tiền đề kỹ thuật. Chỉ OWNER/EDITOR xem log. Nâng lên **P0** vì log phải ghi trong cùng `$transaction` |
| D13 | Tầng authz | **Service chịu trách nhiệm.** Mọi method nhận `userId` phải tự gọi `MembershipService.assertCan(userId, groupId, level)`. Guard chỉ là lớp ngoài |

## Kết luận khảo sát

Backend **đã hỏng ở tầng kiến trúc**, không chỉ thiếu feature. Vấn đề nghiêm trọng nhất không nằm ở việc "chưa làm gì" mà ở chỗ **thiết kế hiện tại cho phép ghi đè dữ liệu của nhóm khác** (xem `02-pham-vi-sua.md` §1).

Mức độ hoàn thiện hiện tại:
- Demo nội bộ / test với vài người thân → gần đủ
- Cho người dùng thật → **chưa đủ**, vì 1 lỗi rò dữ liệu + ảnh chưa có + không import/export

## Kết luận quan trọng nhất

Hệ thống không hỏng vì thiếu tính năng, mà hỏng vì **không có bất biến nào được viết ra**. `RolesGuard` có thật, `Prisma` scope có thật — nhưng cả hai đều là thói quen của tác giả chứ không phải quy tắc của hệ thống, nên một method viết sai là IDOR.

Vì vậy ngoài 4 danh sách việc (xoá / sửa / thêm / thứ tự), còn một danh sách thứ 5: **5 bất biến phải giữ** ở [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md). Đó là thứ biến các phát hiện trong đợt khảo sát này thành thứ không quay lại.

## Danh sách

| Tài liệu | Nội dung |
|----------|----------|
| [01-pham-vi-bo.md](./01-pham-vi-bo.md) | 9 nhóm cần xoá — blog, admin plane, `isLeader`, `pin`, `Verification`, env giả, docs sai. *(B4 `OWNER` đã hủy theo D7 — xem cuối file)* |
| [02-pham-vi-sua.md](./02-pham-vi-sua.md) | 9 nhóm cần sửa — **IDOR P0**, mất data, thiếu authz ở service, thiếu rate limit, DTO lỏng |
| [03-pham-vi-them.md](./03-pham-vi-them.md) | 12 nhóm cần thêm — granular CRUD, upload ảnh, import/export, search, timeline |
| [04-thu-tu-thuc-hien.md](./04-thu-tu-thuc-hien.md) | 5 phase, thứ tự phụ thuộc, tiêu chí nghiệm thu |
| [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md) | **5 bất biến bắt buộc** — dùng làm review gate cho mọi PR, kèm danh sách vi phạm hiện tại |

## Ghi chú bắt buộc khi đọc

Tài liệu `docs/pending_features.md` hiện có **đã lỗi thời** — nó mô tả events/notification là stub rỗng, nhưng thực tế 2 module đó đã implement đầy đủ. Không dùng nó làm nguồn sự thật. Xem `01-pham-vi-bo.md` B9.
