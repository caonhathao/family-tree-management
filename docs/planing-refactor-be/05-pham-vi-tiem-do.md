# 05 — Phạm vi TIẾM ĐỘ (bất biến bắt buộc)

> **Đây không phải danh sách việc. Đây là điều không được vi phạm ở bất kỳ PR nào** — kể cả PR không thuộc đợt refactor này.
>
> Đây là phát hiện quan trọng nhất của toàn bộ khảo sát: hệ thống không hỏng vì thiếu tính năng, mà hỏng vì **không có bất biến nào được viết ra**. `RolesGuard` có thật, `Prisma` scope có thật, nhưng cả hai đều là thói quen của tác giả, không phải quy tắc của hệ thống — nên một method viết sai là IDOR (`02-pham-vi-sua.md` §1).

---

## 5 bất biến

| # | Bất biến | Vì sao | Bắt được bug nào đã xảy ra |
|---|---|---|---|
| **I1** | **Không câu `where`/`connect`/`update`/`delete` nào tới `FamilyMember`, `Family`, `Relationship` mà không scope `groupFamilyId`** | Tenant là `GroupFamily`; không có RLS, nên mọi `where` là hàng phòng thủ duy nhất | `family.service.ts:35,71` — IDOR cross-tenant (nghiêm trọng nhất) |
| **I2** | **Không method nào nhận `userId` mà không dùng nó** | Tham số không dùng = authz không ở tầng service = guard là hàng phòng thủ duy nhất | `family.service.ts:166-302` — `getFamilyData`/`updateFamilyInfo`/`deleteFamilyData` nhận `userId` rồi bỏ qua |
| **I3** | **Không route nào đọc/ghi dữ liệu group mà thiếu `:groupId`** | `RolesGuard` (`roles.guard.ts:46-73`) chỉ tra được khi route có `groupId` trong `req.params`. Không có `groupId` thì guard không có gì để kiểm | `RolesGuard:48` `return false` khi thiếu `groupId` — dễ dẫn tới bỏ luôn `groupId` khỏi route để "cho qua" |
| **I4** | **Mọi mutation phải `version++` trong cùng `$transaction`** | Hai người cùng sửa thì không có optimistic lock thì lần save sau âm thầm xoá việc của lần trước | `family.service.ts:62,130` — `deleteMany` xoá sạch thứ không có trong payload |
| **I5** | **Mọi mutation phải ghi `ActivityLog` trong cùng `$transaction`** | Log tách khỏi transaction thì log sai; log sai tệ hơn không có log | `grep 'activityLog.create'` trong `src/` → **0 kết quả** — bảng có schema, không bao giờ có dữ liệu |

---

## Cách dùng

### 1. Nhúng vào mọi PR

Ghép 5 dòng này vào mô tả PR hoặc checklist review:

```
- [ ] I1  mọi `where` tới Family/FamilyMember/Relationship có `groupFamilyId`
- [ ] I2  không method nào nhận `userId` mà bỏ qua
- [ ] I3  mọi route đọc/ghi group data có `:groupId` trong path
- [ ] I4  mutation có `version++` trong `$transaction`
- [ ] I5  mutation có `ActivityLog` trong `$transaction`
```

Một dòng không tick → PR chưa xong, không merge.

### 2. Bất biến sai thì sửa bất biến, không sửa code

Nếu có lý do kỹ thuật để phá một bất biến: **viết lý do vào đây**, đổi mã bất biến, rồi mới code. Không sửa code trước rồi giấu đi.

Ví dụ hợp lệ: nếu sau này bật RLS ở tầng DB, thì I1 trở thành hàng phòng thủ kép — vẫn giữ, không xoá, vì RLS có thể bị tắt nhầm khi deploy.

### 3. Áp dụng cho mọi phase, không chỉ refactor

Phase 0-4 trong `04-thu-tu-thuc-hien.md` đều nghiệm thu theo 5 dòng này. Nhưng ràng buộc này có hiệu lực **từ PR đầu tiên** — nghĩa là các method sẵn có đang vi phạm cũng phải nằm trong danh sách việc.

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

---

## Phần mở rộng: các bất biến chưa đủ để bắt

5 bất biến trên bắt được các lỗi đã tìm ra. Ba lỗi dưới đây **không** nằm trong 5 bất biến — ghi ra để không mất:

| Lỗi | Vì sao 5 bất biến không bắt được | Nên thêm gì |
|---|---|---|
| `gender` validate `@IsString()` rồi ép `as GENDER` (`create-family.dto.ts:37-39`) | Không phải lỗi tenant hay versioning | Enum DTO dùng `@IsEnum()`, không ép kiểu ở controller |
| Client tự tính `generation` và tự ghi (`relationship-form.tsx:190-219`) | Không phải lỗi tenant, và `version` không bắt được vì client ghi đúng `version` | I4 chỉ bảo vệ *ghi*, không bảo vệ *tính*. Cần quy tắc riêng: **giá trị dẫn xuất phải do server tính** — xem `02` §9 |
| `Photo.takenAt String` + `locationName` bắt buộc (`album.prisma:22-23`) | Lỗi schema, không lỗi code | `02` §5 — constraint bị đặt sai chỗ phải sửa schema, không sửa được bằng bất biến |

→ Khi phát hiện lỗi mới **không** thuộc 5 bất biến: thêm một dòng vào bảng trên và cân nhắc nâng thành bất biến I6, I7... Mục tiêu là không lặp lại kiểu "phát hiện xong, ghi vào tài liệu, rồi quên".

---

## Liên quan

- `02-pham-vi-sua.md` §1 (IDOR), §2 (version), §3 (authz ở tầng service) — nơi sửa I1-I4
- `03-pham-vi-them.md` §10 (ActivityLog), §11 (soft delete) — nơi sửa I5
- `04-thu-tu-thuc-hien.md` — mỗi phase có 1 bước nghiệm thu theo file này
