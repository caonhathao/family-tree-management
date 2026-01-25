# AGENTS.md

This file contains guidelines and commands for agentic coding assistants working in this NestJS family management backend codebase.

## Project Overview

This is a NestJS-based backend application for family tree management with PostgreSQL database and Prisma ORM. The application uses JWT authentication, role-based access control, and includes modules for users, families, relationships, events, albums, and group management.

## Build & Development Commands

### Essential Commands

```bash
# Development
npm run start:dev          # Start in watch mode (most common)
npm run build              # Build for production
npm run start:prod         # Start production build

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier

# Testing
npm run test               # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
npm run test:debug         # Run tests in debug mode
```

### Running a Single Test

```bash
# Run specific unit test file
npm run test -- user.service.spec.ts

# Run test with specific pattern
npm run test -- --testNamePattern="should update user profile"

# Run single E2E test
npm run test:e2e -- --testNamePattern="user registration flow"
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
- Path mapping available: `src/`, `prisma/`, `@/` → `src/`

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

- `src/` → direct path to src directory
- `prisma/` → direct path to prisma directory
- `@/` → src directory (alternative)

### Constants & Messages

- Use `Exception` from `src/common/messages/messages.response`
- Use `HttpStatus` from `src/common/constants/api`
- Define reusable error messages

### File Upload

- Use CloudinaryService for image uploads
- Validate file types and sizes
- Handle upload errors gracefully

## Development Workflow

1. **Before making changes**: Run `npm run lint` to ensure code quality
2. **During development**: Use `npm run start:dev` for hot reload
3. **Testing**: Write unit tests for new business logic
4. **Final verification**: Run `npm run test` and `npm run lint` before committing

## Important Notes

- Package manager: npm (npm-lock.yaml present)
- Database migrations: Use Prisma CLI for schema changes
- Environment variables: Managed through EnvConfigService
- API documentation: Available at `/api/docs` (Swagger)
- Global API prefix: `/api`
- CORS is enabled for frontend integration

This codebase follows NestJS best practices with comprehensive error handling, security measures, and maintainable architecture. Always follow existing patterns when implementing new features.
