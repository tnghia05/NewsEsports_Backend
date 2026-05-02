# Backend API Contract (Frontend handoff)

Base path: **`/api/v1`**

## Auth & headers

- **Bearer token** (most user endpoints):
  - `Authorization: Bearer <access_token>`
- Cookies may exist (refresh/csrf), but FE can rely on Bearer for API calls.

## Validation rules (IMPORTANT — prevents 400)

This backend enables Nest `ValidationPipe` with:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

Meaning:

- **Do not send extra keys** not declared in DTOs → **HTTP 400**.
- If a field is optional, prefer **omit it** instead of sending `""` (empty string can still fail validators, e.g. `@IsEmail()`).
- `qty` must be **integer >= 1**.

## Error shape

Typical error response is one of:

```json
{ "message": "..." }
```

or:

```json
{ "message": ["...","..."] }
```

Some endpoints may return:

```json
{ "error": { "message": "...", "details": { "message": ["..."] } } }
```

Frontend should display the best available message; do not hard-depend on a single shape.

---

## Auth

### POST `/auth/register`

Request:

```json
{ "email": "user@example.com", "password": "password", "displayName": "My Name" }
```

Response:

```json
{
  "access_token": "jwt...",
  "user": { "id": "userId", "email": "user@example.com", "displayName": "My Name", "role": "user" }
}
```

### POST `/auth/login`

Request:

```json
{ "email": "user@example.com", "password": "password" }
```

Response:

```json
{
  "access_token": "jwt...",
  "user": { "id": "userId", "email": "user@example.com", "displayName": "My Name", "role": "user" }
}
```

---

## Me

### GET `/me` (auth)

Response:

```json
{ "id": "userId", "email": "user@example.com", "displayName": "My Name", "role": "user", "avatarUrl": "https://..." }
```

---

## Posts (Feed)

### GET `/posts` (optional auth)

Query (common):

- `tab`: `latest | hot | following | saved`
- `page`: number
- `limit`: number
- `game`: string (optional)
- `tag`: string (optional, `#tag` or `tag`)

Response (items are posts):

```json
{
  "items": [
    {
      "_id": "postId",
      "authorId": "userId",
      "author": { "id": "userId", "displayName": "My Name", "avatarUrl": "https://..." },
      "title": "....",
      "content": "...",
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

Notes:

- FE should render author name from **`post.author.displayName`** (not `authorId`).
- When not logged in, `likedByMe/savedByMe` may be omitted.

### GET `/posts/:id` (optional auth)

Returns a single post object. Same author shape:

```json
{
  "_id": "postId",
  "authorId": "userId",
  "author": { "id": "userId", "displayName": "My Name", "avatarUrl": "https://..." }
}
```

---

## Shop — Orders (user)

All endpoints below require auth (`Authorization: Bearer ...`).

### POST `/orders`

Request body (DTO keys **must match** exactly):

```json
{
  "items": [
    { "productId": "string", "variantId": "string (optional)", "qty": 1 }
  ],
  "receiverName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional, must be valid email)",
  "shippingAddress": "string (optional)",
  "shippingMethod": "string (optional)"
}
```

IMPORTANT:

- Do **NOT** send `receiverPhone`, `receiverEmail`, or nested objects like `receiver: { ... }`.
- Omit optional fields if empty (avoid `""`).

Response (simplified):

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

### GET `/orders/me`

Query:

- `page`, `limit`
- `status` (optional): `pending_payment|paid|processing|shipped|delivered|cancelled|cancelled_expired|refunded`

### GET `/orders/:id`

Order detail for current user.

### PATCH `/orders/:id/cancel`

User can cancel only when `status=pending_payment`.

Request:

```json
{ "reason": "string (optional)" }
```

Effect:

- status → `cancelled`
- reserved inventory is released (idempotent)

---

## Shop — Payments (VNPay)

### POST `/payments/vnpay/create-payment-url` (auth)

Used after creating an order, to get VNPay payment URL.

### GET `/payments/vnpay/return` (public)

Return URL for UI only. Business status is handled by IPN.

### GET `/payments/vnpay/ipn` (public)

VNPay server-to-server callback:

- If `isSuccess=false` → payment marked failed + release reservation (idempotent)
- If `isSuccess=true` and order still `pending_payment` → finalize inventory and mark order `paid`
- If TTL already expired → order becomes `cancelled_expired` and reservation is released

---

## Admin / Ops — Orders (admin only)

All endpoints require admin role.

### GET `/orders/admin/list`

Query:

- `page`, `limit`
- `status` (optional)
- `q` (optional search): matches `orderCode`, `receiverName`, `receiverPhone`, `receiverEmail`, `shippingAddress`, `trackingCode`, or `_id` (if valid ObjectId)

Response:

```json
{ "items": [/* orders */], "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

### GET `/orders/admin/export.csv`

Same query as list. Returns CSV file (UTF‑8 with BOM). Max 5000 rows.

### PATCH `/orders/admin/:orderRef/status`

Request:

```json
{ "status": "processing", "trackingCode": "VN123..." }
```

### PATCH `/orders/admin/:orderRef/cancel`

Request:

```json
{ "reason": "string (optional)", "restoreStock": true }
```

Notes:

- If cancelling `pending_payment`: reservation is released.
- If cancelling `paid/processing` and `restoreStock=true`: stock can be restored only when `inventoryFinalized=true`.

### PATCH `/orders/admin/:orderRef/notes`

Request:

```json
{ "internalNotes": "string (optional, max 4000)" }
```

Updates internal notes and appends an audit log entry.

---

## Order inventory sync (quick mental model)

- **Reserve** happens during `POST /orders`:
  - `reserved += qty` (product/variant)
  - order status `pending_payment`, `reservedUntil` set (TTL)
- **Release** happens when:
  - user cancels pending order
  - admin cancels pending order
  - worker expires TTL → `cancelled_expired`
  - VNPay IPN fail/cancel (`isSuccess=false`)
- **Finalize** happens on VNPay IPN success:
  - `reserved -= qty`, `stock -= qty`
  - order status → `paid`

Idempotency flags:

- `reservationReleased: boolean`
- `inventoryFinalized: boolean`

These flags prevent double release/finalize in race conditions (worker vs IPN vs user/admin actions).

