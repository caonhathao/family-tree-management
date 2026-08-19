# Family-Tree Management System — Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Editor.js](https://img.shields.io/badge/Editor.js-1E90FF?style=for-the-badge&logo=editor.js&logoColor=white)](https://editorjs.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

The **standalone frontend** of the Family-Tree Management System, built with Next.js (App Router).

> **Frontend-only app.** This project runs and deploys independently (e.g., on Vercel) and talks to the backend exclusively through the `BACKEND_API_URL` environment variable. All backend calls are made **server-side via Next.js Server Actions**, so the browser never talks to the backend directly.

## Highlights

- Next.js 16.1.6 (App Router, Server Components, Turbopack, React Compiler)
- Authentication flows (email/password + Google OAuth) with httpOnly cookie handling
- Family group management: create groups, invite members, and manage roles
- Interactive family-tree visualization (React Flow + Dagre.js) with drag-and-drop
- Family, member, and relationship management UIs
- Events management: one-time & recurring events, calendar view, day dialogs
- User area: profile, biography, and security management
- Invite acceptance page
- Admin panel: dashboard, user management, blog list, Editor.js blog editor
- Internationalization support (next-intl, Vietnamese)
- Tailwind CSS 4 + Radix UI component library

## Pages

| Route | Description |
|-------|-------------|
| `/` , `/features` | Public landing & feature pages |
| `/auth` | Login / sign-up (email/password + Google OAuth) |
| `/group` | Main workspace: family-tree editor, event calendar, info/settings drawers |
| `/user/profile` | User profile & biography |
| `/user/secure` | Account security & auth methods |
| `/user/invite` | Accept a group invite via token link |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/blogs` | Blog list |
| `/admin/blog_editor` | Editor.js blog editor |

## Architecture Patterns

### Service-Action-Module Pattern

Each feature follows a layered architecture. See example: [`src/modules/auth/`](./src/modules/auth/)

| Layer | File | Purpose |
|-------|------|---------|
| Server Action | `*.actions.ts` | Entry point, validates with Zod, sets cookies |
| Service | `*.service.ts` | Business logic, Prisma queries |
| DTO | `*.dto.ts` | TypeScript interfaces for data transfer |
| Validator | `*.service-validator.ts` | Zod schemas for server-side validation |
| Client Schema | `*.client-schemas.ts` | Zod schemas for client-side form validation |

### Server vs Client Components

| Type | Pattern | Purpose |
|------|---------|---------|
| Server | `*-server.tsx`, layout files | Data fetching, auth verification, SEO |
| Client | `*-client.tsx`, form components | Interactive UI, state, event handlers |

Server components fetch data and pass as props to client components. Sensitive logic (Prisma queries, token verification) stays on server.

### State Management

Redux Toolkit slices for client-side state. See: [`src/store/`](./src/store/)

| Slice | Purpose |
|-------|---------|
| `family/` | Draft/Origin pattern for tree editing |
| `user/` | Profile state |
| `blog/` | Per-slug draft tracking |

**Draft/Origin Pattern:** Redux maintains a working draft and a saved origin. Only changed data is synced to server using `lodash.isequal` diff. Full tree sync via Prisma `$transaction`.

## Key Libraries

| Library | Purpose | Source |
|---------|---------|--------|
| ResponseFactory | API response envelope | [`src/lib/res/response.factory.ts`](./src/lib/res/response.factory.ts) |
| Prisma Client | Database singleton (pg pool) | [`src/lib/prisma.ts`](./src/lib/prisma.ts) |
| Prisma Errors | Error mapping | [`src/lib/prisma-errors.ts`](./src/lib/prisma-errors.ts) |
| HTTP Client | Fetch wrapper with interceptors | [`src/lib/api/http.client.ts`](./src/lib/api/http.client.ts) |
| API Client | Typed endpoint clients | [`src/lib/api/api-client.lib.ts`](./src/lib/api/api-client.lib.ts) |
| Auth Utils | Server-side auth utilities | [`src/lib/middleware/auth.lib.ts`](./src/lib/middleware/auth.lib.ts) |
| Env Config | Zod-validated environment | [`src/lib/env/env-config.lib.ts`](./src/lib/env/env-config.lib.ts) |

## Tree Visualization

The family tree is rendered with **React Flow**, centered around the `group-content.tsx` component.

→ Source: [`src/app/group/`](./src/app/group/)

- Fetches family data and transforms into React Flow `nodes`/`edges`
- Node positions computed by **Dagre.js** based on relationships and generation
- Calculated positions stored back to database
- Custom `FamilyMemberNode` components for rendering

## Getting Started

### Prerequisites

- Node.js (v20+)
- pnpm

### Installation

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables)). Backend REST API must be running.

Start development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Development Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript type check
pnpm test         # Vitest unit tests
pnpm test:watch   # Vitest watch mode
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_API_URL` | Yes | Base URL of backend API (server-side only) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Public Google OAuth client ID |
| `NODE_ENV` | No | `development`, `production` or `test` |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access-token lifetime in seconds (must match backend) |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh-token lifetime in seconds (must match backend) |
| `JWT_ACCESS_SECRET_KEY` | Yes | Access-token secret (must match backend) |
| `JWT_REFRESH_SECRET_KEY` | Yes | Refresh-token secret (must match backend) |
| `MAX_FILE_SIZE` | Yes | Max upload size in MB |
| `FOLDER_ALBUM` / `FOLDER_USER` / `FOLDER_FAMILY` / `FOLDER_BLOG` | Yes | Cloudinary folder names |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_URL` | Yes | Cloudinary credentials |
| `CLIENT_DOMAIN` | Yes | Frontend origin (e.g. `http://localhost:3000`) |
| `SITE_URL` | Yes | Public site URL |
| `PORT` | No | Server port (default `3000`) |

A complete sample with placeholder values is provided in `.env.example`.

> **Note on secrets:** `JWT_*` and `CLOUDINARY_*` values must match the backend, since this app writes auth cookies and signs/uploads using them.

## Deployment (Vercel)

Deploy as an **independent Vercel project**:

1. Import repository, set root directory to `project/frontend`
2. Configure environment variables:
   - `BACKEND_API_URL` → production backend URL (e.g. `https://api.your-domain.com`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → production Google OAuth client ID
3. In Google Cloud Console, add production origin to OAuth client's **Authorized JavaScript origins**

The frontend does not require the backend to share its domain; backend CORS only needs to include the frontend origin(s) in `CORS_ORIGINS`.

## Related Documentation

- [Root README](../README.md) — Project overview
- [Backend README](../project/backend/README.md) — Backend documentation
- [Architecture Map](../docs/architecture_map.html) — Interactive module & ERD explorer
- [System Features](../docs/en-features.html) — Complete feature list
