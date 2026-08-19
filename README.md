# Family-Tree Management System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

A full-stack family genealogy management system that lets users create, manage, and visualize family trees. Users can organize into **family groups**, invite members, model relationships between relatives, schedule **recurring events**, and receive **in-app & email notifications**.

## Overview

The system is a **decoupled monorepo** with two independent applications:

- **Frontend** → Next.js 16 (App Router, Turbopack) — deploy on Vercel
- **Backend** → NestJS 11 + Prisma 7.2 + PostgreSQL — deploy on Render/Railway

Both packages use **pnpm** and communicate via REST API (server-side only through Next.js Server Actions).

> See [System Features](./docs/en-features.html) for complete feature list with implementation status.

## Project Structure

See [Architecture Map](./docs/architecture_map.html) for interactive directory & module explorer.

| Component | Path | Documentation |
|-----------|------|---------------|
| Backend | `project/backend/` | [Backend README](./project/backend/README.md) |
| Frontend | `project/frontend/` | [Frontend README](./project/frontend/README.md) |
| Architecture Map | `docs/architecture_map.html` | Interactive module & ERD explorer |
| System Features (EN) | `docs/en-features.html` | Complete feature list |
| System Features (VN) | `docs/vn-features.html` | Danh sách tính năng |
| Technical Docs | `docs/project_overview.md` | Detailed technical documentation |
| API Response Flow | `docs/api-response-flow.md` | Response format audit |
| Roadmap | `docs/pending_features.md` | Pending features & technical debt |

## Quick Start

### Prerequisites

- Node.js (v20+)
- pnpm
- PostgreSQL

### Installation

```bash
# Clone repository
git clone <repository-url>
cd family-free-management

# Backend setup
cd project/backend
pnpm install
cp .env.example .env  # Update with your credentials
pnpm prisma migrate dev
pnpm start:dev

# Frontend setup (new terminal)
cd project/frontend
pnpm install
cp .env.example .env  # Update BACKEND_API_URL
pnpm dev
```

### Running

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)
- Swagger Docs: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

## Development Commands

| Command | Location | Description |
|---------|----------|-------------|
| `pnpm dev` | Both | Start development server |
| `pnpm build` | Both | Production build |
| `pnpm lint` | Both | Run ESLint |
| `pnpm test` | Both | Run unit tests (Vitest/Jest) |
| `pnpm typecheck` | Frontend | TypeScript type check |
| `pnpm test:e2e` | Backend | End-to-end tests |
| `pnpm format` | Backend | Format with Prettier |

## Documentation

| Document | Description |
|----------|-------------|
| [Backend README](./project/backend/README.md) | Backend setup, API endpoints, data model, deployment |
| [Frontend README](./project/frontend/README.md) | Frontend setup, pages, environment variables |
| [Architecture Map](./docs/architecture_map.html) | Interactive module structure & ERD explorer |
| [Features (EN)](./docs/en-features.html) | System features with implementation status |
| [Features (VN)](./docs/vn-features.html) | Danh sách tính năng hệ thống |
| [API Response Flow](./docs/api-response-flow.md) | Response format audit & standards |
| [Pending Features](./docs/pending_features.md) | Roadmap, technical debt & planned features |

## License

UNLICENSED
