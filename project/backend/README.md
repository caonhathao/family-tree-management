# Family-Tree Management System — Backend

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

The REST API backend of the Family-Tree Management System, built with NestJS, Prisma, and PostgreSQL. It exposes a documented API (global prefix `/api`) consumed by the frontend in `../frontend`.

## ✨ Highlights

-   Controller–Service–Repository architecture with a `src/modules/*` feature layout
-   JWT authentication (access/refresh tokens) via Passport strategies + Google OAuth ID-token verification
-   Role-based access control on family groups: `owner` / `editor` / `viewer`, plus a per-member `isLeader` flag
-   Invite flow: token-based invite links with expiry (cleaned up nightly by a scheduled job)
-   Family-tree sync API: upsert a whole tree (`family` + `members` + `relationships`) in a transaction
-   Recurring events (daily/weekly/monthly) with a scheduled roll-forward job and instance lifecycle (`SCHEDULED → ONGOING → COMPLETED`)
-   In-app notifications (`GroupNotification`) and email notifications (Resend + `react-email` templates) — emails are **experimental** and skipped when `RESEND_API_KEY` is not set
-   Albums/photos and file uploads backed by Cloudinary
-   Blog & blog-media management
-   Swagger documentation at `/api/docs`, health check at `/api/health-check`

## 🗄️ Data Model (Prisma)

The schema is split into multiple files under `prisma/schema/`:

| Model | Purpose |
| --- | --- |
| `User`, `UserProfile`, `Account`, `AuthProvider`, `Session`, `Verification`, `AuthLog` | Users, profiles, and authentication |
| `GroupFamily`, `GroupMember` | Family groups and memberships/roles |
| `Invite` | Token-based group invites |
| `Family`, `FamilyMember`, `Relationship` | The family tree (graph of members) |
| `Event`, `EventRecurrence`, `EventInstance` | Events and recurring instances |
| `GroupNotification`, `EmailLog` | In-app notifications and email delivery logs |
| `Album`, `Photo` | Photo albums |
| `Blog`, `BlogMedia` | Blog posts and media |
| `ActivityLog` | Activity audit trail |

## 🛠️ Project Setup

### Prerequisites

-   Node.js (v20+)
-   pnpm
-   PostgreSQL

### Installation & Configuration

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` with your database credentials and secrets (see [Environment Variables](#environment-variables)).

Run the database migration:

```bash
pnpm prisma migrate dev
```

### Compile and run the project

```bash
# watch mode (development)
pnpm start:dev

# production mode
pnpm build && pnpm start:prod
```

### Run tests

```bash
# unit tests
pnpm test

# test coverage
pnpm test:cov

# e2e tests
pnpm test:e2e
```

### Code quality

```bash
pnpm lint    # run ESLint with auto-fix
pnpm format  # format with Prettier
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (default `3001`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET_KEY` | Yes | Access-token signing secret |
| `JWT_REFRESH_SECRET_KEY` | Yes | Refresh-token signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access-token lifetime in seconds |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh-token lifetime in seconds |
| `MAX_FILE_SIZE` | Yes | Max upload size in MB |
| `RESEND_API_KEY` | No | Resend API key for event emails (email notifications are skipped when empty) |
| `MAIL_FROM` | No | Sender address used by Resend |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_URL` | Yes | Cloudinary credentials |
| `FOLDER_ALBUM` / `FOLDER_USER` / `FOLDER_FAMILY` / `FOLDER_BLOG` | Yes | Cloudinary folder names |
| `CLIENT_DOMAIN` | No | Legacy single frontend origin |
| `CORS_ORIGINS` | Yes* | Comma-separated list of allowed frontend origins (falls back to `CLIENT_DOMAIN`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID used to verify Google login tokens |

A complete sample with placeholder values is provided in `.env.example`.

## 🔌 API & CORS

-   All endpoints are prefixed with `/api` (e.g. `POST /api/auth/login-base`).
-   Interactive Swagger docs are available at `/api/docs`.
-   Health check endpoint: `GET /api/health-check`.
-   CORS accepts the origins listed in `CORS_ORIGINS` (comma-separated), with `credentials: true`. When deploying, add every production frontend origin there.

## ⏰ Scheduled Jobs

-   **Event lifecycle** (`EventSchedulerService`): rolls recurring events forward into `EventInstance` rows, updates instance statuses, and sends today/reminder emails. (Currently set to run every minute for testing; intended to run daily.)
-   **Invite cleanup** (`TasksService`): deletes expired invite tokens daily at midnight (`Asia/Ho_Chi_Minh`).

## 🌐 Deployment

Deploy this directory as an **independent service** on any Node host (Render, Railway, a VPS, or Vercel):

1.  Set the environment variables above, most importantly `DATABASE_URL` and `CORS_ORIGINS`.
2.  Run migrations: `pnpm prisma migrate deploy`.
3.  Start with `pnpm start:prod` (or the platform's default build/start commands). Keep the process running long-term so scheduled jobs execute.

The backend does not depend on the frontend being on the same platform or domain.
