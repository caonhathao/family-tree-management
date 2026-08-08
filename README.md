# Family-Tree Management System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

This is a comprehensive family tree management system that allows users to create, manage, and visualize their family genealogies.

## 🚀 Features

-   **User Authentication:** Secure registration and login (email/password + Google OAuth).
-   **Family Management:** Create and manage families, invite members, and set permissions (owner/editor/viewer).
-   **Interactive Tree Visualization:** A dynamic, interactive, and zoomable family tree diagram.
-   **Member Profiles:** Add and edit detailed profiles for each family member, including biography, photos, and key dates.
-   **Relationship Management:** Define and manage complex relationships between family members.
-   **Recurring Events & Notifications:** Schedule family events and receive in-app notifications.

## 🏛️ Architecture Overview

The system is a decoupled monorepo with two independent applications, deployed on **separate platforms**:

-   **Frontend** (`project/frontend`) — a Next.js application that can run/deploy on its own (e.g., Vercel). It talks to the backend only through the `BACKEND_API_URL` environment variable.
-   **Backend** (`project/backend`) — a NestJS + Prisma + PostgreSQL REST API (e.g., Render/Railway). It exposes the API and validates the frontend origin via CORS.

### Backend (NestJS)

The backend, located in `project/backend`, is a robust and scalable application built with the NestJS framework.

-   **Framework:** NestJS
-   **ORM:** Prisma
-   **Database:** PostgreSQL
-   **Authentication:** Passport.js with JWT (access/refresh tokens)
-   **API Documentation:** Swagger (available at `/api/docs`)

The backend exposes a RESTful API (global prefix `/api`) to the frontend for all data operations. It handles business logic, data persistence, and authentication.

#### Family Tree Data Model

The core of the family tree is represented by three main Prisma models: `Family`, `FamilyMember`, and `Relationship`.

> The system uses a graph-based approach (adjacency list) to represent family structures. `FamilyMember` acts as a node (a person) and `Relationship` acts as a directed edge between two nodes, defining the connection (e.g., PARENT, SPOUSE). This allows for flexible and scalable modeling of complex family ties.

Here's a simplified representation of the data schema:

```mermaid
classDiagram
    class Family {
        +String id
        +String name
        +User owner
        +FamilyMember[] members
        +Relationship[] relationships
    }

    class FamilyMember {
        +String id
        +String fullName
        +GENDER gender
        +DateTime dateOfBirth
        +Float positionX
        +Float positionY
        +Relationship[] relationshipsFrom
        +Relationship[] relationshipsTo
    }

    class Relationship {
        +String id
        +FamilyMember fromMember
        +FamilyMember toMember
        +TYPE_RELATIONSHIP type
    }

    Family "1" *-- "0..*" FamilyMember
    Family "1" *-- "0..*" Relationship
    FamilyMember "1" -- "0..*" Relationship : relationshipsFrom
    FamilyMember "1" -- "0..*" Relationship : relationshipsTo
```

### Frontend (Next.js)

The frontend, located in `project/frontend`, is a modern, server-rendered application built with Next.js and React.

-   **Framework:** Next.js / React
-   **Styling:** Tailwind CSS & Radix UI
-   **State Management:** Redux Toolkit
-   **Tree Visualization:** React Flow (`@xyflow/react`)
-   **Layout Engine:** Dagre.js

All data access is done through **server actions** that call the backend from the Next.js server. This keeps the browser from talking to the backend directly, so the frontend can be deployed on its own without sharing CORS setup with any other client.

#### Tree Visualization Engine

The family tree is rendered using the powerful **React Flow** library, which provides a flexible and interactive canvas.

> The rendering logic is centered around the `group-content.tsx` component. It fetches family data and transforms it into `nodes` and `edges` compatible with React Flow. The layout of the tree is not hardcoded; instead, the **Dagre.js** library is used to algorithmically determine the optimal position of each node (`family-member-node.tsx`) based on their relationships and generation, creating a clean and readable "tight-tree" structure. The calculated positions are then stored back to the database.

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
    # Update .env with your database credentials
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

The application should now be running, with the frontend accessible at `http://localhost:3000` and the backend at `http://localhost:3001`.

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

# Cloudinary Configuration
CLOUDINARY_NAME="your_cloudinary_cloud_name"
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
-   **Backend → any Node hosting (Render/Railway/Vercel):** Deploy `project/backend`. Set `CORS_ORIGINS` (comma-separated) to the production frontend origin(s) and `CLIENT_DOMAIN` accordingly.
