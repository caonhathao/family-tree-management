# Family-Tree Management System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A family genealogy management system that lets users create, manage, and visualize family trees. Users can organize into **family groups**, invite members, model relationships between relatives, schedule **recurring events**, and receive **in-app & email notifications**.

## 🚀 Features

-   **User Authentication:** Secure registration and login (email/password + Google OAuth), JWT access/refresh tokens, and account/session management.
-   **Family Groups:** Create groups, invite members via unique invite links (with expiry), and manage roles — `owner` / `editor` / `viewer` — per group member.
-   **Interactive Tree Visualization:** A dynamic, interactive, zoomable, and draggable family-tree canvas (React Flow), with automatic layout via Dagre.
-   **Member Profiles:** Add/edit family members with biography, key dates (birth/death), generation rank, gender, and positions on the canvas.
-   **Relationship Management:** Define relations between members (`PARENT`, `SPOUSE`, `CHILD`).
-   **Recurring Events & Notifications:** Schedule one-time or recurring events (daily/weekly/monthly), view them on a calendar, and get in-app notifications.
-   **Email Notifications (experimental):** Scheduled reminders send event emails via Resend (skipped automatically when not configured).
-   **Albums & Media (API):** Album/photo uploads backed by Cloudinary.
-   **Admin & Blog:** Admin panel for user/blog management with an Editor.js-based blog editor.

> **Roadmap:** integrate cloud storage for media assets (albums, avatars, blog media) across the product.

## 🏛️ Architecture Overview

The system is a decoupled monorepo with two independent applications, deployed on **separate platforms**:

-   **Frontend** (`project/frontend`) — a Next.js (App Router) application that can run/deploy on its own (e.g., Vercel). It talks to the backend only through the `BACKEND_API_URL` environment variable, always **server-side via Next.js server actions**.
-   **Backend** (`project/backend`) — a NestJS + Prisma + PostgreSQL REST API (e.g., Render/Railway). It exposes the API, validates the frontend origin via CORS, and runs scheduled jobs.

Both packages use **pnpm**.

### Backend (NestJS)

The backend, located in `project/backend`, is built with the NestJS framework.

-   **Framework:** NestJS
-   **ORM:** Prisma (multi-file schema, PostgreSQL driver adapter)
-   **Database:** PostgreSQL
-   **Authentication:** JWT (access/refresh) via Passport strategies + Google OAuth (ID-token verification)
-   **Scheduling:** `@nestjs/schedule` cron jobs (event lifecycle roll-forward, event emails, expired-invite cleanup)
-   **Email:** Resend + `react-email` templates
-   **File Upload:** Cloudinary
-   **API Documentation:** Swagger (available at `/api/docs`)

The backend exposes a RESTful API (global prefix `/api`) consumed by the frontend. It handles business logic, data persistence, authentication, and scheduled tasks.

#### Core Data Model

The main entities are `GroupFamily` (a container shared by users), `Family` (one tree per group), `FamilyMember` (a person/node), `Relationship` (a directed edge between two members), and `Event` (with optional recurring instances).

> The tree uses a graph-based approach (adjacency list). `FamilyMember` acts as a node (a person) and `Relationship` acts as a directed edge (`PARENT`, `SPOUSE`, `CHILD`) between two nodes, allowing flexible modeling of complex family ties. Members also store `generation` and canvas `positionX/positionY` for layout.

```mermaid
classDiagram
    class GroupFamily {
        +String id
        +String name
        +String? description
        +GroupMember[] members
        +Invite[] invites
        +Event[] events
    }

    class Family {
        +String id
        +String name
        +String description
        +GroupFamily groupFamily
        +FamilyMember[] familyMembers
        +Relationship[] relationships
    }

    class FamilyMember {
        +String id
        +String fullName
        +GENDER gender
        +DateTime? dateOfBirth
        +DateTime? dateOfDeath
        +Boolean isAlive
        +Int generation
        +Float? positionX
        +Float? positionY
    }

    class Relationship {
        +String id
        +FamilyMember fromMember
        +FamilyMember toMember
        +TYPE_RELATIONSHIP type
    }

    class Event {
        +String id
        +String title
        +EVENT_TYPE type
        +Boolean isRecurring
        +DateTime startTime
        +DateTime endTime
        +EventRecurrence? recurrence
    }

    GroupFamily "1" *-- "0..*" Family
    GroupFamily "1" *-- "0..*" Event
    Family "1" *-- "0..*" FamilyMember
    Family "1" *-- "0..*" Relationship
    FamilyMember "1" -- "0..*" Relationship : from/to
```

### Frontend (Next.js)

The frontend, located in `project/frontend`, is a modern, server-rendered application built with Next.js and React.

-   **Framework:** Next.js 16 (App Router, Server Components, Turbopack)
-   **Styling:** Tailwind CSS & Radix UI
-   **State Management:** Redux Toolkit
-   **Tree Visualization:** React Flow (`@xyflow/react`)
-   **Layout Engine:** Dagre.js
-   **Forms/Validation:** React Hook Form + Zod
-   **Blog Editor:** Editor.js

All data access goes through **server actions** that call the backend from the Next.js server. This keeps the browser from talking to the backend directly, so the frontend can be deployed independently.

#### Tree Visualization Engine

The family tree is rendered with **React Flow**, centered around the `group-content.tsx` component. It fetches family data and transforms it into React Flow `nodes`/`edges`. Node positions are computed algorithmically by **Dagre.js** (`group-content.tsx`) based on relationships and generation (a clean "tight-tree" layout), and the calculated positions are stored back to the database.

## 🛠️ Getting Started

### Prerequisites

-   Node.js (v20+)
-   pnpm
-   PostgreSQL

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

2.  **Backend Setup:**
    ```bash
    cd project/backend
    pnpm install
    cp .env.example .env
    # Update .env with your database credentials and secrets
    pnpm prisma migrate dev
    pnpm start:dev
    ```

3.  **Frontend Setup:**
    ```bash
    cd project/frontend
    pnpm install
    cp .env.example .env
    # Update .env with your backend API URL
    pnpm dev
    ```

The application should now be running: frontend at `http://localhost:3000`, backend at `http://localhost:3001`, and Swagger docs at `http://localhost:3001/api/docs`.

## 🔐 Environment Variables

### Backend (`project/backend/.env.example`)

```
# Server Port
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/family_tree_db?schema=public"

# JWT Authentication
JWT_ACCESS_SECRET_KEY="your_jwt_access_secret"
JWT_REFRESH_SECRET_KEY="your_jwt_refresh_secret"
ACCESS_TOKEN_EXPIRES_IN=600 # seconds, e.g., 10 minutes
REFRESH_TOKEN_EXPIRES_IN=604800 # seconds, e.g., 7 days

# File Upload Configuration
MAX_FILE_SIZE=2 # MB

# Resend (email notifications - optional)
RESEND_API_KEY="your_resend_api_key"
MAIL_FROM="Family Management <onboarding@resend.dev>"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_URL="cloudinary://your_api_key:your_api_secret@your_cloud_name"
FOLDER_ALBUM="family-tree/albums"
FOLDER_USER="family-tree/users"
FOLDER_FAMILY="family-tree/families"
FOLDER_BLOG="family-tree/blogs"

# Client / CORS
CLIENT_DOMAIN="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,https://app.your-domain.com" # comma-separated list of allowed frontend origins

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
```

### Frontend (`project/frontend/.env.example`)

```
# Application Environment
NODE_ENV="development"

# JWT Configuration (must match the backend's values)
ACCESS_TOKEN_EXPIRES_IN=600 # seconds, e.g., 10 minutes
REFRESH_TOKEN_EXPIRES_IN=604800 # seconds, e.g., 7 days
JWT_ACCESS_SECRET_KEY="your_jwt_access_secret" # must match backend's JWT_ACCESS_SECRET_KEY
JWT_REFRESH_SECRET_KEY="your_jwt_refresh_secret" # must match backend's JWT_REFRESH_SECRET_KEY

# File Upload Configuration
MAX_FILE_SIZE=2 # MB
FOLDER_ALBUM="family-tree/albums"
FOLDER_USER="family-tree/users"
FOLDER_FAMILY="family-tree/families"
FOLDER_BLOG="family-tree/blogs"

# Cloudinary Configuration
CLOUDINARY_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_URL="cloudinary://your_api_key:your_api_secret@your_cloud_name"

# Client Domain
CLIENT_DOMAIN="http://localhost:3000"
SITE_URL="http://localhost:3000"

# Backend API URL (server-side calls to the backend)
BACKEND_API_URL="http://localhost:3001"

# Google OAuth (public client ID, injected into the browser bundle)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"

# Frontend Server Port (read by Next.js)
PORT=3000
```

## 🌐 Deployment

The frontend and backend are deployed independently:

-   **Frontend → Vercel:** Deploy `project/frontend` as its own project. Set `BACKEND_API_URL` to the production backend URL and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the production Google OAuth client ID. Add every frontend origin (e.g. `https://app.your-domain.com`) to the Google Cloud OAuth client's **Authorized JavaScript origins**.
-   **Backend → any Node hosting (Render/Railway/Vercel):** Deploy `project/backend`. Set `CORS_ORIGINS` (comma-separated) to the production frontend origin(s), `CLIENT_DOMAIN` accordingly, and run `pnpm prisma migrate deploy` before `pnpm start:prod`. Enable a persistent scheduler (cron jobs) by keeping the app running long-term.
