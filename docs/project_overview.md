# Project Technical Documentation & Overview

## Table of Contents

1. [Project Summary](#project-summary)
2. [Core Tech Stack](#core-tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema & Models](#database-schema--models)
5. [Core Features Implemented](#core-features-implemented)
6. [Security & Authentication](#security--authentication)
7. [Deployment & Configuration](#deployment--configuration)

---

## Project Summary

**Family Free Management** is a full-stack family tree management platform built as a monorepo with two independent applications: a **Next.js 16 frontend** (App Router + Turbopack) and a **NestJS backend** (REST API). The application enables users to create, manage, and visualize multi-generational family trees with role-based collaborative editing, invitation systems, event tracking, blog publishing, and photo album management.

The project uses a **dual-Prisma schema** architecture — both frontend and backend maintain independent Prisma configurations that connect to the same PostgreSQL database, with the frontend schema being the more evolved and feature-complete version.

---

## Core Tech Stack

### Frontend (`project/frontend/`)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.6 | App Router with Server Components, Turbopack bundler |
| **Language** | TypeScript | ^5 | Type-safe development |
| **React** | React | 19.2.4 | UI library with React Compiler enabled |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS with `tw-animate-css` |
| **UI Components** | shadcn/ui (Radix UI) | ^1.4.3 | Accessible, composable UI primitives |
| **State Management** | Redux Toolkit | ^2.11.2 | Global state (family draft, user profile, blog) |
| **ORM** | Prisma | ^7.4.0 | Database access via `@prisma/adapter-pg` + `pg` pool |
| **Forms** | React Hook Form + Zod | ^7.71.0 / ^4.3.5 | Form management and validation |
| **Auth (Client)** | `@react-oauth/google` | ^0.13.5 | Google OAuth2 sign-in |
| **Auth (Server)** | `jose` | ^6.1.3 | JWT creation and verification (HS256) |
| **Password Hashing** | `bcrypt` | ^6.0.0 | Salted password hashing (10 rounds) |
| **Image Management** | Cloudinary + `next-cloudinary` | ^2.9.0 / ^6.17.5 | Cloud image upload, transform, and CDN |
| **Family Tree Viz** | `@xyflow/react` (React Flow) | ^12.10.0 | Interactive node-based family tree editor |
| **Tree Layout** | `@dagrejs/dagre` | ^2.0.4 | Automatic tree layout algorithm |
| **Rich Text Editor** | Editor.js | ^2.31.3 | Block-based content editor for blogs |
| **Animations** | Framer Motion | ^12.30.0 | Motion library for UI transitions |
| **Internationalization** | `next-intl` | ^4.8.2 | i18n framework (Vietnamese messages) |
| **Theming** | `next-themes` | ^0.4.6 | Light/Dark/System theme switching |
| **Date Handling** | `date-fns` | ^4.1.0 | Date utility library |
| **Data Tables** | `@tanstack/react-table` | ^8.21.3 | Headless table for admin data views |
| **CLI Component** | `cmdk` | ^1.1.1 | Command palette component |
| **Drawer** | `vaul` | ^1.1.2 | Drawer component |
| **Toasts** | `sonner` | ^2.0.7 | Toast notification system |
| **Icons** | `react-icons` + `lucide-react` | ^5.5.0 / ^0.563.0 | Multi-library icon sets |

### Backend (`project/backend/`)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | NestJS | ^11.0.1 | Enterprise Node.js framework |
| **Language** | TypeScript | ^5.7.3 | Type-safe development |
| **ORM** | Prisma | ^7.2.0 | Database access |
| **Auth** | `@nestjs/passport` + `@nestjs/jwt` | ^11.0.5 / ^11.0.2 | JWT Passport strategies |
| **Validation** | `class-validator` + `class-transformer` | ^0.14.3 / ^0.5.1 | DTO validation |
| **API Docs** | Swagger (`@nestjs/swagger`) | ^11.2.5 | Auto-generated API documentation |
| **Scheduling** | `@nestjs/schedule` | ^6.1.0 | Cron job execution |
| **Testing** | Jest + Supertest | ^30.0.0 / ^7.0.0 | Unit and E2E testing |
| **Cloud Storage** | Cloudinary | ^2.8.0 | Image upload service |

### Shared (`project/shared/`)

Reserved for shared types and constants between frontend and backend (currently empty).

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│  React 19 + Next.js 16 (App Router + Turbopack)             │
│  ├── Server Components (data fetching, auth verification)   │
│  ├── Client Components (interactive UI, forms, tree editor) │
│  ├── Server Actions (form submissions, mutations)           │
│  └── Redux Toolkit (client-side state: family, user, blog)  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST API + Cookies)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS PROXY LAYER (proxy.ts)            │
│  ├── JWT Access Token verification (jose)                   │
│  ├── Silent Refresh (automatic token rotation)              │
│  ├── RBAC enforcement (ADMIN routes)                        │
│  └── Header injection (x-user-id, x-user-role)              │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│  NEXT.JS SERVER  │    │      NESTJS BACKEND (API)        │
│  (Server Actions)│    │  ├── Auth Module (JWT + OAuth)   │
│  ├── Auth Module │    │  ├── Users Module                │
│  ├── User Module │    │  ├── Family Module               │
│  ├── Blog Module │    │  ├── Group-Family Module         │
│  ├── Family Mod. │    │  ├── Group-Members Module        │
│  ├── Group Mod.  │    │  ├── Invite Module               │
│  ├── Invite Mod. │    │  ├── Albums Module (stub)        │
│  └── Blog Media  │    │  ├── Events Module (stub)        │
│                  │    │  └── Health-Check Module         │
└────────┬─────────┘    └──────────┬───────────────────────┘
         │                         │
         └───────────┬─────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  Prisma ORM (@prisma/adapter-pg + pg.Pool)                  │
│  20+ models across 11 schema files                          │
└─────────────────────────────────────────────────────────────┘
```

### Service-Action-Module Pattern (Frontend)

The frontend follows a layered architecture for each feature module:

```
modules/<feature>/
├── <feature>.actions.ts          # "use server" Server Actions (entry point)
├── <feature>.service.ts          # Business logic (Prisma queries, JWT, bcrypt)
├── <feature>.dto.ts              # TypeScript interfaces for data transfer
├── <feature>.service-validator.ts # Zod schemas for server-side validation
└── <feature>.client-schemas.ts   # Zod schemas for client-side form validation
```

**Data flow:**
1. **Client Component** → calls `Server Action` (via `"use server"` function)
2. **Server Action** → validates input with Zod → calls **Service**
3. **Service** → executes business logic with Prisma → returns typed DTO
4. **Server Action** → sets cookies / returns response to client

### Controller-Service Pattern (Backend)

The backend follows standard NestJS conventions:

```
modules/<feature>/
├── <feature>.module.ts      # NestJS module definition
├── <feature>.controller.ts  # HTTP endpoints with guards
├── <feature>.service.ts     # Business logic
└── dto/
    ├── create-<feature>.dto.ts  # Class-validator DTOs
    └── update-<feature>.dto.ts
```

**Response standardization:** All backend controllers use `ResponseFactory` to produce uniform `{ success, message, code, data, meta, errors }` responses.

### Server Components vs. Client Components

| Component Type | Location Pattern | Purpose | Examples |
|---------------|-----------------|---------|----------|
| **Server Components** | `*-server.tsx`, layout files | Data fetching, auth verification, SEO | `header-server.tsx`, `sidebar-group-server.tsx`, `admin-sidebar-server.tsx` |
| **Client Components** | `*-client.tsx`, form components | Interactive UI, state, event handlers | `header-client.tsx`, `sidebar-profile.tsx`, `login-form.tsx` |

Server components fetch data and pass it as props to client components, keeping sensitive logic (Prisma queries, token verification) on the server.

---

## Database Schema & Models

The database uses **PostgreSQL** with **UUID primary keys** and **snake_case table names** (mapped via `@@map()`). The frontend schema contains **20 models** organized across 11 Prisma schema files.

### Entity-Relationship Summary

```
User (1) ──── (N) Account ──── (1) AuthProvider
User (1) ──── (1) UserProfile
User (1) ──── (N) Session
User (1) ──── (N) Family (as owner)
User (1) ──── (N) GroupMember
User (1) ──── (N) Invite (sent/received)
User (1) ──── (N) Blog
User (1) ──── (N) Notification
User (1) ──── (N) ActivityLog
User (1) ──── (N) Album (as creator)
User (1) ──── (N) Event (as creator)

GroupFamily (1) ──── (1) Family
GroupFamily (1) ──── (N) GroupMember
GroupFamily (1) ──── (N) Invite
GroupFamily (M) ──── (M) Album (implicit junction)
GroupFamily (M) ──── (M) Event (implicit junction)

Family (1) ──── (N) FamilyMember
Family (1) ──── (N) Relationship
Family (1) ──── (N) ActivityLog

FamilyMember (1) ──── (N) Relationship (as fromMember)
FamilyMember (1) ──── (N) Relationship (as toMember)

Blog (1) ──── (N) BlogMedia
Album (1) ──── (N) Photo
```

### Models Detail

#### Core User Models

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| **User** | `user` | id (UUID), email (unique), emailVerified, role (ADMIN/USER), createdAt, updatedAt | Core user account |
| **Account** | `account` | id, userId, password (nullable), createdAt, updatedAt | Login credentials; 1:N with User |
| **UserProfile** | `user_profile` | id, userId (unique), fullName, memorableName, address, dateOfBirth, avatar, biography, gender (MALE/FEMALE/UNKNOWN) | Extended profile data; 1:1 with User |
| **AuthProvider** | `authProvider` | id, provider (USER/GOOGLE/GITHUB), accountId (unique) | Third-party auth linkage; 1:1 with Account |
| **Session** | `session` | id, token, expiresAt, ipAddress, userAgent, userId, unique(userId, userAgent) | Device-based sessions; 1:N with User |
| **Verification** | `verification` | id, identifier, value, expiresAt | Email verification tokens |
| **AuthLog** | `auth_log` | id, accountId, ipAddress, userAgent, type (LOGIN/REGISTER/PASSWORD), authBy (provider) | Authentication audit trail |

#### Family Tree Models

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| **Family** | `family` | id, name, description, lineageType (PATRIARCHAL/MATRIARCHAL/OTHER), ownerId, groupFamilyId (unique) | Core family tree; 1:1 with GroupFamily |
| **FamilyMember** | `family_member` | id, familyId, fullName, gender (MALE/FEMALE/OTHER), dateOfBirth, dateOfDeath, isAlive, avatarUrl, biography (JSONB), generation, positionX/Y | Individual tree nodes |
| **Relationship** | `relationship` | id, familyId, fromMemberId, toMemberId, type (PARENT/SPOUSE/CHILD), unique(from, to, type) | Tree edges between members |

#### Group & Collaboration Models

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| **GroupFamily** | `group_family` | id, name, description, createdAt, updatedAt | Organizational container for families |
| **GroupMember** | `group_member` | id, role (OWNER/EDITOR/VIEWER), groupId, memberId, isLeader, unique(memberId, groupId) | Membership with role-based access |
| **Invite** | `invite` | id, token (unique), groupId, senderId, targetId (nullable), expiresAt | Group invitation links (24h expiry) |

#### Content Models

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| **Blog** | `blog` | id, userId, title, slug (unique), content (Text), createdAt, updatedAt | Blog posts with slug-based routing |
| **BlogMedia** | `blog_media` | id, blogId (nullable), url, type (IMAGE/VIDEO/OTHER), isUsed | Media attachments for blog content |
| **Album** | `album` | id, familyId, title, description, createdBy, createdAt | Photo album container |
| **Photo** | `photo` | id, albumId, imageUrl, takenAt, locationName, description | Individual photos in albums |

#### Activity & Notification Models

| Model | Table | Key Fields | Purpose |
|-------|-------|-----------|---------|
| **Notification** | `notification` | id, userId, title, content, type (NEW/UPDATE/DELETE/OTHER), isRead, link | User notification inbox |
| **Event** | `event` | id, familyId, title, description, eventDate, isRecurring, type (BIRTHDAY/WEDDING/DEATH_ANNIVERSARY/OTHER), createBy | Family events |
| **ActivityLog** | `activity_log` | id, familyId, userId, action (NEW/UPDATE/DELETE), targetId, target (ALBUM/FAMILY/EVENT_FAMILY/EVENT_SELF/USER), content | Audit trail for family changes |

### Enums

| Enum | Values | Used In |
|------|--------|---------|
| `USER_ROLE` | ADMIN, USER | User.role |
| `MEMBER_ROLE` | OWNER, EDITOR, VIEWER | GroupMember.role |
| `GENDERS` | MALE, FEMALE, UNKNOWN | UserProfile.gender |
| `GENDER` | MALE, FEMALE, OTHER | FamilyMember.gender |
| `PROVIDERS` | USER, GOOGLE, GITHUB | AuthProvider.provider |
| `AUTH_TYPE` | LOGIN, REGISTER, PASSWORD | AuthLog.type |
| `LINEAGE_TYPE` | PATRIARCHAL, MATRIARCHAL, OTHER | Family.lineageType |
| `TYPE_RELATIONSHIP` | PARENT, SPOUSE, CHILD | Relationship.type |
| `NOTIFICATION_TYPE` | NEW, UPDATE, DELETE, OTHER | Notification.type |
| `EVENT_TYPE` | DEATH_ANNIVERSARY, BIRTHDAY, WEDDING, OTHER | Event.type |
| `ACTION_TYPE` | NEW, UPDATE, DELETE | ActivityLog.action |
| `TARGET_TYPE` | ALBUM, FAMILY, EVENT_FAMILY, EVENT_SELF, USER | ActivityLog.target |
| `BLOG_MEDIA_TYPE` | IMAGE, VIDEO, OTHER | BlogMedia.type |

---

## Core Features Implemented

### 1. Authentication System

**Two authentication strategies:**

- **Credentials (Email/Password):** Registration with bcrypt hashing (10 salt rounds), login with password comparison via `bcrypt.compare()`.
- **Google OAuth2:** Token verification via `google-auth-library` `OAuth2Client.verifyIdToken()`. Auto-registers new Google users with profile data from Google payload.

**Auth flow:**
1. User submits credentials or Google token
2. Server validates input (Zod schemas)
3. For credentials: bcrypt hash comparison; For Google: token verification
4. JWT access token (short-lived) + refresh token (long-lived) generated via `jose` SignJWT
5. Tokens stored in httpOnly, secure cookies
6. Session record created in database with device fingerprint (userAgent + IP)
7. AuthLog entry created for audit trail

### 2. Session Management

- **1:1 device fingerprinting:** Sessions are uniquely identified by `userId + userAgent`, allowing one active session per device.
- **Upsert pattern:** Re-login on the same device updates the existing session rather than creating duplicates.
- **Silent refresh:** The proxy layer (`proxy.ts`) automatically detects expired access tokens and uses the refresh token to obtain new tokens without interrupting the user.
- **Session cleanup:** A daily cron job (`@nestjs/schedule`) deletes expired invite tokens. Session expiry is checked during refresh — expired sessions are deleted immediately.

### 3. User Profile Management

- Profile creation during registration (fullName from credentials or Google payload)
- Avatar upload via Cloudinary (Multer + FileInterceptor)
- Profile fields: fullName, memorableName, address, dateOfBirth, biography, gender
- Owner-only access control for profile modifications

### 4. Family Group Management

- **GroupFamily CRUD:** Create, update, view family groups
- **Role-based membership:** OWNER (full control), EDITOR (can edit tree), VIEWER (read-only)
- **Invite system:** Generate time-limited (24h) base64-encoded invitation tokens
- **Join flow:** New members join as VIEWER by default via invite token
- **Leader transfer:** OWNER can transfer leadership to another member
- **Member removal:** OWNER can remove members from the group

### 5. Family Tree Editor

- **Draft/Origin pattern:** Redux state maintains a working draft and a saved origin; only changed data is synced to the server (diff-based optimization via `lodash.isequal`)
- **Full tree sync:** Uses Prisma `$transaction` to atomically upsert family, members, and recreate all relationships
- **React Flow visualization:** Interactive node-based tree editor with custom `FamilyMemberNode` components
- **Dagre auto-layout:** Automatic hierarchical tree layout using `@dagrejs/dagre`
- **Role enforcement:** Only OWNER and EDITOR roles can modify tree data

### 6. Blog Management

- **Admin blog editor:** Editor.js-based rich text editor with image, header, list, embed, and marker blocks
- **Slug-based routing:** Blogs accessed via unique slug
- **Media management:** Upload images to Cloudinary, track orphaned media for cleanup
- **Draft-based editing:** Per-slug draft/origin pattern in Redux, only saves modified content
- **Safe slug whitelist:** Only predefined slugs ("build-flow", "group-family", "group-members", "events") are editable

### 7. Security Logging

- **AuthLog:** Tracks all authentication events (LOGIN, REGISTER, PASSWORD) with IP address, user agent, and auth provider
- **ActivityLog:** Tracks family tree changes (NEW, UPDATE, DELETE) with target type, user, and content description
- **Prisma error mapping:** 80+ typed error classes covering all Prisma error codes (P1xxx through P6xxx)

---

## Security & Authentication

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                          │
│                                                             │
│  1. ISSUANCE                                                │
│     ├── Access Token: HS256, short-lived (configurable)     │
│     ├── Refresh Token: HS256, long-lived (7 days default)   │
│     └── Payload: { id: userId, role: userRole }             │
│                                                             │
│  2. STORAGE                                                 │
│     ├── Cookies: httpOnly, secure, sameSite: "lax", path: / │
│     ├── access_token: maxAge = ACCESS_TOKEN_EXPIRES_IN      │
│     └── refresh_token: maxAge = 7 days                      │
│                                                             │
│  3. VERIFICATION (proxy.ts)                                 │
│     ├── Step 1: Verify access_token via jose.jwtVerify()    │
│     ├── Step 2: If expired, attempt silent refresh          │
│     │   ├── Verify refresh_token                            │
│     │   ├── Call AuthService.refresh()                      │
│     │   ├── Issue new token pair                            │
│     │   └── Set new cookies + inject headers                │
│     └── Step 3: RBAC check (ADMIN-only routes)              │
│                                                             │
│  4. INVALIDATION                                            │
│     ├── Logout: Deletes session record from DB              │
│     ├── Session expiry: Checked during refresh              │
│     └── Daily cron: Cleans expired invite tokens            │
└─────────────────────────────────────────────────────────────┘
```

### Encryption & Security Strategies

| Strategy | Implementation |
|----------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds; passwords never stored in plaintext |
| **JWT Signing** | HS256 via `jose` library with separate access/refresh secrets |
| **Cookie Security** | httpOnly (no JS access), secure (HTTPS in production), sameSite: lax |
| **Google Token Verification** | `OAuth2Client.verifyIdToken()` with Google's public certificate |
| **Invite Tokens** | Base64-encoded with 24h expiry; validated on join |
| **Session Fingerprinting** | Unique constraint on `userId + userAgent` prevents session duplication |
| **Environment Validation** | Zod schema validates all server env vars at startup; fails fast on missing config |
| **Image Hostname Security** | `next.config.ts` whitelists only allowed remote image hostnames |
| **RBAC** | Three-layer guard system: AtGuard (auth) → RolesGuard (role) → GroupLeaderGuard (leader) |

### Data Integrity via Prisma Transactions

Critical multi-table operations use Prisma `$transaction` to ensure atomicity:

- **Registration:** Creates User → Account → AuthProvider → UserProfile → Session → AuthLog atomically
- **Google Login (new user):** Creates User → Account → AuthProvider → UserProfile → AuthLog → Session in a single transaction with early-return validation
- **Family Tree Sync:** Upserts Family → Upserts FamilyMembers → Deletes old Relationships → Creates new Relationships atomically
- **Logout:** Deletes session within a transaction after verifying user existence

### RBAC Implementation

```
Access Decision Flow:
                    ┌──────────┐
                    │ Request  │
                    └────┬─────┘
                         ▼
                    ┌──────────┐
                    │ AtGuard  │  (JWT access token valid?)
                    │ / RtGuard│
                    └────┬─────┘
                    YES  │
                         ▼
                    ┌──────────┐
                    │ RolesGuard│  (Required roles match user's         GroupMember role?)
                    └────┬─────┘
                    YES  │
                         ▼
                    ┌──────────────┐
                    │ LeaderGuard   │  (User is leader of this group?)
                    │ (if @IsLeader)│
                    └────┬─────────┘
                    YES  │
                         ▼
                    ┌──────────┐
                    │ Controller │
                    └──────────┘
```

### Header Injection (Proxy → Server Components)

The proxy layer injects verified user context into request headers for downstream Server Components:

| Header | Purpose |
|--------|---------|
| `x-user-id` | Authenticated user's UUID |
| `x-user-role` | User's system role (ADMIN/USER) |
| `x-access-token` | Fresh access token (after silent refresh) |

---

## Deployment & Configuration

### Environment Variables

**Server-side (validated via Zod):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` — JWT signing secrets
- `ACCESS_TOKEN_EXPIRES_IN` / `REFRESH_TOKEN_EXPIRES_IN` — Token lifetimes (seconds)
- `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Image CDN
- `CLIENT_DOMAIN` — Frontend URL for CORS
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client ID (public)

**Backend additional:**
- `PORT` — Server port (default 3000)
- `NODE_ENV` — Environment mode

### Image Optimization

- Formats: AVIF, WebP
- Cache TTL: 30 days (static), 10 minutes (dynamic)
- Whitelisted remote hosts: Cloudinary, Google Avatars, GitHub Avatars, placehold.co, icons8, jsdelivr, picsum, tikicdn

### Build & Development

```bash
# Frontend
pnpm dev          # Next.js dev server with Turbopack
pnpm build        # Production build
pnpm lint         # ESLint

# Backend
pnpm start:dev    # NestJS watch mode
pnpm build        # Prisma generate + NestJS build
pnpm test         # Jest unit tests
pnpm test:e2e     # End-to-end tests
```

### API Documentation

The NestJS backend exposes Swagger documentation at `/api/docs` with bearer token authentication support. All API routes are prefixed with `/api`.
