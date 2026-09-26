# Kế hoạch refactor frontend → từ SaaS sang app cá nhân

> Trạng thái: **đề xuất, chưa ai code**.
> Ngày khảo sát: 2026-09-27 · Phạm vi: `project/frontend/` (kế hoạch song song với [bộ khảo sát backend](../planing-refactor-be/README.md)).
> Nhánh: `refactor/individual-ui`.

## Mục tiêu

Biến frontend hiện tại — được dựng theo hướng dẫn thương mại: landing page marketing, admin plane, blog SEO, sidebar menu 8 mục trong đó 4 mục không có trang — thành một app **quản lý gia đình cho cá nhân / nhóm nhỏ**.

Hai việc song song, không tách rời:

1. **Cắt sạch dấu vết SaaS** — mọi bề mặt thương mại.
2. **Viết lại đường ghi dữ liệu** — hiện tại là *full-replace toàn bộ cây*, vừa là nguồn IDOR (`02` backend §1) vừa là nguồn mất dữ liệu (`02` backend §2).

## Các quyết định đã chốt

| # | Quyết định | Chọn |
|---|-----------|------|
| **Q1** | URL cây gia đình | **Giữ `/group?groupId=`** — 3 file đã truyền sẵn `groupId`, app cá nhân chỉ có 1-2 cây, URL sạch không đáng đổi |
| **Q2** | Vai trò ứng dụng | **Bỏ toàn bộ admin plane.** Người dùng chỉ có 1 vai. RBAC còn lại là `OWNER/EDITOR/VIEWER` **trong group**, không phải toàn hệ thống |
| **Q3** | Blog + `/features` | **Bỏ hẳn** blog. `/features` chuyển thành trang tĩnh thuần client (không còn nguồn nội dung từ DB) |
| **Q4** | Nút *Lưu* | **Giữ nút Lưu toàn cục**, nhưng chuyển sang *dirty set theo từng entity* thay vì so sánh toàn cây. Yêu cầu **batch endpoint** (`02` §0) vì lưu bằng N request lẻ thì không nguyên tử |
| **Q5** | Danh tính thành viên | **`localId` → `id`** (server sinh). `clientRef` chỉ tồn tại trong bộ nhớ, không bao giờ vào payload |
| **Q6** | `generation` | **Server là nguồn sự thật.** Client chỉ tính **tạm để vẽ**, không gửi lên |
| **Q7** | Quan hệ 2 chiều | Client **đọc 2 chiều** (không đổi, tầng hiển thị cần), **chỉ gửi 1 chiều**. Client tự sinh chiều ngược **để hiển thị**, không gửi |
| **Q8** | Bố cục (`positionX/Y`) | **2 tầng** — cá nhân `localStorage` (kéo tay, không lên cloud) + chung trên server (chỉ ghi qua nút *Sắp xếp* hoặc *Lưu*, cả hai đều tự arrange). **1 lần bấm = 1 `version`**: lớp phủ `localStorage` là thứ *chưa lưu*, bị xoá sau khi lưu là bình thường; kéo mà không bấm *Lưu* thì mất, không cứu |
| **Q9** | Ai được ghi | *Lưu*/*Sắp xếp* = `OWNER\|EDITOR` (`canManage` sẵn có ở `group-content.tsx:477`). **VIEWER** chỉ dùng được tầng cá nhân — đó là thứ duy nhất họ làm được |
| **Q10** | Menu chết | **Xoá 4 mục** không có trang: *Lời mời*, *Kho lưu trữ*, *Hỗ trợ*, *Phản hồi*. Giữ *Thùng rác* (có trang thật ở `03` §2) |
| **Q11** | Trang gốc `/` | **Redirector**: 1 group → vào thẳng cây; ≥2 group → `/user/groups`; 0 group → tạo group. Không còn landing marketing |
| **Q12** | Quyền batch endpoint | `POST /changes` cần mức **`edit`** (EDITOR+), **không phải `manage`** — siết chặt hơn là EDITOR bấm Lưu rồi nhận 403 |
| **Q13** | Bất biến FE | **6 bất biến F1–F6** ở [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md), áp dụng **từ PR đầu tiên** |

## Kết luận khảo sát

Frontend **hỏng ở tầng mô hình dữ liệu**, không chỉ ở giao diện. Một `useState` kiểu `lodash.isequal(draft, origin)` trên **cả cây 300 người** đang giữ toàn bộ app. Hệ quả dây chuyền:

- `localId` (id do client sinh) là khoá nối **60+ chỗ** — nên nó là gốc rễ của IDOR ở backend, không phải một chi tiết UI.
- Mỗi lần bấm *Lưu* là gửi **toàn bộ cây** lên. Không có khả năng thêm/xoá một người.
- Hai người cùng sửa → lần sau âm thầm xoá việc trước, **không có cảnh báo**.

Ngoài ra, app có **4 trong menu 8 mục không có trang**, nav quảng bá 2 trang không tồn tại (`/tutorials`, `/faq`), và một nhánh `/admin` hoàn toàn trống.

Mức độ hoàn thiện hiện tại:
- Demo nội bộ → chạy được, cây vẽ đẹp, layout tay rất chỉn chu
- Cho người dùng thật → **chưa đủ**: không có ảnh, không có lịch sử thay đổi, không có thùng rác, không import/export, và mỗi lần sửa là một lần mất dữ liệu có thể xảy ra

## Kết luận quan trọng nhất

Giống hệt phát hiện của khảo sát backend: **không có bất biến nào được viết ra**. `familySlice` giữ `draft` + `origin` là một thói quen, không phải quy tắc — nên `family-member-form.tsx:136` mới mời sinh `v4()` làm `localId` mà không ai ngăn được.

Vì vậy ngoài 4 danh sách việc (xoá / sửa / thêm / thứ tự), còn danh sách thứ 5: **6 bất biến F1–F6** ở [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md).

## Yêu cầu gửi backend

Hai mục dưới đây là **tiền đề cứng** cho `04` stage 3. Chi tiết ở [02-pham-vi-sua.md](./02-pham-vi-sua.md) §0, bản gửi chính thức ở [`../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md`](../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md).

| # | Yêu cầu | Vì sao chặn |
|---|---------|-----------|
| **R1** | `POST /api/v1/family/:groupId/changes` — batch, `If-Match`, 1 `$transaction`, 1 lần `version++`, 1 loạt `ActivityLog`, mức quyền `edit` | Nếu chỉ có CRUD lẻ: lưu = N request, request 3/5 lỗi 409 thì 1-2 đã gửi rồi → **lưu không nguyên tử**, người dùng phải tự dò xem đã lưu được gì |
| **R2** | Operation lưu bố cục trong cùng batch: **`LAYOUT_SAVE`** (✅ đã chốt, **không** gộp `positionX/Y` vào `MEMBER_UPDATE` — bố cục là 1 mutation riêng vì nó phải auto-arrange trước khi ghi) + action type `FAMILY_LAYOUT_CHANGED` | Nút *Sắp xếp* là một mutation → theo I4/I5 bắt buộc `version++` và ghi `ActivityLog`. Không có nó thì nút *Sắp xếp* là đường lách duy nhất qua 2 bất biến đó |

## Danh sách

| Tài liệu | Nội dung |
|----------|----------|
| [01-pham-vi-bo.md](./01-pham-vi-bo.md) | 10 nhóm cần xoá — blog, admin plane, `isLeader`, `pinnedMemberId`, 7 dependency chết, marketing shell, 4 menu chết |
| [02-pham-vi-sua.md](./02-pham-vi-sua.md) | 14 nhóm cần sửa — **§0 là 2 yêu cầu gửi backend**, §1-§3 là viết lại đường ghi dữ liệu |
| [03-pham-vi-them.md](./03-pham-vi-them.md) | 12 nhóm cần thêm — lịch sử thay đổi, thùng rác, tìm kiếm, ảnh, import/export, chia sẻ |
| [04-thu-tu-thuc-hien.md](./04-thu-tu-thuc-hien.md) | 6 stage trên 1 nhánh, mỗi stage ghi rõ phụ thuộc backend nào, tiêu chí nghiệm thu |
| [05-pham-vi-tiem-do.md](./05-pham-vi-tiem-do.md) | **6 bất biến bắt buộc** — dùng làm review gate cho mọi PR, kèm danh sách vi phạm hiện tại |

## Ghi chú bắt buộc khi đọc

- Bộ khảo sát backend là **nguồn sự thật cho domain**. File này không lặp lại domain rules, chỉ ghi phần frontend phải đổi theo. Khi hai tài liệu mâu thuẫn, **backend ăn** và file này phải sửa.
- Số dòng trong tài liệu này là ảnh chụp tại `9076749` (2026-09-27). Trước khi sửa theo, kiểm tra lại vì chính các đợt refactor trong file này sẽ làm dịch chuyển chúng.
- `.codegraph` chỉ index worktree `planning-front-end` (frontend + docs), **không** index `project/backend`. Khi cần tra backend thì đọc file trực tiếp.
