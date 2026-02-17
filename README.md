# Family-Tree Management System

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

This is a comprehensive family tree management system that allows users to create, manage, and visualize their family genealogies.

## 🚀 Features

-   **User Authentication:** Secure registration and login system.
-   **Family Management:** Create and manage families, invite members, and set permissions.
-   **Interactive Tree Visualization:** A dynamic, interactive, and zoomable family tree diagram.
-   **Member Profiles:** Add and edit detailed profiles for each family member, including biography, photos, and key dates.
-   **Relationship Management:** Define and manage complex relationships between family members.

## 🏛️ Architecture Overview

The system is built on a modern, decoupled architecture with a NestJS backend and a Next.js frontend.

### Backend (NestJS)

The backend, located in `project/backend`, is a robust and scalable application built with the NestJS framework.

-   **Framework:** NestJS
-   **ORM:** Prisma
-   **Database:** PostgreSQL
-   **Authentication:** Passport.js with JWT
-   **API Documentation:** Swagger

The backend exposes a RESTful API to the frontend for all data operations. It handles business logic, data persistence, and authentication.

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

The frontend, located in `project/frontend`, is a modern, server-side rendered application built with Next.js and React.

-   **Framework:** Next.js / React
-   **Styling:** Tailwind CSS & Radix UI
-   **State Management:** Redux Toolkit
-   **Tree Visualization:** React Flow (`@xyflow/react`)
-   **Layout Engine:** Dagre.js

#### Tree Visualization Engine

The family tree is rendered using the powerful **React Flow** library, which provides a flexible and interactive canvas.

> The rendering logic is centered around the `group-content.tsx` component. It fetches family data and transforms it into `nodes` and `edges` compatible with React Flow. The layout of the tree is not hardcoded; instead, the **Dagre.js** library is used to algorithmically determine the optimal position of each node (`family-member-node.tsx`) based on their relationships and generation, creating a clean and readable "tight-tree" structure. The calculated positions are then stored back to the database.

This dynamic approach allows the system to handle complex family structures, including multiple spouses, divorces, and adoptions, while maintaining a clear and organized visual representation.

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
    pnpm dev
    ```

3.  **Frontend Setup:**
    ```bash
    cd project/frontend
    pnpm install
    cp .env.example .env
    # Update .env with your backend API URL
    pnpm dev
    ```

## 🔐 Environment Variables

### Backend (`project/backend/.env.example`)

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/family_tree_db?schema=public"

# JWT Authentication
JWT_SECRET="supersecretjwtkey"
JWT_ACCESS_TOKEN_SECRET="anotheraccesssecret"
JWT_REFRESH_TOKEN_SECRET="refreshsecretkey"
JWT_ACCESS_TOKEN_EXPIRATION_TIME="1h" # e.g., 1h, 1d, 7d
JWT_REFRESH_TOKEN_EXPIRATION_TIME="7d" # e.g., 1h, 1d, 7d

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Server Port
PORT=3001
```

### Frontend (`project/frontend/.env.example`)

```
# Application Environment
NODE_ENV="development"

# JWT Configuration (Frontend uses these for managing tokens, typically from backend)
ACCESS_TOKEN_EXPIRES_IN="3600" # seconds, e.g., 1 hour
REFRESH_TOKEN_EXPIRES_IN="604800" # seconds, e.g., 7 days
JWT_ACCESS_SECRET_KEY="anotheraccesssecret" # Should match backend's JWT_ACCESS_TOKEN_SECRET
JWT_REFRESH_SECRET_KEY="refreshsecretkey" # Should match backend's JWT_REFRESH_TOKEN_SECRET

# File Upload Configuration
MAX_FILE_SIZE="5242880" # 5 MB in bytes
FOLDER_ALBUM="family-tree/albums"
FOLDER_USER="family-tree/users"
FOLDER_FAMILY="family-tree/families"

# Cloudinary Configuration
CLOUDINARY_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_URL="cloudinary://your_api_key:your_api_secret@your_cloud_name"

# Client Domain
CLIENT_DOMAIN="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"

# Frontend Server Port
PORT=3000

# Backend API URL (for frontend to connect to)
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

The application should now be running, with the frontend accessible at `http://localhost:3000` and the backend at `http://localhost:3001`.