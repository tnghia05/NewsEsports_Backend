# Tài liệu API Backend (Bàn giao cho Frontend)

Base URL: **`https://backend36.dev/api/v1`**

## Xác thực & Header

- **Bearer token** (hầu hết các endpoint cần đăng nhập):
  - `Authorization: Bearer <access_token>`
- Cookie có thể tồn tại (refresh/csrf), nhưng FE chỉ cần dùng Bearer là đủ.

## Quy tắc gửi dữ liệu (QUAN TRỌNG — tránh lỗi 400)

Backend bật `ValidationPipe` với các tùy chọn:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Nghĩa là:

- **Không được gửi thêm field thừa** không có trong DTO → sẽ bị **HTTP 400**.
- Nếu field là optional, hãy **bỏ qua hẳn** thay vì gửi `""` (chuỗi rỗng vẫn có thể fail validator, ví dụ `@IsEmail()`).
- `qty` phải là **số nguyên >= 1**.

## Cấu trúc lỗi trả về

Thông thường lỗi có dạng:

```json
{ "message": "..." }
```

hoặc:

```json
{ "message": ["...","..."] }
```

Một số endpoint có thể trả về:

```json
{ "error": { "message": "...", "details": { "message": ["..."] } } }
```

FE nên hiển thị message tốt nhất có thể, không nên phụ thuộc cứng vào một dạng duy nhất.

---

## Đăng ký / Đăng nhập

### POST `https://backend36.dev/api/v1/auth/register` — Đăng ký tài khoản

Request:

```json
{ "email": "user@example.com", "password": "password", "displayName": "Tên hiển thị" }
```

Response:

```json
{
  "access_token": "jwt...",
  "user": { "id": "userId", "email": "user@example.com", "displayName": "Tên hiển thị", "role": "user" }
}
```

### POST `https://backend36.dev/api/v1/auth/login` — Đăng nhập

> ⚠️ **Throttle:** tối đa 8 request/60 giây. Nếu vượt quá → HTTP 429. FE nên hiện thông báo "Thử lại sau".

Request:

```json
{ "email": "user@example.com", "password": "password" }
```

Response:

```json
{
  "access_token": "jwt...",
  "user": { "id": "userId", "email": "user@example.com", "displayName": "Tên hiển thị", "role": "user" }
}
```

---

## Thông tin cá nhân

### GET `https://backend36.dev/api/v1/me` — Lấy thông tin người dùng hiện tại (cần đăng nhập)

Response:

```json
{ "id": "userId", "email": "user@example.com", "displayName": "Tên hiển thị", "role": "user", "avatarUrl": "https://..." }
```

---

## Bài viết (Feed)

### GET `https://backend36.dev/api/v1/posts` — Lấy danh sách bài viết (không bắt buộc đăng nhập)

> ⚠️ `tab=following` và `tab=saved` **bắt buộc phải đăng nhập** → sẽ trả 401 nếu không có token.

Query params:

- `tab`: `latest` (mới nhất) | `hot` (nổi bật) | `following` (đang theo dõi) | `saved` (đã lưu)
- `page`: số trang
- `limit`: số bài mỗi trang
- `game`: tên game (tùy chọn)
- `tag`: tag bài viết (tùy chọn, dạng `#tag` hoặc `tag`)

Response:

```json
{
  "items": [
    {
      "_id": "postId",
      "authorId": "userId",
      "author": { "id": "userId", "displayName": "Tên hiển thị", "avatarUrl": "https://..." },
      "title": "Tiêu đề bài viết",
      "content": "Nội dung...",
      "thumbnailUrl": "https://...",
      "game": "lol",
      "tags": ["lck"],
      "status": "published",
      "viewCount": 123,
      "commentCount": 4,
      "likeCount": 10,
      "likedByMe": false,
      "savedByMe": false,
      "createdAt": "2026-05-02T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 123,
  "hasMore": true
}
```

Lưu ý:

- FE hiển thị tên tác giả từ **`post.author.displayName`** (không dùng `authorId`).
- Khi chưa đăng nhập, `likedByMe` / `savedByMe` có thể bị bỏ qua trong response.

### GET `https://backend36.dev/api/v1/posts/:id` — Lấy chi tiết một bài viết (không bắt buộc đăng nhập)

Trả về một object bài viết, cấu trúc author giống trên:

```json
{
  "_id": "postId",
  "authorId": "userId",
  "author": { "id": "userId", "displayName": "Tên hiển thị", "avatarUrl": "https://..." }
}
```

---

## Cửa hàng — Đơn hàng (người dùng)

Tất cả endpoint bên dưới đều **cần đăng nhập** (`Authorization: Bearer <access_token>`).

### POST `https://backend36.dev/api/v1/orders` — Tạo đơn hàng mới

> ⚠️ Đơn được tạo với status `pending_payment` và TTL ~15 phút (`reservedUntil`). Nếu không thanh toán trong thời gian đó → tự động `cancelled_expired`.
> Sau khi tạo đơn, phải gọi ngay endpoint VNPay để lấy link thanh toán.

Request body (tên field **phải khớp chính xác**):

```json
{
  "items": [
    { "productId": "string", "variantId": "string (tùy chọn)", "qty": 1 }
  ],
  "receiverName": "string (tùy chọn)",
  "phone": "string (tùy chọn)",
  "email": "string (tùy chọn, phải là email hợp lệ)",
  "shippingAddress": "string (tùy chọn)",
  "shippingMethod": "string (tùy chọn)"
}
```

**QUAN TRỌNG:**

- **Không gửi** `receiverPhone`, `receiverEmail`, hoặc object lồng như `receiver: { ... }`.
- Bỏ qua các field tùy chọn nếu rỗng (tránh gửi `""`).

Response (rút gọn):

```json
{
  "_id": "orderId",
  "orderCode": "OD20260502-000001",
  "status": "pending_payment",
  "reservedUntil": "2026-05-02T00:15:00.000Z",
  "items": [{ "productId": "...", "variantId": "...", "qty": 1 }],
  "total": 99000,
  "payment": { "provider": "vnpay", "providerTxnRef": "OD20260502-000001" }
}
```

### GET `https://backend36.dev/api/v1/orders/me` — Lấy danh sách đơn hàng của tôi

Query params:

- `page`, `limit`
- `status` (tùy chọn): `pending_payment` | `paid` | `processing` | `shipped` | `delivered` | `cancelled` | `cancelled_expired` | `refunded`

### GET `https://backend36.dev/api/v1/orders/:id` — Xem chi tiết đơn hàng

Chỉ xem được đơn của chính mình.

### PATCH `https://backend36.dev/api/v1/orders/:id/cancel` — Huỷ đơn hàng

Chỉ huỷ được khi `status = pending_payment`.

Request:

```json
{ "reason": "string (tùy chọn)" }
```

Kết quả:

- status → `cancelled`
- tồn kho đã giữ chỗ được giải phóng (idempotent)

---

## Cửa hàng — Thanh toán (VNPay)

### POST `https://backend36.dev/api/v1/payments/vnpay/orders/:orderRef/url` — Tạo URL thanh toán VNPay (cần đăng nhập)

> ℹ️ `:orderRef` là `orderCode` hoặc `_id` của đơn hàng vừa tạo.
> **Luồng đúng:** `POST /orders` → lấy `orderCode` → gọi endpoint này → nhận `paymentUrl` → redirect user sang VNPay.
> Sau khi VNPay xử lý, server nhận IPN tự động — FE chỉ cần poll `GET /orders/:id` hoặc chờ redirect về `/payments/vnpay/return`.

Gọi sau khi tạo đơn hàng, để lấy link chuyển sang trang VNPay.

### GET `https://backend36.dev/api/v1/payments/vnpay/return` — URL trả về sau khi thanh toán (public)

> ⚠️ Endpoint này **không xác nhận thanh toán** — chỉ dùng để hiển thị trang "Đang xử lý" / "Cảm ơn" cho user. Trạng thái thực tế do IPN cập nhật. FE nên gọi `GET /orders/:id` để kiểm tra `status` thực.

Chỉ dùng cho UI. Logic nghiệp vụ được xử lý qua IPN.

### GET `https://backend36.dev/api/v1/payments/vnpay/ipn` — Callback từ server VNPay (public)

VNPay gọi server-to-server:

- Nếu `isSuccess=false` → đánh dấu thanh toán thất bại + giải phóng tồn kho giữ chỗ (idempotent)
- Nếu `isSuccess=true` và đơn vẫn đang `pending_payment` → xác nhận tồn kho và chuyển đơn sang `paid`
- Nếu TTL đã hết hạn → đơn chuyển sang `cancelled_expired` và tồn kho được giải phóng

---

## Quản trị — Đơn hàng (chỉ admin)

Tất cả endpoint yêu cầu quyền admin.

### GET `https://backend36.dev/api/v1/orders/admin/list` — Danh sách tất cả đơn hàng

Query params:

- `page`, `limit`
- `status` (tùy chọn)
- `q` (tìm kiếm tùy chọn): khớp với `orderCode`, `receiverName`, `receiverPhone`, `receiverEmail`, `shippingAddress`, `trackingCode`, hoặc `_id` (nếu là ObjectId hợp lệ)

Response:

```json
{ "items": [/* danh sách đơn */], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### GET `https://backend36.dev/api/v1/orders/admin/export.csv` — Xuất CSV đơn hàng

Query giống endpoint list. Trả về file CSV (UTF‑8 có BOM). Tối đa 5000 dòng.

### PATCH `https://backend36.dev/api/v1/orders/admin/:orderRef/status` — Cập nhật trạng thái đơn hàng

Request:

```json
{ "status": "processing", "trackingCode": "VN123..." }
```

### PATCH `https://backend36.dev/api/v1/orders/admin/:orderRef/cancel` — Admin huỷ đơn hàng

Request:

```json
{ "reason": "string (tùy chọn)", "restoreStock": true }
```

Lưu ý:

- Huỷ đơn `pending_payment`: tồn kho giữ chỗ được giải phóng.
- Huỷ đơn `paid/processing` với `restoreStock=true`: chỉ hoàn kho được khi `inventoryFinalized=true`.

### PATCH `https://backend36.dev/api/v1/orders/admin/:orderRef/notes` — Ghi chú nội bộ đơn hàng

Request:

```json
{ "internalNotes": "string (tùy chọn, tối đa 4000 ký tự)" }
```

Cập nhật ghi chú và thêm một entry vào audit log.

---

## Luồng đồng bộ tồn kho đơn hàng

- **Giữ chỗ (Reserve)** — xảy ra khi `POST /orders`:
  - `reserved += qty` (sản phẩm/variant)
  - Đơn ở trạng thái `pending_payment`, đặt `reservedUntil` (TTL)
- **Giải phóng (Release)** — xảy ra khi:
  - Người dùng huỷ đơn đang chờ thanh toán
  - Admin huỷ đơn đang chờ thanh toán
  - Worker tự động hết TTL → `cancelled_expired`
  - VNPay IPN báo thất bại/huỷ (`isSuccess=false`)
- **Xác nhận (Finalize)** — xảy ra khi VNPay IPN thành công:
  - `reserved -= qty`, `stock -= qty`
  - Đơn chuyển sang `paid`

Cờ idempotency:

- `reservationReleased: boolean`
- `inventoryFinalized: boolean`

Hai cờ này ngăn việc giải phóng hoặc xác nhận tồn kho bị thực hiện hai lần trong các race condition (worker vs IPN vs user/admin).

---

## Auth nâng cao

### POST `https://backend36.dev/api/v1/auth/google` — Đăng nhập bằng Google

> ℹ️ `id_token` lấy từ Google Sign-In SDK phía FE. Cần `GOOGLE_CLIENT_ID` được cấu hình đúng trên server.

Request:

```json
{ "id_token": "google-id-token..." }
```

Response: giống `/auth/login`.

### POST `https://backend36.dev/api/v1/auth/refresh` — Làm mới access token

> ⚠️ **Quan trọng:** Cookie `refresh_token` chỉ được gửi đến đúng path `/api/v1/auth/refresh` (httpOnly, tự động).
> Cookie `csrf_token` có thể đọc bằng JS (`document.cookie`). FE phải đọc giá trị đó và gửi vào header `x-csrf-token`.
> Nếu thiếu hoặc sai CSRF → HTTP 403.

Không cần body. Dùng cookie `refresh_token` + header `x-csrf-token`.

Response:

```json
{ "access_token": "jwt..." }
```

### POST `https://backend36.dev/api/v1/auth/logout` — Đăng xuất

> ℹ️ Endpoint này không throw lỗi ngay cả khi thiếu token — nó luôn xoá cookie và trả `{ ok: true }`. FE cứ gọi rồi redirect về trang login.

Không cần body. Dùng cookie `refresh_token` + header `x-csrf-token`.

Response:

```json
{ "ok": true }
```

---

## Thông tin cá nhân (mở rộng)

### GET `https://backend36.dev/api/v1/me/saved-posts` — Bài viết đã lưu của tôi (cần đăng nhập)

> ℹ️ Alias của `GET /posts?tab=saved`. Dùng cái này cho tiện, kết quả giống nhau.

Response: giống `GET /posts` (trả về `{ items, page, limit, total, hasMore }`).

---

## Bài viết — Tạo / Sửa / Xóa / Tương tác

### POST `https://backend36.dev/api/v1/posts` — Tạo bài viết (cần đăng nhập)

> ℹ️ `title` và `content` là bắt buộc. `status` mặc định là `published` nếu không truyền.

Request:

```json
{
  "title": "string",
  "content": "string",
  "game": "string (tùy chọn)",
  "tags": ["string"],
  "thumbnailUrl": "string (tùy chọn)",
  "status": "published | draft"
}
```

### PATCH `https://backend36.dev/api/v1/posts/:id` — Sửa bài viết (cần đăng nhập, chủ bài)

> ℹ️ Chỉ chủ bài hoặc admin mới sửa được. Người khác → 403.

Request: các field giống tạo, đều tùy chọn.

### DELETE `https://backend36.dev/api/v1/posts/:id` — Xóa bài viết (cần đăng nhập, chủ bài hoặc admin)

### POST `https://backend36.dev/api/v1/posts/:id/like` — Toggle like bài viết (cần đăng nhập)

> ℹ️ **Toggle:** gọi lần 1 = like, gọi lần 2 = unlike. Dùng field `likedByMe` trong response của `GET /posts` để biết trạng thái hiện tại.

Response:

```json
{ "liked": true }
```

### POST `https://backend36.dev/api/v1/posts/:id/save` — Toggle lưu bài viết (cần đăng nhập)

> ℹ️ **Toggle:** tương tự like. Dùng `savedByMe` để biết trạng thái.

Response:

```json
{ "saved": true }
```

### GET `https://backend36.dev/api/v1/posts/:id/likes` — Danh sách người đã like

Query params: `page`, `limit`

### POST `https://backend36.dev/api/v1/posts/:id/pin` — Ghim bài viết (chỉ admin)

### POST `https://backend36.dev/api/v1/posts/:id/unpin` — Bỏ ghim bài viết (chỉ admin)

---

## Bình luận

### GET `https://backend36.dev/api/v1/posts/:postId/comments` — Danh sách bình luận của bài viết (không bắt buộc đăng nhập)

> ℹ️ Chỉ trả **bình luận gốc** (top-level, `parentId = null`). Để lấy reply, gọi `GET /comments/:id/replies`.

Query params: `page`, `limit`

### GET `https://backend36.dev/api/v1/news/:newsId/comments` — Danh sách bình luận của tin tức (không bắt buộc đăng nhập)

> ℹ️ Tương tự comments bài viết — chỉ trả top-level.

Query params: `page`, `limit`

### GET `https://backend36.dev/api/v1/comments/:id/replies` — Danh sách reply của bình luận (không bắt buộc đăng nhập)

Query params: `page`, `limit`

### POST `https://backend36.dev/api/v1/posts/:postId/comments` — Tạo bình luận cho bài viết (cần đăng nhập)

> ℹ️ Muốn reply một comment → truyền `parentId` là ID của comment cha. Nếu không có `parentId` → comment gốc.

Request:

```json
{ "content": "string", "parentId": "string (tùy chọn, nếu là reply)" }
```

### POST `https://backend36.dev/api/v1/news/:newsId/comments` — Tạo bình luận cho tin tức (cần đăng nhập)

Request: giống trên.

### PATCH `https://backend36.dev/api/v1/comments/:id` — Sửa bình luận (cần đăng nhập, chủ bình luận)

Request:

```json
{ "content": "string" }
```

### DELETE `https://backend36.dev/api/v1/comments/:id` — Xóa bình luận (cần đăng nhập, chủ bình luận hoặc admin)

### POST `https://backend36.dev/api/v1/comments/:id/like` — Toggle like bình luận (cần đăng nhập)

---

## Người dùng

### POST `https://backend36.dev/api/v1/users/:id/follow` — Toggle follow người dùng (cần đăng nhập)

> ⚠️ Không thể follow chính mình → 400. **Toggle:** gọi lại = unfollow.

Response:

```json
{ "following": true }
```

### GET `https://backend36.dev/api/v1/users/:id/posts` — Bài viết của một người dùng (không bắt buộc đăng nhập)

Query params: `page`, `limit`

Response: giống `GET /posts`, kèm thêm field `following: boolean`.

### GET `https://backend36.dev/api/v1/users/:id/followers` — Danh sách người theo dõi

Query params: `page`, `limit`

### GET `https://backend36.dev/api/v1/users/:id/following` — Danh sách đang theo dõi

Query params: `page`, `limit`

---

## Tìm kiếm

### GET `https://backend36.dev/api/v1/search/posts` — Tìm bài viết

Query params: `q`, `page`, `limit`

### GET `https://backend36.dev/api/v1/search/users` — Tìm người dùng

Query params: `q`, `page`, `limit`

### GET `https://backend36.dev/api/v1/search/suggest` — Gợi ý từ khoá

> ℹ️ Dùng cho autocomplete. Nên **debounce** 300ms trước khi gọi để tránh spam request.

Query params: `q`, `limit`

### GET `https://backend36.dev/api/v1/search/hot` — Từ khoá tìm nhiều nhất

Query params: `window` (`1h|24h|7d`), `limit`

### GET `https://backend36.dev/api/v1/search/trends` — Xu hướng tìm kiếm

Query params: `window`, `limit`

### POST `https://backend36.dev/api/v1/search/events` — Ghi nhận sự kiện tìm kiếm (không bắt buộc đăng nhập)

> ℹ️ Dùng cho analytics (hot keywords, trends). Gọi **fire-and-forget** khi user submit search — không cần chờ response, không hiện lỗi cho user nếu fail.

Request:

```json
{ "keyword": "string" }
```

---

## Thông báo

Tất cả endpoint cần đăng nhập.

### GET `https://backend36.dev/api/v1/notifications` — Danh sách thông báo

> ℹ️ Nên gọi sau khi đăng nhập để hiển thị badge số thông báo chưa đọc. Dùng `page` + `limit` để phân trang.

Query params: `page`, `limit`

### POST `https://backend36.dev/api/v1/notifications/:id/read` — Đánh dấu đã đọc một thông báo

### POST `https://backend36.dev/api/v1/notifications/read-all` — Đánh dấu đã đọc tất cả thông báo

---

## Tin tức

### GET `https://backend36.dev/api/v1/news` — Danh sách tin tức (public)

Query params: `page`, `limit`, `game`, `tag`

### GET `https://backend36.dev/api/v1/news/:id` — Chi tiết tin tức theo ID (public)

### GET `https://backend36.dev/api/v1/news/slug/:slug` — Chi tiết tin tức theo slug (public)

> ℹ️ **Ưu tiên dùng cái này** cho trang chi tiết tin tức (SEO-friendly URL). Dùng `/:id` khi chỉ có ID.

### GET `https://backend36.dev/api/v1/news/admin/list` — Danh sách tin tức (chỉ admin)

Query params: `page`, `limit`, `status`

### POST `https://backend36.dev/api/v1/news/admin` — Tạo tin tức (chỉ admin)

### PATCH `https://backend36.dev/api/v1/news/admin/:id` — Sửa tin tức (chỉ admin)

### DELETE `https://backend36.dev/api/v1/news/admin/:id` — Xóa tin tức (chỉ admin)

### POST `https://backend36.dev/api/v1/news/admin/bulk-delete` — Xóa nhiều tin tức (chỉ admin)

Request:

```json
{ "ids": ["id1", "id2"] }
```

### POST `https://backend36.dev/api/v1/news/admin/import-rss` — Import tin tức từ RSS ngay lập tức (chỉ admin)

### POST `https://backend36.dev/api/v1/news/admin/crawl-now` — Chạy crawl ngay lập tức (chỉ admin)

---

## Sản phẩm (Shop)

### GET `https://backend36.dev/api/v1/products` — Danh sách sản phẩm (public)

Query params: `page`, `limit`, `game`, `q`

### GET `https://backend36.dev/api/v1/products/:id` — Chi tiết sản phẩm (public)

### GET `https://backend36.dev/api/v1/products/:id/variants` — Danh sách variants của sản phẩm (public)

### GET `https://backend36.dev/api/v1/products/admin/list` — Danh sách sản phẩm (chỉ admin)

> ℹ️ Route `admin/list` được khai báo **trước** `:id` trong controller nên không bị nhầm thành product ID. Nhưng FE không nên gọi `/products/admin` mà thiếu quyền → sẽ 403.

### POST `https://backend36.dev/api/v1/products/admin` — Tạo sản phẩm (chỉ admin)

### PATCH `https://backend36.dev/api/v1/products/admin/:id` — Sửa sản phẩm (chỉ admin)

### DELETE `https://backend36.dev/api/v1/products/admin/:id` — Xóa sản phẩm (chỉ admin)

### GET `https://backend36.dev/api/v1/products/admin/:id/variants` — Danh sách variants (chỉ admin)

### POST `https://backend36.dev/api/v1/products/admin/:id/variants` — Tạo variant (chỉ admin)

### PATCH `https://backend36.dev/api/v1/products/admin/variants/:variantId` — Sửa variant (chỉ admin)

### DELETE `https://backend36.dev/api/v1/products/admin/variants/:variantId` — Xóa variant (chỉ admin)

---

## Hashtag

### GET `https://backend36.dev/api/v1/hashtags/:tag/posts` — Bài viết theo hashtag

Query params: `page`, `limit`

### GET `https://backend36.dev/api/v1/hashtags/trending` — Hashtag trending

Query params: `window` (`1h|24h|7d`)

### GET `https://backend36.dev/api/v1/hashtags/hot-topics` — Chủ đề nổi bật

### POST `https://backend36.dev/api/v1/hashtags/events` — Ghi nhận sự kiện xem hashtag (không bắt buộc đăng nhập)

Request:

```json
{ "tag": "string" }
```

---

## Upload file

### POST `https://backend36.dev/api/v1/uploads/r2/presign` — Lấy presigned URL để upload file lên R2 (cần đăng nhập)

> ⚠️ **Luồng upload:**
> 1. Gọi endpoint này để lấy `uploadUrl` và `publicUrl`
> 2. Dùng **`PUT`** (không phải POST) để upload file trực tiếp lên `uploadUrl`
> 3. **Không gửi Authorization header** khi PUT lên R2 — presigned URL đã có quyền sẵn
> 4. Sau khi upload xong, lưu `publicUrl` vào bài viết/sản phẩm

Request:

```json
{
  "fileName": "string",
  "contentType": "string (MIME type)",
  "folder": "string (tùy chọn, mặc định: misc)"
}
```

Response:

```json
{ "uploadUrl": "https://...", "publicUrl": "https://..." }
```

FE upload file trực tiếp lên `uploadUrl` bằng `PUT`, sau đó lưu `publicUrl` vào bài viết/sản phẩm.

---

## Quản trị — Nguồn crawl (chỉ admin)

### GET `https://backend36.dev/api/v1/admin/crawl-sources` — Danh sách nguồn crawl

### POST `https://backend36.dev/api/v1/admin/crawl-sources` — Thêm nguồn crawl

### PATCH `https://backend36.dev/api/v1/admin/crawl-sources/:id` — Sửa nguồn crawl

### DELETE `https://backend36.dev/api/v1/admin/crawl-sources/:id` — Xóa nguồn crawl

---

## Quản trị — Nguồn RSS (chỉ admin)

### GET `https://backend36.dev/api/v1/admin/rss-sources` — Danh sách nguồn RSS

### POST `https://backend36.dev/api/v1/admin/rss-sources` — Thêm nguồn RSS

### PATCH `https://backend36.dev/api/v1/admin/rss-sources/:id` — Sửa nguồn RSS

### DELETE `https://backend36.dev/api/v1/admin/rss-sources/:id` — Xóa nguồn RSS

---

## Trận đấu (Matches) — Milestone 10

Dữ liệu được đồng bộ tự động từ PandaScore (hoặc mock) qua cron worker mỗi 5 phút (cấu hình `MATCH_SYNC_INTERVAL_MS`).

### GET `/api/v1/matches` — Danh sách trận đấu

**Query params:**

| Tên | Kiểu | Mặc định | Mô tả |
|-----|------|---------|-------|
| `tab` | `live\|upcoming\|finished\|all` | `all` | Lọc theo trạng thái |
| `game` | string | — | Lọc theo game: `lol`, `csgo`, `dota2`, `valorant`, `ow2`, `rl`, … |
| `region` | string | — | Lọc theo league slug: `lck`, `lcs`, `lec`, `vcs`, … (case-insensitive) |
| `page` | number | `1` | Trang |
| `limit` | number | `20` | Số item mỗi trang (tối đa 100) |

**Response:**
```json
{
  "items": [
    {
      "_id": "...",
      "externalId": "12345",
      "game": "lol",
      "region": "lck",
      "status": "not_started",
      "startsAt": "2025-05-10T13:00:00.000Z",
      "teams": [
        { "name": "T1", "acronym": "T1", "imageUrl": "...", "score": null, "externalId": 1 },
        { "name": "Gen.G", "acronym": "GEN", "imageUrl": "...", "score": null, "externalId": 2 }
      ],
      "matchName": "T1 vs Gen.G",
      "tournamentName": "LCK Spring 2025 Playoffs",
      "leagueName": "LCK",
      "serieName": "Spring 2025",
      "numberOfGames": 5,
      "syncedAt": "2025-05-10T12:55:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "hasMore": true
}
```

**Status values:** `live` | `not_started` | `finished`

---

### GET `/api/v1/matches/stats` — Số lượng theo trạng thái

**Response:**
```json
{ "live": 3, "upcoming": 18, "finished": 45, "total": 66 }
```

---

### GET `/api/v1/matches/:id` — Chi tiết trận đấu

---

### POST `/api/v1/matches/admin/sync-now` — Kích hoạt sync thủ công (chỉ admin)

Yêu cầu `Authorization: Bearer <admin_token>`.

**Response:**
```json
{ "ok": true, "upserted": 27, "provider": "pandascore" }
```

---

## Cấu hình môi trường — Matches

| Biến | Mặc định | Mô tả |
|------|---------|-------|
| `MATCH_DATA_PROVIDER` | `pandascore` | `pandascore` hoặc `mock` (dùng mock khi dev chưa có token) |
| `PANDASCORE_TOKEN` | — | Token API từ [pandascore.co](https://pandascore.co) |
| `MATCH_SYNC_INTERVAL_MS` | `300000` | Chu kỳ sync (ms), mặc định 5 phút |


