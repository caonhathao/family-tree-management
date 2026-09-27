# 05 — Phạm vi TIẾM ĐỘ (bất biến bắt buộc)

> **Đây không phải danh sách việc. Đây là điều không được vi phạm ở bất kỳ PR nào** — kể cả PR không thuộc đợt refactor này.
>
> Đây là phát hiện quan trọng nhất của toàn bộ khảo sát: hệ thống không hỏng vì thiếu tính năng, mà hỏng vì **không có bất biến nào được viết ra**. `RolesGuard` có thật, `Prisma` scope có thật, nhưng cả hai đều là thói quen của tác giả, không phải quy tắc của hệ thống — nên một method viết sai là IDOR (`02-pham-vi-sua.md` §1).

---

## 7 bất biến

| # | Bất biến | Vì sao | Bắt được bug nào đã xảy ra |
|---|---|---|---|
| **I1** | **Không câu `where`/`connect`/`update`/`delete` nào tới `FamilyMember`, `Family`, `Relationship` mà không scope `groupFamilyId`** | Tenant là `GroupFamily`; không có RLS, nên mọi `where` là hàng phòng thủ duy nhất | `family.service.ts:35,71` — IDOR cross-tenant (nghiêm trọng nhất) |
| **I2** | **Không method nào nhận `userId` mà không dùng nó** | Tham số không dùng = authz không ở tầng service = guard là hàng phòng thủ duy nhất | `family.service.ts:166-302` — `getFamilyData`/`updateFamilyInfo`/`deleteFamilyData` nhận `userId` rồi bỏ qua |
| **I3** | **Không route nào đọc/ghi dữ liệu group mà thiếu `:groupId`** | `RolesGuard` (`roles.guard.ts:46-73`) chỉ tra được khi route có `groupId` trong `req.params`. Không có `groupId` thì guard không có gì để kiểm | `RolesGuard:48` `return false` khi thiếu `groupId` — dễ dẫn tới bỏ luôn `groupId` khỏi route để "cho qua" |
| **I4** | **Mọi mutation = đúng 1 `version++`, trong cùng `$transaction`.** Không ngoại lệ — kể cả khi payload rỗng, kể cả khi thay đổi không đụng dữ liệu nghiệp vụ | Hai người cùng sửa thì không có optimistic lock thì lần save sau âm thầm xoá việc của lần trước. Hệ quả đã chốt: **1 lần bấm *Lưu* = +1 `version`**, và thay đổi chưa lưu thì **không tồn tại** — không cứu, không hợp nhất, không hỏi lại | `family.service.ts:62,130` — `deleteMany` xoá sạch thứ không có trong payload |
| **I5** | **Mọi mutation phải ghi `ActivityLog` trong cùng `$transaction`** | Log tách khỏi transaction thì log sai; log sai tệ hơn không có log | `grep 'activityLog.create'` trong `src/` → **0 kết quả** — bảng có schema, không bao giờ có dữ liệu |
| **I6** | **Một tài khoản chỉ thuộc đúng 1 `GroupFamily`.** Không có ngoại lệ: tạo group thứ 2 → `409`; không có API rời nhóm; đăng ký có `?token=` thì **không** tạo group | Sản phẩm là 1 người 1 cây (D14). Cho phép group thứ 2 thì mọi màn hình phải xử lý "đang xem cây nào", mà sản phẩm không cần | Chưa xảy ra — nhưng `POST /group-family` hiện cho phép tạo thoải mái, và `leaveGroup` cho phép tạo trạng thái 0 group mà không lối quay lại |
| **I7** | **Mọi media có chủ (`createdById` không null).** Sửa / xoá / ẩn / khôi phục / xem trong thùng rác → **chủ media hoặc group OWNER** | D15: chủ = **người upload**. Không có chủ thì media không ai quản được, và không ai chịu trách nhiệm khi nó sai | Chưa có cột chủ (`album.prisma` không có `createdById`) — nghĩa là **hiện tại bất kỳ ai cũng xoá được ảnh của bất kỳ ai** |

⚠️ **I7 có 3 điều kiện con, sai một là IDOR:**
1. Bộ lọc phải ở **tầng service**, không ở controller — đặt ở controller thì chỉ cần một endpoint quên gọi là lộ.
2. `hiddenById` là **1 userId**, không phải danh sách. "Ẩn cho riêng tôi ở nhiều thiết bị" cần bảng riêng — mô hình hiện tại không cần nên không làm.
3. Ẩn phải ghi `ActivityLog` (`PHOTO_HIDDEN`/`PHOTO_UNHIDDEN`) — người bị ẩn **không hề hay biết**, không có log thì không có gì để trả lời khiếu nại.

⚠️ **I6 và I7 không có đường lách qua API khác.** Cùng một service, cùng một `assertCan` — nếu có 2 chỗ kiểm tra thì sẽ có 1 chỗ quên.

---

## Cách dùng

### 1. Nhúng vào mọi PR

Ghép 7 dòng này vào mô tả PR hoặc checklist review:

```
- [ ] I1  mọi `where` tới Family/FamilyMember/Relationship có `groupFamilyId`
- [ ] I2  không method nào nhận `userId` mà bỏ qua
- [ ] I3  mọi route đọc/ghi group data có `:groupId` trong path
- [ ] I4  mutation có `version++` **đúng 1 lần** trong `$transaction`
- [ ] I5  mutation có `ActivityLog` trong `$transaction`
- [ ] I6  không endpoint nào tạo được group thứ 2 cho 1 tài khoản
- [ ] I7  mọi media có `createdById`; sửa/xoá/ẩn/thùng rác kiểm tra chủ hoặc group OWNER ở tầng service
```

Một dòng không tick → PR chưa xong, không merge.

### 2. Bất biến sai thì sửa bất biến, không sửa code

Nếu có lý do kỹ thuật để phá một bất biến: **viết lý do vào đây**, đổi mã bất biến, rồi mới code. Không sửa code trước rồi giấu đi.

Ví dụ hợp lệ: nếu sau này bật RLS ở tầng DB, thì I1 trở thành hàng phòng thủ kép — vẫn giữ, không xoá, vì RLS có thể bị tắt nhầm khi deploy.

### 3. Áp dụng cho mọi phase, không chỉ refactor

Phase 0-4 trong `04-thu-tu-thuc-hien.md` đều nghiệm thu theo 7 dòng này. Nhưng ràng buộc này có hiệu lực **từ PR đầu tiên** — nghĩa là các method sẵn có đang vi phạm cũng phải nằm trong danh sách việc.

---

## Danh sách vi phạm hiện tại (phải về 0)

Đây là phần cụ thể nhất của file này. Mỗi dòng là một chỗ phải sửa, không phải một nguyên tắc để nhớ.

| Bất biến | Chỗ vi phạm | Sửa ở |
|---|---|---|
| I1 | `family.service.ts:35` — `upsert` theo `id` do client sinh, không scope `groupFamilyId` | `02` §1 |
| I1 | `family.service.ts:62` — `deleteMany({ familyId, id: { notIn } })` không scope group | `02` §1 |
| I1 | `family.service.ts:71` — nhánh `update` của `familyMember.upsert` không set `familyId` | `02` §1 |
| I1 | `family.service.ts:130` — `relationship.deleteMany({ familyId })` không scope group | `02` §1 |
| I1 | `group-family.service.ts:275-304` (`pinMember`) — thao tác trên `GroupMember` không kiểm tra người gọi | `01` B5 |
| I2 | `family.service.ts:166-302` — 3 method nhận `userId` không dùng | `02` §3 |
| I3 | `auth.controller.ts:151` (`POST /auth/reset`) — không có `:groupId` không sao, nhưng endpoint này nằm ngoài mọi kiểm tra | `03` §9 |
| I3 | `user.service.ts:222-230` (`GET /users`) — không có `:groupId` mà đọc dữ liệu toàn hệ thống | `01` B2 |
| I4 | Không mutation nào có `version` — cột chưa tồn tại | `02` §2 |
| I5 | Không nơi nào ghi `ActivityLog` | `03` §10 |
| I5 | `EventService` roll-forward bằng cron — **cố ý không log** | `03` §10 (ghi rõ ngoại lệ) |
| **I6** | `POST /group-family` — không kiểm tra user đã thuộc group nào chưa, cứ tạo | `03` §4, `01` B11 |
| **I6** | `leaveGroup` — API rời nhóm tồn tại, tạo ra trạng thái 0 group không lối quay lại | `01` B11 |
| **I6** | `POST /auth/register` — không đọc `?token=`, mọi người đăng ký đều tạo group riêng | `03` §4 |
| **I6** | `GET /group-family` (danh sách group của user) + `/user/groups` — bề mặt cho trạng thái nhiều group | `01` B11 |
| **I7** | `Photo`/`Album`/`Event` **không có `createdById`** — không phân biệt được media của ai | `03` §11.1 |
| **I7** | Mọi service media **không kiểm tra chủ** — ai cũng sửa/xoá được ảnh của người khác | `03` §11.2 |
| **I7** | Không có cột `deletedById` — thùng rác không tách được theo người, không biết ai xoá | `03` §11.1 |
| **I7** | Không có cột `hiddenById` — không có khái niệm "ai ẩn", mở ẩn cho tất cả | `03` §11.1 |
| **I7** | Xoá `User` cascade xoá media → mất ảnh của nhóm; phải chuyển chủ cho group OWNER | `03` §11.3 |

---

## Phần mở rộng: các bất biến chưa đủ để bắt

7 bất biến trên bắt được các lỗi đã tìm ra. Ba lỗi dưới đây **không** nằm trong 7 bất biến — ghi ra để không mất:

| Lỗi | Vì sao 7 bất biến không bắt được | Nên thêm gì |
|---|---|---|
| `gender` validate `@IsString()` rồi ép `as GENDER` (`create-family.dto.ts:37-39`) | Không phải lỗi tenant hay versioning | Enum DTO dùng `@IsEnum()`, không ép kiểu ở controller |
| Client tự tính `generation` và tự ghi (`relationship-form.tsx:190-219`) | Không phải lỗi tenant, và `version` không bắt được vì client ghi đúng `version` | I4 chỉ bảo vệ *ghi*, không bảo vệ *tính*. Cần quy tắc riêng: **giá trị dẫn xuất phải do server tính** — xem `02` §9 |
| `Photo.takenAt String` + `locationName` bắt buộc (`album.prisma:22-23`) | Lỗi schema, không lỗi code | `02` §5 — constraint bị đặt sai chỗ phải sửa schema, không sửa được bằng bất biến |

→ Khi phát hiện lỗi mới **không** thuộc 7 bất biến: thêm một dòng vào bảng trên và cân nhắc nâng thành bất biến I8, I9... Mục tiêu là không lặp lại kiểu "phát hiện xong, ghi vào tài liệu, rồi quên".

---

## Liên quan

- `02-pham-vi-sua.md` §1 (IDOR), §2 (version), §3 (authz ở tầng service) — nơi sửa I1-I4
- `03-pham-vi-them.md` §10 (ActivityLog), §11 (soft delete + chủ media) — nơi sửa I5, I7
- `03-pham-vi-them.md` §4 (đăng ký `?token=`) — nơi sửa I6
- `01-pham-vi-bo.md` B11 (xoá `leaveGroup`, chặn group thứ 2) — nơi sửa I6
- `04-thu-tu-thuc-hien.md` — mỗi phase có 1 bước nghiệm thu theo file này
- Ánh xạ sang bất biến frontend: `../planing-refactor-fe/05-pham-vi-tiem-do.md` (F1–F7)
