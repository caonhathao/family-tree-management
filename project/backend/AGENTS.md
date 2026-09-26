# AGENTS.md

This file contains guidelines and commands for agentic coding assistants working in this NestJS family management backend codebase.

## Project Overview

This is a NestJS-based backend application for family tree management with PostgreSQL database and Prisma ORM. The application uses JWT authentication, role-based access control, and includes modules for users, families, relationships, events, albums, and group management.

## Build & Development Commands

### Essential Commands

```bash
# Development
pnpm start:dev          # Start in watch mode (most common)
pnpm build              # Build for production
pnpm start:prod         # Start production build

# Code Quality
pnpm lint               # ESLint check only (no --fix)
pnpm lint:fix           # ESLint with --fix
pnpm lint:src           # what CI runs
pnpm format             # Prettier --write on src/ and test/ only (NOT prisma/)
pnpm exec tsc --noEmit  # typecheck (no `typecheck` script exists)

# Testing — CI runs only `pnpm test`
pnpm test               # unit specs in src/ (*.spec.ts, rootDir=src)
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run tests with coverage
pnpm test:e2e           # test/*.e2e-spec.ts — needs live PostgreSQL + full .env
pnpm test:debug         # Run tests in debug mode
```

### Running a Single Test

```bash
# Run specific unit test file
pnpm test -- user.service.spec.ts

# Run test with specific pattern
pnpm test -- --testNamePattern="should update user profile"

# Run single E2E test
pnpm test:e2e -- --testNamePattern="user registration flow"
```

## Code Style & Conventions

### File & Directory Structure

- **Files**: kebab-case (e.g., `user.service.ts`, `update-user.dto.ts`)
- **Classes**: PascalCase (e.g., `UserService`, `UpdateUserDto`)
- **Variables/Functions**: camelCase
- **Database tables**: snake_case (Prisma handles mapping)

### Import Organization

```typescript
// 1. External framework imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

// 2. External library imports
import { IsEmail, IsOptional, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';

// 3. Internal imports - use path mapping
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Exception } from 'src/common/messages/messages.response';
import { CloudinaryService } from 'src/common/config/cloudinary/cloudinary.service';
```

### TypeScript Configuration

- Strict null checks enabled
- Decorators enabled for NestJS
- Target: ES2023
- Path mapping available: `src/*` only (see root `AGENTS.md` — `@/` and `prisma/` are NOT valid aliases here)

### Code Formatting (Prettier)

- Single quotes: `"singleQuote": true`
- Trailing commas: `"trailingComma": "all"`
- End of line: auto

### ESLint Rules

- `@typescript-eslint/no-explicit-any`: disabled (allow any)
- `@typescript-eslint/no-floating-promises`: warning
- `@typescript-eslint/no-unsafe-argument`: warning
- Prettier integration enforced

## Architecture Patterns

### Module Structure

Each feature follows the Controller-Service-Repository pattern:

```
modules/
├── feature-name/
│   ├── feature-name.controller.ts    # HTTP endpoints
│   ├── feature-name.service.ts       # Business logic
│   ├── feature-name.module.ts        # Module definition
│   └── dto/                          # Data Transfer Objects
│       ├── create-feature.dto.ts
│       └── update-feature.dto.ts
```

### Response Format

All API responses use `ResponseFactory` for consistency:

```typescript
// Success response
ResponseFactory.success({ data, message, code });

// Paginated response
ResponseFactory.paginated({ data, page, limit, total });

// Error response
ResponseFactory.error({ message, code, errors });
```

### Error Handling

- Use `ServiceError` for custom business logic errors
- Leverage `ResponseFactory.handleError()` for consistent error formatting
- Prisma errors are automatically mapped to appropriate HTTP responses
- Always validate UUIDs and permissions in service methods

### DTOs & Validation

```typescript
export class UpdateUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail({}, { message: InvalidMessageResponse.EMAIL_INCORRECT })
  @IsOptional()
  email?: string;
}
```

### Authentication & Authorization

- JWT-based authentication with access/refresh tokens
- Role-based access control: `@Roles('owner', 'editor', 'viewer')`
- Leadership/ownership: `@Leader()`
- User context: `@GetUser()`, `@GetUserId()`

## Database Patterns

### Prisma Usage

- Always use type-safe Prisma client
- Handle database errors with specific Prisma error classes
- Use transactions for multi-table operations
- Snake_case database fields, camelCase TypeScript properties

### Common Database Operations

```typescript
// Find with validation
if (!isUUID(id)) throw new NotFoundException(Exception.NOT_EXIST);

// Update with permissions
if (targetId !== userId) throw new ForbiddenException(Exception.PERMISSION);

// Transaction usage
await this.prisma.$transaction(async (tx) => {
  // Multiple operations
});
```

## Testing Guidelines

### Unit Tests (`*.spec.ts`)

- Use Jest with TypeScript support
- Mock external dependencies (Prisma, Cloudinary, etc.)
- Test business logic, not infrastructure
- File location: same directory as source file

### E2E Tests (`*.e2e-spec.ts`)

- Use Supertest for HTTP testing
- Test complete user workflows
- Use test database or transactions
- File location: `test/` directory

### Test Structure

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('update', () => {
    it('should update user profile successfully', async () => {
      // Test implementation
    });
  });
});
```

## Common Utilities

### Path Mapping

Use these import aliases consistently:

- `src/...` → `src` directory (the only alias the backend tsconfig/jest define)
- Relative imports (`./dto/x.dto`) for same-module files, as the existing code does
- `prisma/...` and `@/...` appear in `test/jest-e2e.json` mappings only — they will fail `tsc --noEmit` in `src`

### Constants & Messages

- Use `Exception` from `src/common/messages/messages.response`
- Use `HttpStatus` from `src/common/constants/api`
- Define reusable error messages

### File Upload

- Use CloudinaryService for image uploads
- Validate file types and sizes
- Handle upload errors gracefully

## Development Workflow

1. **Before making changes**: Run `pnpm lint` to ensure code quality
2. **During development**: Use `pnpm start:dev` for hot reload
3. **Testing**: Write unit tests for new business logic
4. **Final verification**: mirror CI order — `pnpm exec prettier --check "src/**/*.ts"`, `pnpm lint:src`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`

## Important Notes

- Package manager: **pnpm** (`pnpm-lock.yaml`; no npm lockfile). Scripts shell out to `pnpm nest ...`
- No `typecheck` script — use `pnpm exec tsc --noEmit` (this is what CI runs)
- Prisma 7: multi-file schema in `prisma/schema/`, `url` only in `prisma.config.ts`, pg driver adapter, `postinstall` runs `prisma generate` (root `AGENTS.md` has details)
- Database migrations: `pnpm prisma migrate dev` for schema changes; never hand-edit `prisma/migrations/`
- Environment variables: Managed through EnvConfigService
- API documentation: Available at `/api/docs` (Swagger)
- Global API prefix: `/api`
- CORS is enabled for frontend integration

This codebase follows NestJS best practices with comprehensive error handling, security measures, and maintainable architecture. Always follow existing patterns when implementing new features.
