# 06 — Workflow người dùng (hệ thống SAU khi sửa)

> Đọc file này để biết **sau khi hoàn thành refactor, hệ thống giúp người dùng làm được gì**. Không phải kế hoạch — kế hoạch ở `01`–`05`.
>
> ⚠️ **Chỉ liệt kê tính năng không còn pending.** Mọi thứ đang ghi *"chưa làm / đang chờ / pending"* đều không có ở đây. Danh sách loại trừ nằm ở bảng cuối.
>
> Mô hình nền: **1 tài khoản = 1 cây gia phả** (Q16). Người dùng không bao giờ phải chọn "gia đình nào" — vì không có gì để chọn.

---

## 1. Ai làm được gì — đọc trước mọi thứ khác

Hệ thống có **2 trục quyền độc lập**, không phải 1 thang "vai cao hơn = quyền nhiều hơn".

### Trục 1 — Cây gia đình: quyền theo vai

Cây là **dữ liệu dùng chung** nên cần người coi cùng đồng ý.

| | OWNER | EDITOR | VIEWER |
|---|---|---|---|
| Thêm / sửa / xoá thành viên | ✅ | ✅ | ❌ |
| Thêm / sửa / xoá quan hệ (vợ, con) | ✅ | ✅ | ❌ |
| Đặt tên & kiểu gia đình | ✅ | ✅ | ❌ |
| Gán ảnh cho node | ✅ | ✅ | ❌ |
| Bố cục: *Sắp xếp* / *Lưu* | ✅ | ✅ | ❌ |
| Lịch sử thay đổi — dòng cây | ✅ | ✅ | ❌ |
| Xuất / nhập dữ liệu cây | ✅ | ✅ | ❌ |
| Rủ thêm người, đổi vai, bàn giao quyền | ✅ | ✅ | ❌ |

### Trục 2 — Media: quyền theo chủ sở hữu

Media là **của người upload**, nên người upload quyết.

| | Chủ media | Người khác (EDITOR) | Người khác (VIEWER) | group OWNER |
|---|---|---|---|---|
| Xem ảnh / album đang hiện | ✅ | ✅ | ✅ | ✅ |
| Thêm ảnh, tạo album | ✅ | ✅ | ✅ | — |
| Sửa / xoá media của mình | ✅ | — | — | ✅ |
| Xoá / khôi phục ảnh của mình | ✅ | — | — | ✅ |
| Sửa / xoá / ẩn media của **người khác** | ❌ | ❌ | ❌ | ✅ |
| Xem ảnh đã ẩn của người khác | ❌ | ❌ | ❌ | ✅ |
| Mở ẩn ảnh của người khác | ❌ | ❌ | ❌ | ✅ |
| Xem thùng rác của mình | ✅ | — | — | ✅ |
| Xem thùng rác của người khác | ❌ | ❌ | ❌ | ✅ |

Ba điều dễ nhầm, nói thẳng:

- **EDITOR sửa được mọi thứ trong cây nhưng không xoá được ảnh của người khác.** Có chủ ý.
- **Ẩn ảnh là "người khác không thấy"**, không phải "không ai biết". OWNER vẫn thấy và mở ẩn được.
- **Xoá ảnh là vào thùng rác, không mất ngay.** Thùng rác tách theo người: bạn chỉ thấy và chỉ khôi phục được phần mình xoá.

---

## 2. Hành trình người mới — 2 nhánh, không có nhánh thứ ba

Đăng ký là **ngã ba**. Hệ thống xử lý bằng cách hỏi: *bạn có link mời không?*

```
mở /auth/register
        │
        ├── CÓ ?token= trong link
        │     → bước 2.1
        │
        └── KHÔNG có token
              → bước 2.2
```

### 2.1 Nhánh vào bằng link mời

1. Bấm link mời → trang đăng ký mở ra, có sẵn token trong URL.
2. Điền tên, email, mật khẩu → bấm **Đăng ký**.
3. Vào thẳng **cây của người mời**, vai **VIEWER**.

Người này **không có cây riêng**, và không bao giờ có. Họ thấy cây, xem và thêm ảnh. Muốn sửa cây thì cần ai đó nâng vai.

⚠️ Nếu link **hết hạn** hoặc **đã dùng**, hệ thống báo rõ và **dừng lại** — không tự tạo cây riêng cho họ. Vì tạo nhầm thì người đó có 2 cây mà không hề hay biết.

### 2.2 Nhánh tự đăng ký

1. Mở `/auth/register` không có token.
2. Điền thông tin → bấm **Đăng ký**.
3. Hệ thống tự tạo **1 gia đình** + **1 cây gia phả rỗng**. Người này là **OWNER**.
4. Vào màn hình cây, bắt đầu thêm người.

Không có bước "chọn tên gia đình trước" — tên gia đình và kiểu gia đình sẽ sửa ở §3.

---

## 3. Ngày thường — dựng cây

### 3.1 Thêm người

Bấm **+ Thêm thành viên** → điền tên → **Lưu**. Người mới xuất hiện trên cây ngay.

Có thể bấm **+ Thêm quan hệ** để nối họ với người khác: vợ chồng, cha mẹ, con cái. Không cần thêm trước rồi mới nối sau.

### 3.2 Sửa thông tin

Bấm vào node → sửa tên, ngày sinh, nghề nghiệp, ghi chú → **Lưu**.

### 3.3 Đặt tên gia đình

Mở phần cài đặt gia đình → đổi tên nhóm và chọn kiểu (họ nội, họ ngoại, tổ, dòng họ…) → **Lưu**.

### 3.4 Bấm Lưu — một lần, an toàn

Nút **Lưu** toàn cục vẫn còn, và cố ý giữ: người dùng không phải bấm lưu 20 lần cho 20 thay đổi.

Nhưng bên trong nó chỉ gửi **những thứ đã đổi**, trong **một lần gọi**, và server xử lý **tất cả cùng lúc** — thành công thì cả 20 thay đổi, thất bại thì không thay đổi nào. Không có trường hợp sửa được 8/20.

---

## 4. Bố cục — 1 tầng, không có bản riêng

Chỉ có **một** bố cục chung cho cả cây.

| Thao tác | Kết quả |
|---|---|
| Kéo node bằng tay | Chỉ sắp xếp trên màn hình hiện tại. **F5 là mất**, không hỏi, không cảnh báo |
| Bấm **Sắp xếp** | Tự xếp lại cho gọn rồi lưu cho cả nhóm xem |
| Bấm **Lưu** | Ghi thay đổi **+** tự xếp lại + lưu bố cục, tất cả trong 1 lần |
| Xem cây | Ai cũng thấy bố cục giống nhau, luôn luôn |

**VIEWER không kéo được node** — kéo xong cũng mất nên không cho làm.

Có thể phóng to, thu nhỏ, kéo màn hình để xem. VIEWER dùng được phần này.

---

## 5. Rủ người nhà, đổi vai, bàn giao quyền

### 5.1 Rủ người nhà

1. Mở phần thành viên → **Tạo link mời**.
2. Copy link, gửi qua Zalo, email, hoặc bất kỳ đâu.
3. Hết hạn sau 7 ngày.

Xong. **Không cần xem danh sách ai đã gửi, không cần thu hồi, không cần bật/tắt link.** Gửi đi đâu thì kệ — có link là vào.

### 5.2 Đổi vai trò

Mở menu thành viên → bấm **Đổi vai trò** → chọn `EDITOR` hoặc `VIEWER`.

Chỉ EDITOR ↔ VIEWER. Không nâng được lên OWNER qua đây — chỉ có 1 OWNER duy nhất, và cách duy nhất để đổi là bàn giao.

### 5.3 Bàn giao quyền OWNER

Cài đặt gia đình → **Chuyển quyền sở hữu** → chọn người nhận → xác nhận.

- Người nhận thành OWNER.
- Bạn chuyển thành **EDITOR** — **không bị đuổi khỏi cây**.
- Nếu nhóm chưa có EDITOR nào thì người nhận lấy EDITOR làm vai bắt đầu, để không mất người quản lý khi bạn rời đi.

### 5.4 Rời khỏi nhóm — không tồn tại

Cố ý không có. Người dùng muốn rời thì **xoá tài khoản** ở phần Bảo mật. Ảnh đã upload chuyển quyền sở hữu cho OWNER của nhóm, không bị xoá.

---

## 6. Hai người cùng sửa

Không ai ghi đè tay ai.

Nếu bạn mở cây lúc version 12, và trong lúc đó người khác bấm Lưu (thành 13), thì lúc bạn bấm Lưu:

1. Hệ thống **từ chối**, không ghi.
2. Báo rõ: *cây vừa được cập nhật, bạn có thay đổi chưa lưu — xem bản mới hay giữ thay đổi của bạn*.
3. **Không tự thử lại, không tự gộp.** Chọn mất thay đổi của mình là chủ ý của bạn, không phải của hệ thống.

---

## 7. Lịch sử thay đổi

Mỗi lần ai đó thay đổi gì đó đều được ghi lại: ai, làm gì, lúc nào.

**Lọc theo vai:**

| Vai | Thấy dòng nào |
|---|---|
| OWNER / EDITOR | Tất cả — thành viên, quan hệ, tên nhóm, ảnh, sự kiện |
| VIEWER | Chỉ dòng **ảnh / album / sự kiện** — không thấy dòng thành viên, quan hệ, tên nhóm |

Lý do: VIEWER vào để xem ảnh, không cần biết ai vừa đổi tên gia đình hay vừa thêm người.

Cuộn được, có phân trang, không cần tải hết một lượt.

---

## 8. Ảnh và album

### 8.1 Ảnh đại diện của node — lấy từ ảnh hồ sơ của chính người đó

- Mỗi người tự quản lý ảnh hồ sơ của mình.
- Khi bạn bấm **Đây là tôi** (ghim mình vào node), node đó **tự lấy ảnh hồ sơ của bạn**.
- Ảnh được **chụp tại thời điểm ghim**. Sau này bạn đổi ảnh hồ sơ, ảnh trên cây **không tự đổi theo** — vì cây đó có thể đang thuộc về cây của người khác.
- OWNER/EDITOR có thể **gán tay** ảnh khác cho bất kỳ node nào (trường hợp không có ảnh hồ sơ, hoặc muốn dùng ảnh gia đình).

### 8.2 Album

Tạo album có tên, có mô tả, ảnh vào album.

- Album **có chủ** — người tạo.
- Chủ album: sửa, xoá, thêm ảnh vào đều được.
- group OWNER: quản lý được album của người khác.
- EDITOR/VIEWER: **không** sửa/xoá album của người khác, dù sửa được cây.

### 8.3 Ẩn ảnh

Bấm **Ẩn** → ảnh biến mất khỏi album với mọi người **trừ bạn và OWNER**. Nhãn *Đã ẩn* hiện luôn, kèm nút **Mở ẩn**.

- Ẩn là chỉ "không ai thấy", không phải "không ai hay biết" — OWNER thấy và có thể mở ẩn.
- Bạn không xoá được gì bạn không nhìn thấy.

### 8.4 Thùng rác — tách làm 2

| Tab | Ai thấy | Ai được khôi phục |
|---|---|---|
| **Thùng rác cây** | OWNER, EDITOR | OWNER, EDITOR — thành viên & quan hệ đã xoá |
| **Thùng rác ảnh** | Chủ media, group OWNER | Chính người đó — **không ai khôi phục giúp được** |

Xoá ảnh **không** làm mất ảnh đang nằm trong album khác.

---

## 9. Chia sẻ — người ngoài xem không cần tài khoản

Tạo link chia sẻ → gửi cho bất kỳ ai.

Người mở link **không cần đăng nhập** và chỉ xem được:

- Cây gia phả
- Ảnh và album đang hiện
- Sự kiện

Họ **không** thấy: ảnh đã ẩn, thùng rác, lịch sử thay đổi, và không thêm/xoá/sửa gì được.

---

## 10. Xuất — nhập

### 10.1 Xuất

Xuất cây ra tệp (PDF hoặc ảnh PNG) để in treo tường, hoặc xuất toàn bộ dữ liệu ra tệp để lưu trữ.

Ảnh xuất ra **không ghi tên người upload lên giấy** — bản thân cây đã là dữ liệu riêng của nhà, in ra là chủ đích.

### 10.2 Nhập

Nạp lại tệp cây đã xuất. Có xem trước trước khi ghi.

**Chỉ OWNER/EDITOR** được nhập — đây là thay đổi lớn trên cây dùng chung.

---

## 11. Sự kiện

Ghi các mốc trong gia đình: sinh, cưới, giỗ, tưởng niệm.

- Sự kiện gắn với một hoặc nhiều người trên cây.
- Sự kiện **có chủ** — người tạo, quy tắc sửa/xoá giống media.
- Ngày lễ, ngày sinh, ngày cưới hiển thị thành danh sách sắp tới.
- Ảnh sự kiện: chủ là người upload, theo đúng luật ở §1 trục 2.

---

## 12. Những thứ KHÔNG còn ở đây

Bảng này quan trọng ngang với phần còn lại — vì bản nháp cũ của tài liệu này còn mô tả chúng là tính năng.

| Không còn | Vì sao |
|---|---|
| Danh sách nhóm / chọn gia đình | 1 tài khoản = 1 cây, không có gì để chọn |
| Nút *Rời khỏi nhóm* | Tự tạo ra trạng thái ngõ cụt. Muốn rời thì xoá tài khoản |
| Danh sách lời mời đã gửi | Cố ý không có màn quản lý — gửi link đi đâu thì kệ |
| Bố cục riêng của tôi | Chỉ 1 bố cục chung, kéo tay thì F5 là mất |
| Băng chuyền "bố cục riêng" | Không còn tầng cá nhân để cảnh báo |
| VIEWER tự sắp xếp bố cục | Không kéo được nữa — kéo xong cũng mất |
| Xác thực email | Chưa làm |
| Trang quản trị, blog, kho lưu trữ, hỗ trợ, phản hồi | Bề mặt thương mại của mô hình SaaS cũ |
| Danh sách khách mời sự kiện | Cố ý cắt — sự kiện chỉ là mốc thời gian, không phải RSVP |
| Gộp trùng khi nhập | Không làm — nhập là nạp nguyên xi |

---

## Liên kết

| Cần chi tiết về | Xem |
|---|---|
| Quyết định thiết kế Q1–Q17 | [README](./README.md) |
| Danh sách việc cụ thể | [01](./01-pham-vi-bo.md) · [02](./02-pham-vi-sua.md) · [03](./03-pham-vi-them.md) |
| Thứ tự làm | [04](./04-thu-tu-thuc-hien.md) |
| Ràng buộc bắt buộc | [05](./05-pham-vi-tiem-do.md) |
| Phía backend | [be/06-bo-sung-tu-khao-sat-fe.md](../planing-refactor-be/06-bo-sung-tu-khao-sat-fe.md) |
