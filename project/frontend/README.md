# Family-Tree Management System — Frontend

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

This is the **standalone frontend** of the Family-Tree Management System, built with Next.js (App Router).

> **Frontend-only app.** This project runs and deploys on its own (e.g., on Vercel) and talks to the backend exclusively through the `BACKEND_API_URL` environment variable. It does not need to share infrastructure or CORS setup with any other client — all backend calls are made **server-side via Next.js server actions**, so the browser never talks to the backend directly.

## ✨ Highlights

-   Next.js 16 (App Router, Server Components, Turbopack)
-   Authentication flows (email/password + Google OAuth) with httpOnly cookie handling
-   Family group management: create groups, invite members, and manage roles
-   Interactive family-tree visualization (React Flow + Dagre.js) with drag-and-drop and auto-layout
-   Family, member, and relationship management UIs
-   Events management: create/edit one-time & recurring events, calendar view, and day dialogs
-   User area: profile, biography, and security (auth methods) management
-   Invite acceptance page
-   Admin panel: dashboard, user management, blog list, and an Editor.js blog editor
-   Tailwind CSS + Radix UI component library
-   Redux Toolkit state management, React Hook Form + Zod validation

## 🧭 Pages

| Route | Description |
| --- | --- |
| `/` , `/features` | Public landing & feature pages |
| `/auth` | Login / sign-up (email/password + Google OAuth) |
| `/group` | Main group workspace: family-tree editor, event calendar, info/settings drawers, member/relationship/event forms |
| `/user/profile` | User profile & biography |
| `/user/secure` | Account security & auth methods |
| `/user/invite` | Accept a group invite via token link |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/blogs` , `/admin/blog_editor` | Blog list & Editor.js blog editor |

## 🛠️ Getting Started

### Prerequisites

-   Node.js (v20+)
-   pnpm

### Installation & Setup

```bash
pnpm install
cp .env.example .env
```

Then fill in `.env` (see [Environment Variables](#environment-variables)). The backend REST API is expected to already be running (the NestJS backend in `../backend`).

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Useful Commands

```bash
pnpm dev          # start development server (Turbopack)
pnpm build        # create an optimized production build
pnpm lint         # run ESLint
npx tsc --noEmit  # type-check the project
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `BACKEND_API_URL` | Yes | Base URL of the backend API (server-side only, never exposed to the browser) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Public Google OAuth client ID (injected into the browser bundle) |
| `NODE_ENV` | No | `development`, `production` or `test` (default: `development`) |
| `ACCESS_TOKEN_EXPIRES_IN` | Yes | Access-token lifetime in seconds (must match backend) |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Refresh-token lifetime in seconds (must match backend) |
| `JWT_ACCESS_SECRET_KEY` | Yes | Access-token secret (must match backend) |
| `JWT_REFRESH_SECRET_KEY` | Yes | Refresh-token secret (must match backend) |
| `MAX_FILE_SIZE` | Yes | Max upload size in MB |
| `FOLDER_ALBUM` / `FOLDER_USER` / `FOLDER_FAMILY` / `FOLDER_BLOG` | Yes | Cloudinary folder names |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_URL` | Yes | Cloudinary credentials |
| `CLIENT_DOMAIN` | Yes | The frontend's own origin (e.g. `http://localhost:3000`) |
| `SITE_URL` | Yes | Public site URL |
| `PORT` | No | Server port read by Next.js (default `3000`) |

A complete sample with placeholder values is provided in `.env.example`.

> **Note on secrets:** `JWT_*` and `CLOUDINARY_*` values must match the ones used by the backend, since this app writes auth cookies and signs/uploads using them.

## 🌐 Deployment (Vercel)

Deploy this directory as an **independent Vercel project**:

1.  Import the repository and set the root directory to `project/frontend`.
2.  Configure the environment variables listed above, most importantly:
    -   `BACKEND_API_URL` → the **production** backend URL (e.g. `https://api.your-domain.com`)
    -   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → the production Google OAuth client ID
3.  In the Google Cloud Console, add the production origin (e.g. `https://app.your-domain.com`) — and, if testing previews, `https://*.vercel.app` — to the OAuth client's **Authorized JavaScript origins**.

The frontend does not require the backend to share its domain; backend CORS only needs to include the frontend origin(s) in its `CORS_ORIGINS`.
