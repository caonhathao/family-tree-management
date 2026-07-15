# Future Development Roadmap & Pending Features

## Table of Contents

1. [Sidebar & UI Mockups — Built but Non-Functional](#sidebar--ui-mockups--built-but-non-functional)
2. [Schema-Ready Features — Database Models Without Application Logic](#schema-ready-features--database-models-without-application-logic)
3. [Backend Stubs — Scaffolded Modules Awaiting Implementation](#backend-stubs--scaffolded-modules-awaiting-implementation)
4. [Technical Debt & TODOs](#technical-debt--todos)
5. [Recommended Priority Roadmap](#recommended-priority-roadmap)

---

## Sidebar & UI Mockups — Built but Non-Functional

The application has multiple sidebar navigation systems with menu items that are **rendered in the UI but point to routes with no corresponding page implementations**. These represent planned features that have visual scaffolding but lack backend integration or page logic.

### User Profile Sidebar (`/user/*`)

Located at `app/user/_components/sidebar/sidebar-profile.tsx`, this sidebar contains **6 non-functional menu items**:

| Menu Item | Vietnamese Label | Target Route | Status | Notes |
|-----------|-----------------|-------------|--------|-------|
| Danh sách nhóm | "Danh sách" | `/user/group` | **No page** | Should list all groups the user belongs to |
| Kho lưu trữ | "Kho lưu trữ" | `/user/storage` | **No page** | Planned cloud storage view for user files |
| Thùng rác | "Thùng rác" | `/user/trash` | **No page** | Soft-deleted items recovery |
| Hỗ trợ | "Hỗ trợ" | `/user/support` | **No page** | Help/support center |
| Phản hồi | "Phản hồi" | `/user/feadback` | **No page** | Feedback submission (note: URL has typo "feadback") |

**Functional items** in this sidebar:
- "Thông tin cá nhân" → `/user/profile` (implemented)
- "Bảo mật" → `/user/security` (implemented)
- "Lời mời" → `/user/invite-list` (implemented at `/user/invite`)

### Admin Sidebar (`/admin/*`)

Located at `app/admin/_components/sidebar/admin-sidebar-client.tsx`, this sidebar contains **2 non-functional menu items**:

| Menu Item | Vietnamese Label | Target Route | Status | Notes |
|-----------|-----------------|-------------|--------|-------|
| Phản hồi người dùng | "Phản hồi" | `/admin/user_feedbacks` | **No page** | Admin view of user feedback submissions |
| Hỗ trợ | "Hỗ trợ" | `/admin/supports` | **No page** | Admin support ticket management |

**Bug detected:** Line 155 of `admin-sidebar-client.tsx` references `data.genetal` instead of `data.general`, which would cause the "Tổng quan" (Dashboard) section to fail rendering.

**Functional items** in this sidebar:
- "Tổng quan" → `/admin` (implemented)
- "Danh sách người dùng" → `/admin/users` (implemented)
- "Soạn thảo bài viết" → `/admin/blog_editor` (implemented)
- "Danh sách bài viết" → `/admin/blogs` (implemented)

### Public Navigation Bar

Located at `app/(public)/_components/navigation-menu.tsx`:

| Menu Item | Target Route | Status |
|-----------|-------------|--------|
| Features | `/features` | Implemented |
| Tutorials | `/tutorials` | **No page** |
| FAQ | `/faq` | **No page** |

---

## Schema-Ready Features — Database Models Without Application Logic

These Prisma models exist in the database schema and have full table structures, but lack active frontend pages or backend API endpoints.

### 1. Notification System

**Model:** `Notification` (table: `notification`)
**Fields:** id, userId, title, content, type (NEW/UPDATE/DELETE/OTHER), isRead, link, createdAt
**Relations:** Belongs to User (1:N)

**Current state:**
- Schema is fully defined with `NOTIFICATION_TYPE` enum
- Seed data exists (`notification.seed.ts`)
- **No frontend page, no API endpoints, no UI components**
- No real-time push mechanism configured

**Required work:**
- Backend: Notification CRUD endpoints, mark-as-read, bulk operations
- Frontend: Notification inbox page, real-time notification bell/dropdown
- Integration: Trigger notifications on family tree changes, group events, invitations
- Optional: WebSocket/SSE for real-time delivery

### 2. Event Management

**Model:** `Event` (table: `event`)
**Fields:** id, familyId, title, description, eventDate, isRecurring, type (BIRTHDAY/WEDDING/DEATH_ANNIVERSARY/OTHER), createBy
**Relations:** Belongs to User (creator), Many-to-Many with GroupFamily

**Current state:**
- Schema is fully defined with `EVENT_TYPE` enum
- Seed data exists (`event.seed.ts`)
- Backend has **empty stub** module (`modules/events/` — all files are empty)
- **No frontend page, no API endpoints**

**Required work:**
- Backend: Implement EventsModule (controller, service, DTOs)
- Frontend: Event listing page, event creation form, calendar view
- Integration: Event creation triggers for family milestones
- Cron: Recurring event auto-generation

### 3. Album & Photo Management

**Models:** `Album` (table: `album`), `Photo` (table: `photo`)
**Album Fields:** id, familyId, title, description, createdBy, createdAt
**Photo Fields:** id, albumId, imageUrl, takenAt, locationName, description
**Relations:** Album belongs to User (creator), Many-to-Many with GroupFamily; Photo belongs to Album (1:N)

**Current state:**
- Schema fully defined
- Seed data exists (`album.seed.ts`)
- Backend has **stub module** (`modules/albums/` — placeholder comments only)
- **No frontend page, no API endpoints**
- Cloudinary service is already implemented (upload/destroy)

**Required work:**
- Backend: Implement AlbumsModule (CRUD, photo upload, gallery queries)
- Frontend: Album grid/list page, photo upload, lightbox viewer, album creation
- Integration: Album creation in group context, activity log entries

### 4. Verification / Email Verification

**Model:** `Verification` (table: `verification`)
**Fields:** id, identifier, value, expiresAt, createdAt, updatedAt

**Current state:**
- Schema defined
- **No application logic** — not used anywhere in auth flow
- Registration marks `emailVerified: false` but never sends verification email

**Required work:**
- Email service integration (SendGrid, Resend, etc.)
- Token generation and storage
- Verification endpoint
- UI for resend verification
- Mark `emailVerified: true` on successful verification

### 5. Activity Log (Partial)

**Model:** `ActivityLog` (table: `activity_log`)
**Fields:** id, familyId, userId, action, targetId, target, content, createdAt
**Relations:** Belongs to Family, Belongs to User

**Current state:**
- Schema fully defined with `ACTION_TYPE` and `TARGET_TYPE` enums
- Seed data exists
- **No application code writes to this table** — schema exists but no service creates activity log entries

**Required work:**
- Middleware/service to intercept family tree mutations and create log entries
- Activity log viewing page (family history timeline)
- Filtering by action type, target type, date range

---

## Backend Stubs — Scaffolded Modules Awaiting Implementation

The NestJS backend has two fully scaffolded modules with file structures but **zero implementation**:

### Albums Module (`src/modules/albums/`)

```
albums/
├── albums.module.ts        # "Register controllers and services"
├── albums.controller.ts    # "Receive HTTP requests from the frontend"
├── albums.service.ts       # "Contains the main business logic"
└── dto/
    ├── create-albums.dto.ts  # "Data requirements when adding new members"
    └── update-albums.dto.ts  # "Data requirements when updating new members"
```

All files contain only placeholder comments.

### Events Module (`src/modules/events/`)

```
events/
├── events.module.ts        # Empty
├── events.controller.ts    # Empty
├── events.service.ts       # Empty
└── dto/
    ├── create-events.dto.ts  # Empty
    └── update-events.dto.ts  # Empty
```

All files are completely empty (0 lines of code).

---

## Technical Debt & TODOs

### High Priority

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 1 | **Schema drift between frontend and backend** | `prisma/schema/` | Frontend and backend have divergent Prisma schemas with different field sets, enum definitions, and relation patterns. Should be unified into a shared schema or managed via a single source of truth. |
| 2 | **Typo in User model relation** | Frontend `user.prisma` | `sesstion` should be `sessions` (double-s typo). Backend has the correct spelling. |
| 3 | **Admin sidebar bug** | `admin-sidebar-client.tsx:155` | `data.genetal` should be `data.general` — the "Overview" dashboard section won't render. |
| 4 | **Invite URL typo** | `sidebar-profile.tsx` | `/user/feadback` should be `/user/feedback` |
| 5 | **Password reset not implemented** | Backend `auth.service.ts` | `resetPassword` finds user by email but does not generate/send OTP or reset link. |

### Medium Priority

| # | Issue | Description |
|---|-------|-------------|
| 6 | **No session expiry cron job** | Backend has a cron for cleaning expired invites, but **no cron for cleaning expired sessions**. Stale sessions accumulate in the database. |
| 7 | **Multi-provider account linking** | If a user registers with email/password and later tries Google login with the same email, there's no account linking flow. The system treats them as separate auth paths. |
| 8 | **No CSRF protection** | Server actions rely on cookie-based auth but lack explicit CSRF token validation. Next.js SameSite cookies provide some protection, but explicit CSRF tokens would be more robust. |
| 9 | **Blog media orphan cleanup is manual** | `cleanupOrphanedMediaAction` exists but is not triggered automatically. Orphaned Cloudinary images accumulate. |
| 10 | **No rate limiting** | Auth endpoints (login, register, refresh) have no rate limiting, making them vulnerable to brute-force attacks. |
| 11 | **Verification model unused** | The `Verification` table exists but is never written to or read from. Email verification is not implemented. |

### Low Priority

| # | Issue | Description |
|---|-------|-------------|
| 12 | **Shared package is empty** | `project/shared/` exists but contains no code. Types and constants duplicated between frontend and backend. |
| 13 | **No API versioning** | Backend routes use `/api/` prefix but no version segment (e.g., `/api/v1/`). Future breaking changes will be difficult to manage. |
| 14 | **No E2E tests** | Backend has E2E test configuration but no actual test files beyond the default `app.e2e-spec.ts`. |
| 15 | **Frontend Prisma URL commented out** | `schema.prisma` has `url = env("DATABASE_URL")` commented out — relies on `prisma.config.ts` for URL resolution. |
| 16 | **Inconsistent error handling** | Frontend uses `handleError()` utility while backend uses `ResponseFactory.handleError()`. Error response shapes may differ. |
| 17 | **No request logging** | No HTTP request logging middleware (e.g., Morgan) in the NestJS backend. |

---

## Recommended Priority Roadmap

### Phase 1: Stabilization (Weeks 1-2)

- [ ] Fix schema drift — unify frontend/backend Prisma schemas or establish shared source
- [ ] Fix typos: `sesstion` → `sessions`, `data.genetal` → `data.general`, `feadback` → `feedback`
- [ ] Implement session expiry cron job
- [ ] Add rate limiting to auth endpoints
- [ ] Implement password reset flow (OTP via email)
- [ ] Add email verification flow

### Phase 2: Core Missing Features (Weeks 3-5)

- [ ] Implement Notifications system (backend endpoints + frontend inbox)
- [ ] Implement Events module (full CRUD + calendar UI)
- [ ] Implement Albums/Photos module (full CRUD + gallery UI)
- [ ] Write ActivityLog entries on family tree mutations
- [ ] Build activity log viewing page

### Phase 3: UX Completion (Weeks 6-8)

- [ ] Build User Storage page (`/user/storage`)
- [ ] Build User Trash page (`/user/trash`)
- [ ] Build User Support page (`/user/support`)
- [ ] Build User Feedback page (`/user/feedback`)
- [ ] Build Admin User Feedbacks page (`/admin/user_feedbacks`)
- [ ] Build Admin Supports page (`/admin/supports`)
- [ ] Build Tutorials page (`/tutorials`)
- [ ] Build FAQ page (`/faq`)

### Phase 4: Enhancement (Weeks 9-12)

- [ ] Multi-provider account linking (merge Google + email accounts)
- [ ] Real-time notifications via WebSocket/SSE
- [ ] CSRF token protection
- [ ] Automatic blog media orphan cleanup
- [ ] API versioning (`/api/v1/`)
- [ ] E2E test coverage
- [ ] Request logging middleware
- [ ] Push notification support (PWA)
