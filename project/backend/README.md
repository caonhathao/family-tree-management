# Family-Tree Management System — Backend

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)](https://swagger.io/)

The REST API backend of the Family-Tree Management System, built with NestJS, Prisma, and PostgreSQL. It exposes a documented API (global prefix `/api`) consumed by the frontend in `../frontend`.

## Highlights

- Controller–Service architecture with `src/modules/*` feature layout (14 modules)
- JWT authentication (access/refresh tokens) via Passport strategies + Google OAuth
- Role-based access control: `owner` / `editor` / `viewer` with 3-layer guard chain
- Family-tree sync API: upsert entire tree in a transaction (`family` + `members` + `relationships`)
- Recurring events with scheduled roll-forward and instance lifecycle
- In-app notifications (`GroupNotification`) and email notifications (Resend + `react-email`)
- Albums/photos and file uploads backed by Cloudinary
- Blog & blog-media management with Editor.js
- Swagger documentation at `/api/docs`, health check at `/api/health-check`

## Data Model

23 Prisma models organized across multiple schema files.

→ Schema: [`prisma/schema/`](./prisma/schema/)

| Category | Models |
|----------|--------|
| User & Auth | User, Account, UserProfile, AuthProvider, Session, Verification, AuthLog |
| Family Tree | Family, FamilyMember, Relationship |
| Groups | GroupFamily, GroupMember, Invite |
| Events | Event, EventRecurrence, EventInstance |
| Notifications | GroupNotification, EmailLog |
| Content | Album, Photo, Blog, BlogMedia |
| Activity | ActivityLog |

See [Architecture Map](../docs/architecture_map.html) for interactive ERD explorer.

## Project Setup

### Prerequisites

- Node.js (v20+)
- pnpm
- PostgreSQL

### Installation

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` with your database credentials and secrets (see [Environment Variables](#environment-variables)).

Run the database migration:

```bash
pnpm prisma migrate dev
```

### Development

```bash
pnpm start:dev    # Watch mode
pnpm build        # Production build
pnpm start:prod   # Run production
```

### Testing

```bash
pnpm test         # Unit tests
pnpm test:cov     # Test coverage
pnpm test:e2e     # End-to-end tests
```

### Code Quality

```bash
pnpm lint         # ESLint with auto-fix
pnpm format       # Prettier
```

## Common Patterns

### ResponseFactory

Standardized API response envelope used across all controllers.

→ Source: [`src/common/factories/response.factory.ts`](./src/common/factories/response.factory.ts)
→ Types: [`src/common/interfaces/response.interface.ts`](./src/common/interfaces/response.interface.ts)

| Method | Purpose |
|--------|---------|
| `ResponseFactory.success()` | Standard success response |
| `ResponseFactory.paginated()` | Paginated list response |
| `ResponseFactory.cursorPaginated()` | Cursor-based pagination |
| `ResponseFactory.error()` | Error response |
| `ResponseFactory.handleError()` | Central error handler (ServiceError, ZodError, Prisma errors) |

### ServiceError

Custom error class for business logic errors with HTTP status codes.

→ Source: [`src/common/errors/`](./src/common/errors/)

### Decorators

| Decorator | Purpose | Source |
|-----------|---------|--------|
| @Roles() | Role-based access control | [`src/common/decorators/roles.decorator.ts`](./src/common/decorators/roles.decorator.ts) |
| @Leader() | Require group leader/owner | [`src/common/decorators/leader.decorator.ts`](./src/common/decorators/leader.decorator.ts) |
| @GetUser() | Inject full user object | [`src/common/decorators/get-user.decorator.ts`](./src/common/decorators/get-user.decorator.ts) |
| @GetUserId() | Inject user ID from JWT | [`src/common/decorators/get-user-id.decorator.ts`](./src/common/decorators/get-user-id.decorator.ts) |

### Guard Chain

3-layer RBAC enforcement:

```
Request → AtGuard (JWT) → RolesGuard (role) → GroupLeaderGuard → Controller
```

→ Source: [`src/common/guards/`](./src/common/guards/)

### Prisma Transactions

Critical multi-table operations use `$transaction` for atomicity:

- Registration: User → Account → AuthProvider → UserProfile → Session → AuthLog
- Family Tree Sync: Upsert Family → Upsert Members → Delete old Relationships → Create new Relationships

## API Response Format

All responses follow standardized envelope:

→ Source: [`src/common/factories/response.factory.ts`](./src/common/factories/response.factory.ts)

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "success",
  "code": 200
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "message": "success",
  "code": 200,
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "code": 400,
  "errors": { "field": ["error details"] }
}
```

## Security

### Token Lifecycle

- Access Token: HS256, short-lived (configurable, default 10 minutes)
- Refresh Token: HS256, long-lived (7 days default)
- Storage: httpOnly, secure, sameSite: "lax"

### Header Injection

Proxy layer injects verified user context into request headers:

| Header | Purpose |
|--------|---------|
| `x-user-id` | Authenticated user's UUID |
| `x-user-role` | User's system role (ADMIN/USER) |
| `x-access-token` | Fresh access token (after silent refresh) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET_KEY` | Yes | Access-token signing secret |
| `JWT_REFRESH_SECRET_KEY` | Yes | Refresh-token signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access-token lifetime in seconds |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh-token lifetime in seconds |
| `MAX_FILE_SIZE` | Yes | Max upload size in MB |
| `RESEND_API_KEY` | No | Resend API key for event emails |
| `MAIL_FROM` | No | Sender address used by Resend |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_URL` | Yes | Cloudinary credentials |
| `FOLDER_ALBUM` / `FOLDER_USER` / `FOLDER_FAMILY` / `FOLDER_BLOG` | Yes | Cloudinary folder names |
| `CLIENT_DOMAIN` | No | Legacy single frontend origin |
| `CORS_ORIGINS` | Yes* | Comma-separated allowed frontend origins |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |

A complete sample with placeholder values is provided in `.env.example`.

## API & CORS

- All endpoints are prefixed with `/api` (e.g. `POST /api/auth/login-base`)
- Interactive Swagger docs: `/api/docs`
- Health check: `GET /api/health-check`
- CORS accepts origins listed in `CORS_ORIGINS` (comma-separated), with `credentials: true`

## Scheduled Jobs

→ Source: [`src/schedule/`](./src/schedule/)

| Job | Schedule | Description |
|-----|----------|-------------|
| EventSchedulerService | Every minute (testing) / Daily (production) | Rolls recurring events forward, updates instance statuses, sends emails |
| TasksService | Daily at midnight (Asia/Ho_Chi_Minh) | Deletes expired invite tokens |

## Modules

| Module | Purpose | Source |
|--------|---------|--------|
| AuthModule | Register, login (base + Google), refresh, JWT strategies | [`src/modules/auth/`](./src/modules/auth/) |
| UserModule | Profile CRUD, avatar upload | [`src/modules/users/`](./src/modules/users/) |
| FamilyModule | Tree sync via $transaction, member + relation ops | [`src/modules/family/`](./src/modules/family/) |
| GroupFamilyModule | Group CRUD, join/quit | [`src/modules/group-family/`](./src/modules/group-family/) |
| GroupMemberModule | Role management, leader transfer | [`src/modules/group-members/`](./src/modules/group-members/) |
| InviteModule | Token generation, 24h expiry | [`src/modules/invite/`](./src/modules/invite/) |
| EventsModule | Event CRUD, recurrence, instance generation | [`src/modules/events/`](./src/modules/events/) |
| NotificationsModule | In-app + email notifications (Resend) | [`src/modules/notifications/`](./src/modules/notifications/) |
| AlbumsModule | Album + photo CRUD, Cloudinary upload | [`src/modules/albums/`](./src/modules/albums/) |
| BlogModule | Blog CRUD | [`src/modules/blog/`](./src/modules/blog/) |
| BlogMediaModule | Media upload & orphan cleanup | [`src/modules/blog-media/`](./src/modules/blog-media/) |
| HealthCheckModule | GET /health-check | [`src/modules/health-check/`](./src/modules/health-check/) |

## Deployment

Deploy as an **independent service** on any Node host (Render, Railway, VPS, Vercel):

1. Set environment variables (most importantly `DATABASE_URL` and `CORS_ORIGINS`)
2. Run migrations: `pnpm prisma migrate deploy`
3. Start with `pnpm start:prod`

Keep the process running long-term so scheduled jobs execute.

## Related Documentation

- [Root README](../README.md) — Project overview
- [Frontend README](../project/frontend/README.md) — Frontend documentation
- [Architecture Map](../docs/architecture_map.html) — Interactive module & ERD explorer
- [System Features](../docs/en-features.html) — Complete feature list
