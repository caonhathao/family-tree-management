
## 1. Executive Summary

### Findings

The frontend codebase contains **three competing response shapes**, **two error handlers**, **two pagination schemas**, and **multiple duplicated type definitions**. While a well-designed `ApiResponse<T>` envelope and `ResponseFactory` class exist in `src/lib/res/`, they are **not used by any server action**. Instead, all server actions use a simplified `handleError()` that returns an incompatible `{ success, error }` shape, forcing client components into fragile duck-typing patterns like `"error" in result`.

### Impact

| Problem | Severity | Scope |
|---------|----------|-------|
|`handleError()` returns incompatible shape vs `ApiResponse` | **High** | All 6 modules, all client consumers |
| Two pagination schemas with different field names | **High** | Blog, User list endpoints |
| Duplicate DTO types across `.dto.ts` and `.service-validator.ts` | **Medium** | Family, FamilyMember, Relationship, GroupMember |
| Heavy `as Type` assertions hiding Prisma shape mismatches | **Medium** | Auth, Family, Blog services |
| 11+ unused/dead type definitions | **Low** | All DTO files |
| Services throw raw `Error` instead of `ServiceError` | **Medium** | All service files |
| Mix of English and Vietnamese error messages | **Low** | Client schemas, services |

### Recommended Action

Adopt the **unified `ActionResponse<T>` contract** defined in this document and migrate incrementally, starting with the error handling layer (`handleError` -> `ResponseFactory`).

---

## 2. Current State Audit

### 2.1 Competing Response Types

Three distinct shapes exist across the codebase:

**Shape A - `ApiResponse<T>`** (`src/types/api.types.ts`)
```typescript
interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  code: StatusCode;
  data?: T;
  meta?: { pagination?: PaginationMeta; cursor?: CursorMeta };
  errors?: Record<string, string[] | undefined> | null | object;
}
```

**Shape B - `IErrorResponse`** (`src/types/base.types.ts`)
```typescript
interface IErrorResponse {
  success: boolean;
  error: string;  // NOTE: singular "error", not "errors"
}
```

**Shape C - `ISuccessResponse`** (`src/types/base.types.ts`)
```typescript
interface ISuccessResponse {
  success: boolean;
  message: string;
}
```

**Shape D - Ad-hoc** (returned by various services)
```typescript
// blog.service.ts getBlogs()
{ data: IBlogList[]; pagination: { totalItems, totalPages, currentPage, pageSize } }

// user.service.ts getAllUser()
{ data: IUserList[]; pagination: { totalItems, totalPages, currentPage, pageSize } }

// fetchWith-auth.ts 401 handling
{ success: false, message: "Unauthorized: Please login again", code: 401 }
```

### 2.2 Two Error Handlers

| Function | Location | Returns | Used By |
|----------|----------|---------|---------|
| `ResponseFactory.handleError()` | `src/lib/res/response.factory.ts:121` | `ApiResponse<never>` with `code`, `message`, `errors` | **Nothing** in modules |
| `handleError()` | `src/lib/utils/funcs.utils.ts:3` | `IErrorResponse` with `success`, `error` | **All** server actions |

### 2.3 Duplicate Pagination

| Type | Location | Fields |
|------|----------|--------|
| `PaginationMeta` | `src/types/api.types.ts:20` | `page, limit, total, totalPages, hasNextPage, hasPrevPage` |
| `IPaginationBase<T>` | `src/types/base.types.ts:11` | `data, pagination: { totalItems, totalPages, currentPage, pageSize }` |

These have **incompatible field names** (`total` vs `totalItems`, `page` vs `currentPage`, `limit` vs `pageSize`).

### 2.4 Duplicate DTO Definitions

| Type | Defined In | Also Defined In |
|------|-----------|----------------|
| `IFamilyMemberDto` | `family-member/family-member.dto.ts:1` | `family/family.service-validator.ts:44` (Zod-inferred) |
| `IRelationshipDto` | `relationships/relationship.dto.ts:1` | `family/family.service-validator.ts:45` (Zod-inferred) |
| `IFamilyDto` | `family/family.dto.ts:3` | `family/family.service-validator.ts:46` (Zod-inferred) |
| `UpdateGroupMemberDto` | `group-member/group-member.dto.ts:3` | `group-member/group-member.service-validator.ts:8` (Zod-inferred) |

The Zod-inferred types and manual interfaces have **different shapes** (e.g., `gender: string` vs `gender: GENDER`, `dateOfBirth: string` vs `dateOfBirth: Date`).

### 2.5 Unused Types

| Type | File | Status |
|------|------|--------|
| `ResponseDataBase<T>` | `base.types.ts:5` | Never imported |
| `IResponseCreateFamilyDto` | `family/family.dto.ts:9` | Never imported |
| `IUpdateFamilyDto` | `family/family.dto.ts:22` | Never imported |
| `IResponseUpdateFamilyDto` | `family/family.dto.ts:29` | Never imported |
| `IResponseFamilyDto` | `family/family.dto.ts:42` | Never imported |
| `IUserSecuityDto` (typo) | `user/user.dto.ts:9` | Never imported |
| `ResponseCreateFamilyMemberDto` | `family-member/family-member.dto.ts:25` | Never imported |
| `ResponseUpdateFamilyMemberDto` | `family-member/family-member.dto.ts:33` | Never imported |
| `ResponseRelationshipDto` | `relationships/relationship.dto.ts:8` | Never imported |
| `ResponseUpdateGroupMemberDto` | `group-member/group-member.dto.ts:8` | Never imported |
| `IResponseCreateInviteDto` | `invite/invite.dto.ts:5` | Never imported |
| `CursorMeta` | `types/api.types.ts:29` | Never used in action flow |
| `DbClient` | `types/api.types.ts:62` | Never imported |

### 2.6 Loose Types and `as` Assertions

| File:Line | Pattern | Issue |
|-----------|---------|-------|
| `auth.service.ts:88` | `as INewUser` | Prisma select result cast to mismatched interface |
| `auth.service.ts:185` | `as INewUser` | Same pattern repeated |
| `auth.service.ts:387` | `as INewUser` | Same pattern repeated |
| `auth.service.ts:467` | `as INewUser` | Same pattern repeated |
| `family.service.ts:98` | `as unknown as IBiographyContent` | Double cast |
| `family.service.ts:108` | `as unknown as IDraftFamilyData` | Double cast |
| `blog.service-validator.ts:7` | `content: z.any()` | No validation on blog content |
| `env-config.lib.ts:45` | `let envData: any = {}` | Untyped environment |
| `blog.service.ts:50` | `OutputBlockData<string, any>` | Explicit any |

---

## 3. Data Flow Diagram

### Current (Broken) Flow

```
+-----------------------------------------------------------+
|  Service Layer (.service.ts)                               |
|  Returns: raw Prisma data / raw objects                    |
|  Throws: new Error("message")  <-- NOT ServiceError        |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Server Action Layer (.actions.ts)                         |
|  try/catch -> handleError() -> returns IErrorResponse      |
|  { success: false, error: "message" }                      |
|  On success: returns raw data, ISuccessResponse,           |
|  or nothing (void)                                         |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Client Component                                          |
|  Duck-types: "error" in result                             |
|  Or: result.success == false && "error" in result          |
|  No compile-time type safety on the discriminated union    |
+-----------------------------------------------------------+
```

### Proposed (Unified) Flow

```
+-----------------------------------------------------------+
|  Service Layer (.service.ts)                               |
|  Returns: raw typed data                                   |
|  Throws: ServiceError (business) / Error (unexpected)      |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Server Action Layer (.actions.ts)                         |
|  try/catch -> ResponseFactory.handleError()                 |
|  Returns: ActionResponse<T>                                |
|  = ActionSuccess<T> | ActionError                          |
|  Discriminated by: "success" field                         |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Client Component                                          |
|  Type-safe: if (result.success) { result.data }            |
|  Or: isActionSuccess(result) type guard                    |
|  Full IntelliSense on data, errors, meta                   |
+-----------------------------------------------------------+
```

---

## 4. Consolidated TypeScript Standards

### 4.1 Core API Envelope

**File**: `src/types/api.types.ts`

```typescript
// --- HTTP Status Codes ---
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  GATEWAY_TIMEOUT: 504,
} as const;

export type StatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

// --- Pagination Meta ---
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// --- Cursor Meta ---
export interface CursorMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

// --- Unified API Response Envelope ---
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  code: StatusCode;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    cursor?: CursorMeta;
  };
  errors?: Record<string, string[] | undefined> | null;
}
```

### 4.2 Server Action Response Types

**File**: `src/types/action.types.ts` (NEW)

```typescript
import { StatusCode } from "./api.types";

// --- Success Response (returned by all actions on success) ---
export interface ActionSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

// --- Error Response (returned by all actions on failure) ---
export interface ActionError {
  success: false;
  message: string;
  code?: StatusCode;
  errors?: Record<string, string[] | undefined> | null;
}

// --- Discriminated Union for server action returns ---
export type ActionResponse<T> = ActionSuccess<T> | ActionError;

// --- Type Guards ---
export function isActionSuccess<T>(
  response: ActionResponse<T>,
): response is ActionSuccess<T> {
  return response.success === true;
}

export function isActionError<T>(
  response: ActionResponse<T>,
): response is ActionError {
  return response.success === false;
}

// --- Paginated Success Response ---
export interface ActionPaginatedSuccess<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
}

export type ActionPaginatedResponse<T> =
  | ActionPaginatedSuccess<T>
  | ActionError;

export function isPaginatedSuccess<T>(
  response: ActionPaginatedResponse<T>,
): response is ActionPaginatedSuccess<T> {
  return response.success === true && "pagination" in response;
}
```

---

## 5. Unified Response Shapes

### 5.1 Success Response (Simple)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nguyen Family",
    "description": "Extended family tree",
    "lineageType": "PATRIARCHAL"
  },
  "message": "success"
}
```

### 5.2 Success Response (Paginated)

```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123",
      "title": "Getting Started with Family Trees",
      "slug": "getting-started",
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "success"
}
```

### 5.3 Error Response (System Error)

```json
{
  "success": false,
  "message": "Internal Server Error",
  "code": 500
}
```

### 5.4 Error Response (Validation Error)

```json
{
  "success": false,
  "message": "Validation failed: Email is required",
  "code": 422,
  "errors": {
    "email": ["Email is required"],
    "password": ["Must be at least 8 characters"]
  }
}
```

### 5.5 Error Response (Business Logic Error)

```json
{
  "success": false,
  "message": "User is not a leader of this group",
  "code": 403
}
```

### 5.6 Error Response (Prisma Unique Constraint)

```json
{
  "success": false,
  "message": "Value for email already exists.",
  "code": 409
}
```

---

## 6. Server Action Layer Convention

### 6.1 Current Pattern (Deprecated)

```typescript
// CURRENT -- each action has inconsistent return shapes
export async function GetFamilyData(groupId: string) {
  try {
    const res: IDraftFamilyData = await FamilyService.getFamily(groupId);
    return res;  // Returns raw data, or IErrorResponse on failure
  } catch (err: unknown) {
    return handleError(err);  // Returns { success: false, error: "..." }
  }
}
```

Client must duck-type:
```typescript
// Fragile runtime check
if (blog && "content" in blog && typeof blog.content === "string") { ... }
```

### 6.2 Proposed Pattern (Unified)

```typescript
// PROPOSED -- consistent ActionResponse<T> return type
import { ActionResponse, ActionError } from "@/types/action.types";
import { ResponseFactory } from "@/lib/res/response.factory";

export async function GetFamilyData(
  groupId: string,
): Promise<ActionResponse<IDraftFamilyData>> {
  try {
    const res = await FamilyService.getFamily(groupId);
    return { success: true, data: res };
  } catch (err: unknown) {
    return ResponseFactory.handleError(err) as ActionError;
  }
}
```

Client consumes with type guard:
```typescript
// Type-safe, full IntelliSense
const result = await GetFamilyData(groupId);
if (result.success) {
  // result.data is IDraftFamilyData
  setFamily(result.data);
} else {
  // result.message, result.code are available
  showError(result.message);
}
```

### 6.3 Action Template

```typescript
"use server";

import { headers } from "next/headers";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ServiceError } from "@/lib/res/service-error";
import { ActionResponse, ActionError } from "@/types/action.types";

export async function SomeAction(
  input: SomeDto,
): Promise<ActionResponse<SomeResultType>> {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new ServiceError("Unauthorized", 401);
    }

    const result = await SomeService.doSomething(userId, input);
    return { success: true, data: result };
  } catch (err: unknown) {
    return ResponseFactory.handleError(err) as ActionError;
  }
}
```

---

## 7. Client Consumption Pattern

### 7.1 Type Guard Imports

```typescript
import {
  isActionSuccess,
  isActionError,
  ActionResponse,
} from "@/types/action.types";
```

### 7.2 In Server Components (RSC)

```typescript
export default async function GroupPage({ params }) {
  const familyData = await GetFamilyData(params.groupId);

  if (!familyData.success) {
    notFound(); // or render error state
  }

  // familyData.data is fully typed
  return <GroupContent family={familyData.data} />;
}
```

### 7.3 In Client Components

```typescript
"use client";

function GroupContent({ groupId }: { groupId: string }) {
  const handleSync = async () => {
    const result = await SyncFamilyAction(groupId, draft);

    if (isActionSuccess(result)) {
      Toaster({ title: "Saved", description: "Family synced", type: "success" });
    } else {
      Toaster({ title: "Error", description: result.message, type: "error" });
    }
  };
}
```

### 7.4 In Redux Thunks

```typescript
export const saveFamilyDraft = createAsyncThunk(
  "family/save",
  async (groupId: string, { getState, dispatch, rejectWithValue }) => {
    const { draft, origin } = (getState() as RootState).family;
    if (isEqual(draft, origin)) return;

    const result = await SyncFamilyAction(groupId, draft);

    if (!result.success) {
      return rejectWithValue(result.message);
    }

    dispatch(syncSuccess());
    return result.data;
  },
);
```

---

## 8. Error Handling Strategy

### 8.1 Error Hierarchy

```
ServiceError (business logic)
  |-- statusCode: StatusCode
  |-- message: string
  +-- errors?: Record<string, string[]>

ZodError (validation)
  |-- issues[].message
  +-- issues[].path

PrismaClientKnownRequestError (database)
  +-- Mapped via toTypedPrismaError()

Error (unexpected)
  +-- Fallback to 500
```

### 8.2 Central Error Handler

The existing `ResponseFactory.handleError()` in `src/lib/res/response.factory.ts` is well-designed and should become the **single error handler** for all server actions. It already handles:

- `ServiceError` -> maps `statusCode` and `message`
- `ZodError` -> returns 422 with first error message
- `PrismaUniqueConstraintError` -> 409 with field name
- `PrismaRecordDoesNotExistError` -> 404
- `PrismaForeignKeyConstraintError` -> 400 with field name
- Unknown errors -> 500

**Action**: Delete `handleError()` from `src/lib/utils/funcs.utils.ts` and replace all usages with `ResponseFactory.handleError()`.

### 8.3 Service Layer Rules

1. **Services return raw typed data** -- no wrapping in response objects
2. **Services throw `ServiceError`** for business logic failures:
   ```typescript
   import { ServiceError } from "@/lib/res/service-error";
   throw new ServiceError("User is not a leader of this group", 403);
   ```
3. **Services throw raw `Error`** only for unexpected/programmer errors
4. **Services never catch and return error objects** -- let the action layer handle it

### 8.4 Message Constants

All user-facing messages should use the translation key system in `src/lib/messages/response.messages.ts`:

```typescript
import { Exception } from "@/lib/messages/response.messages";
throw new ServiceError(Exception.PEMRISSION, 403);
throw new ServiceError(Exception.NOT_EXIST, 404);
```

---

## 9. Response Examples

### 9.1 Successful CRUD -- Create Group

**Action**: `createGroupFamilyAction`
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "name": "Nguyen Extended Family",
    "description": "Our big family tree"
  },
  "message": "success"
}
```

### 9.2 Successful List -- Get Blogs (Paginated)

**Action**: `getBlogsAction`
```json
{
  "success": true,
  "data": [
    { "id": "1", "title": "Family Heritage", "slug": "family-heritage", "createdAt": "2026-07-15T08:00:00Z" },
    { "id": "2", "title": "Genealogy Tips", "slug": "genealogy-tips", "createdAt": "2026-07-10T08:00:00Z" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "success"
}
```

### 9.3 Validation Error -- Invalid Email

**Action**: `registerAction`
```json
{
  "success": false,
  "message": "Validation failed: Email is required",
  "code": 422,
  "errors": {
    "email": ["Email is required"]
  }
}
```

### 9.4 Business Logic Error -- Permission Denied

**Action**: `updateGroupFamilyAction`
```json
{
  "success": false,
  "message": "User is not a leader of this group",
  "code": 403
}
```

### 9.5 Database Error -- Unique Constraint

**Action**: `registerAction` (duplicate email)
```json
{
  "success": false,
  "message": "Value for email already exists.",
  "code": 409
}
```

### 9.6 System Error -- Unexpected Failure

**Action**: Any action
```json
{
  "success": false,
  "message": "Internal Server Error",
  "code": 500
}
```

---

## 10. Consolidation Roadmap

### Phase 1: Foundation (Non-Breaking)

| Step | Action | Files |
|------|--------|-------|
| 1.1 | Create `src/types/action.types.ts` with `ActionResponse<T>`, `ActionError`, type guards | NEW |
| 1.2 | Remove `ResponseDataBase<T>`, `IPaginationBase<T>`, `IErrorResponse`, `ISuccessResponse` from `base.types.ts` | `types/base.types.ts` |
| 1.3 | Remove duplicate option interfaces from `response.interface.ts` (keep only the ones in `response.factory.ts`) | `lib/res/response.interface.ts` |
| 1.4 | Remove all 11 unused DTO types (see Section 2.5) | Multiple `.dto.ts` files |

### Phase 2: Error Handling Migration

| Step | Action | Files |
|------|--------|-------|
| 2.1 | Replace `handleError()` calls with `ResponseFactory.handleError()` in all server actions | All `*.actions.ts`, `*.action.ts` |
| 2.2 | Delete `handleError()` from `funcs.utils.ts` | `lib/utils/funcs.utils.ts` |
| 2.3 | Replace `throw new Error(...)` in services with `throw new ServiceError(...)` | All `*.service.ts` |
| 2.4 | Update `fetchWithAuth` to return typed `ApiResponse<unknown>` or `ActionError` | `lib/api/fetch-with-auth.ts` |

### Phase 3: DTO Consolidation

| Step | Action | Files |
|------|--------|-------|
| 3.1 | Keep Zod-inferred types as source of truth, delete manual interface duplicates | `family.dto.ts`, `family-member.dto.ts`, `relationship.dto.ts`, `group-member.dto.ts` |
| 3.2 | Remove `as Type` assertions by aligning Prisma `select` with DTO shapes | `auth.service.ts`, `family.service.ts`, `blog.service.ts` |
| 3.3 | Replace `z.any()` in `BlogUpdateServiceDto.content` with proper schema | `blog/blog.service-validator.ts` |

### Phase 4: Client Consumption Update

| Step | Action | Files |
|------|--------|-------|
| 4.1 | Update all client components to use `isActionSuccess()` / `isActionError()` type guards | All `*.tsx` client components |
| 4.2 | Update Redux thunks to use `ActionResponse<T>` | `store/family/familyThunk.ts`, `store/blog/blogThunk.ts` |
| 4.3 | Remove duck-typing patterns (`"error" in result`) | `feature-editor-internal.tsx`, `login-form.tsx`, `auth-client-lib.ts` |

### Files to Modify

| File | Change |
|------|--------|
| `src/types/action.types.ts` | **CREATE** -- New discriminated union types |
| `src/types/api.types.ts` | Clean up -- keep `ApiResponse`, `HttpStatus`, `StatusCode`, `PaginationMeta`, `CursorMeta`, `DbClient` |
| `src/types/base.types.ts` | **DELETE** -- Remove `ResponseDataBase`, `IPaginationBase`, `IErrorResponse`, `ISuccessResponse` (migrate to `action.types.ts`) |
| `src/lib/res/response.factory.ts` | Already correct -- use as-is |
| `src/lib/res/response.interface.ts` | **DELETE** -- Redundant with factory's local interfaces |
| `src/lib/utils/funcs.utils.ts` | Remove `handleError()` (keep `safeJsonParse`) |
| `src/lib/api/fetch-with-auth.ts` | Add generic type parameter, return `ActionResponse<T>` |
| All `*.actions.ts` / `*.action.ts` | Return `ActionResponse<T>`, use `ResponseFactory.handleError()` |
| All `*.service.ts` | Throw `ServiceError` instead of `Error` |
| All `*.dto.ts` | Remove unused types, keep Zod-inferred as source of truth |
| All client components | Use `isActionSuccess()` / `isActionError()` type guards |
| `store/family/familyThunk.ts` | Handle `ActionResponse` |
| `store/blog/blogThunk.ts` | Handle `ActionResponse` |

---

> **Summary**: The `ResponseFactory` and `ApiResponse<T>` already exist and are well-designed. The core problem is that the server action layer bypasses them. By migrating all actions to return `ActionResponse<T>` and using `ResponseFactory.handleError()` as the single error handler, we achieve full type safety from service -> action -> client with zero duck-typing.