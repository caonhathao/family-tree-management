# API Response Flow — Type Safety & Error Handling Audit

## 1. Executive Summary

### Findings

The frontend codebase has a **well-designed** `ResponseFactory` class and `ApiResponse<T>` envelope in `src/lib/res/`, and all server actions already use `ResponseFactory.handleError()` for error handling. However, the **success path is unstructured**: actions return raw data with no unified envelope, creating inconsistent return types across all 8 action files. Client components must duck-type results at runtime (`"content" in result`, `"tokens" in result`) with no compile-time safety.

Additionally, a critical bug exists: multiple actions throw `new Error("Unauthorized")` instead of `new ServiceError("Unauthorized", 401)`, which causes `handleError()` to return **500 Internal Server Error** instead of **401 Unauthorized**.

### Impact

| Problem | Severity | Scope |
|---------|----------|-------|
| Mixed success return types (no unified `ActionResponse<T>`) | **High** | All 8 actions, all client consumers |
| `throw new Error("Unauthorized")` -> 500 instead of 401 | **High** | auth, family, blog, group-family, group-member, user, invite actions |
| Two pagination schemas with incompatible field names | **High** | Blog, User list endpoints |
| `fetchWithAuth` has ad-hoc 401 handling bypassing `ResponseFactory` | **Medium** | All `fetchWithAuth` consumers |
| Duplicate DTO types across `.dto.ts` and `.service-validator.ts` | **Medium** | Family, FamilyMember, Relationship, GroupMember |
| Heavy `as Type` assertions hiding Prisma shape mismatches | **Medium** | Auth, Family, Blog services |
| Services throw raw `Error` instead of `ServiceError` | **Medium** | All service files |
| 11+ unused/dead type definitions | **Low** | All DTO files |
| Mix of English and Vietnamese error messages | **Low** | Client schemas, services, `fetchWithAuth` |

### Recommended Action

Adopt the **unified `ActionResponse<T>` contract** defined in this document. The error handling infrastructure is already correct -- the migration focuses on (1) unifying the success path, (2) fixing the `Error("Unauthorized")` bug, and (3) standardizing service throws to `ServiceError`.

---

## 2. Current State Audit

### 2.1 Response Types Across the Codebase

Five distinct shapes exist, used in different contexts:

**Shape A -- `ApiResponse<T, ME>`** (`src/types/api.types.ts:51`) -- Used for **error responses** by all actions.
```typescript
export interface ApiResponse<T = null, ME = unknown> {
  success: boolean;
  message: string;
  code: StatusCode;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    cursor?: CursorMeta;
  } & (ME extends Record<string, unknown> ? ME : unknown);
  errors?: Record<string, string[] | undefined> | null | object;
}
```

**Shape B -- `IErrorResponse`** (`src/types/base.types.ts:21`) -- Exists but NOT used by actions. Used in auth client-side code.
```typescript
interface IErrorResponse {
  success: boolean;
  error: string;  // singular "error", not "errors"
}
```

**Shape C -- `ISuccessResponse`** (`src/types/base.types.ts:26`) -- Used by auth actions for explicit success returns.
```typescript
interface ISuccessResponse {
  success: boolean;
  message: string;
}
```

**Shape D -- Raw data** -- Most actions return raw Prisma/service data on success with no wrapper.

**Shape E -- `IPaginationBase<T>`** (`src/types/base.types.ts:11`) -- Used by blog and user list actions.
```typescript
interface IPaginationBase<T> {
  data: T;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
```

**Shape F -- Ad-hoc** (`fetch-with-auth.ts:20-27`) -- Hand-crafted 401 response bypassing `ResponseFactory`.
```typescript
{ success: false, message: "Unauthorized: Please login again", code: 401 }
```

### 2.2 Error Handler -- Single, Already Used Everywhere

There is **one** error handler, and all 8 server actions already use it:

| Function | Location | Returns | Used By |
|----------|----------|---------|---------|
| `ResponseFactory.handleError()` | `src/lib/res/response.factory.ts:121` | `ApiResponse<never>` with `success, message, code, errors` | **All 8 actions + all services** |

There is **no** `handleError()` in `src/lib/utils/funcs.utils.ts` -- that file contains only `safeJsonParse()`.

### 2.3 Success Return Types -- The Real Problem

Actions return different types on success with no unified envelope:

| Action | Return Type Annotation | Actual Success Return |
|--------|----------------------|----------------------|
| `GetFamilyData` | `Promise<IDraftFamilyData \| ApiResponse<IDraftFamilyData, unknown>>` | Raw `IDraftFamilyData` |
| `SyncFamilyAction` | *(none)* | Raw service result |
| `UpdatefamilyInfo` | *(none)* | Raw service result |
| `DeleteFamilyAction` | *(none)* | Raw service result |
| `getBlogAction` | `Promise<IBlogDto \| ApiResponse<IBlogDto, unknown>>` | Raw `IBlogDto` |
| `updateBlogAction` | `Promise<IBlogDto \| ApiResponse<IBlogDto, unknown>>` | Raw `IBlogDto` |
| `getBlogsAction` | `Promise<IPaginationBase<IBlogsDto[]> \| ApiResponse<IBlogsDto[], unknown>>` | Raw `IPaginationBase<IBlogsDto[]>` |
| `getUserSessionAction` | `Promise<IUserSession \| ApiResponse<IUserSession, unknown>>` | Raw `IUserSession` |
| `registerAction` | *(none)* | `{ success: true, message: "..." } as ISuccessResponse` or `void` |
| `loginBaseAction` | *(none)* | `{ success: true, message: "..." } as ISuccessResponse` or `void` |
| `refreshAction` | *(none)* | `{ success: true }` or `void` |

### 2.4 The `throw new Error("Unauthorized")` Bug

Multiple actions throw `new Error("Unauthorized")` instead of `throw new ServiceError("Unauthorized", 401)`. When caught by `ResponseFactory.handleError()`, this is **not recognized** as a `ServiceError` and falls through to the default 500 handler, returning "Internal Server Error" instead of "Unauthorized".

Affected actions (all that check `userId` from headers):
- `family.actions.ts:19`
- `blog.action.ts:17`
- `auth.actions.ts:227`
- `user.actions.ts`
- `group-family.actions.ts`
- `group-member.actions.ts`
- `invite.actions.ts`

### 2.5 Duplicate Pagination

| Type | Location | Fields |
|------|----------|--------|
| `PaginationMeta` | `src/types/api.types.ts:20` | `page, limit, total, totalPages, hasNextPage, hasPrevPage` |
| `IPaginationBase<T>` | `src/types/base.types.ts:11` | `totalItems, totalPages, currentPage, pageSize` |

These have **incompatible field names** (`total` vs `totalItems`, `page` vs `currentPage`, `limit` vs `pageSize`).

### 2.6 Duplicate DTO Definitions

| Type | Defined In | Also Defined In |
|------|-----------|----------------|
| `IFamilyMemberDto` | `family-member/family-member.dto.ts:1` | `family/family.service-validator.ts:44` (Zod-inferred) |
| `IRelationshipDto` | `relationships/relationship.dto.ts:1` | `family/family.service-validator.ts:45` (Zod-inferred) |
| `IFamilyDto` | `family/family.dto.ts:3` | `family/family.service-validator.ts:46` (Zod-inferred) |
| `UpdateGroupMemberDto` | `group-member/group-member.dto.ts:3` | `group-member/group-member.service-validator.ts:8` (Zod-inferred) |

The Zod-inferred types and manual interfaces have **different shapes** (e.g., `gender: string` vs `gender: GENDER`, `dateOfBirth: string` vs `dateOfBirth: Date`).

### 2.7 Unused Types

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
| `CursorMeta` | `types/api.types.ts:29` | Only used inside `ApiResponse` type definition, never imported standalone |
| `DbClient` | `types/api.types.ts:62` | Never imported |

### 2.8 Loose Types and `as` Assertions

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

### 2.9 File Naming Inconsistency

6 action files use plural `*.actions.ts`, 2 use singular `*.action.ts`:
- Plural: `auth.actions.ts`, `family.actions.ts`, `group-family.actions.ts`, `group-member.actions.ts`, `user.actions.ts`, `invite.actions.ts`
- Singular: `blog.action.ts`, `blog-media.action.ts`

---

## 3. Data Flow Diagram

### Current State

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
|  try/catch -> ResponseFactory.handleError(err)             |
|  Returns on ERROR: ApiResponse<never>                      |
|    { success: false, message, code, errors? }              |
|  Returns on SUCCESS: (inconsistent)                        |
|    - Raw data (IDraftFamilyData, IBlogDto, etc.)           |
|    - ISuccessResponse { success: true, message }           |
|    - IPaginationBase<T> { data, pagination }               |
|    - void (auth actions that redirect)                     |
+--------------------------+--------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|  Client Component                                          |
|  Must duck-type the return:                                |
|    "content" in result                                     |
|    "tokens" in result                                      |
|    result.success == false && "error" in result            |
|  No compile-time type safety on success shape              |
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
|  try/catch -> ResponseFactory.handleError(err)             |
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
// NOTE: Two type parameters -- T (data) and ME (extra meta, defaults to unknown).
// ME is rarely leveraged; most usages pass `unknown`.
export interface ApiResponse<T = null, ME = unknown> {
  success: boolean;
  message: string;
  code: StatusCode;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    cursor?: CursorMeta;
  } & (ME extends Record<string, unknown> ? ME : unknown);
  errors?: Record<string, string[] | undefined> | null | object;
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

### 6.1 Current Pattern (Needs Unification)

```typescript
// CURRENT -- actions already use ResponseFactory.handleError() for errors,
// but return raw data with no envelope on success.

// Example: family.actions.ts (has return type annotation)
export async function GetFamilyData(
  groupId: string,
): Promise<IDraftFamilyData | ApiResponse<IDraftFamilyData, unknown>> {
  try {
    const res = await FamilyService.getFamily(groupId);
    return res;  // Returns raw data
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);  // Returns ApiResponse<never>
  }
}

// Example: blog.action.ts (has return type annotation)
export async function getBlogAction(
  slug: string,
): Promise<IBlogDto | ApiResponse<IBlogDto, unknown>> {
  try {
    const res = await BlogService.getBlog(slug);
    return res;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

// Example: auth.actions.ts (ad-hoc ISuccessResponse on success)
export async function registerAction(data: IRegisterDto) {
  try {
    // ...
    return { success: true, message: "Register successfully" } as ISuccessResponse;
  } catch (err: unknown) {
    return ResponseFactory.handleError(err);
  }
}

// BUG: family.actions.ts -- throw new Error("Unauthorized")
// handleError() does NOT recognize this as ServiceError,
// so it falls through to default 500 handler.
if (!userId) {
  throw new Error("Unauthorized");  // BUG: returns 500, not 401
}
```

Client must duck-type:
```typescript
// Fragile runtime checks
if (blog && "content" in blog && typeof blog.content === "string") { ... }
if (res && "tokens" in res) { ... }
```

### 6.2 Proposed Pattern (Unified)

```typescript
// PROPOSED -- consistent ActionResponse<T> return type
import { ActionResponse, ActionError } from "@/types/action.types";
import { ResponseFactory } from "@/lib/res/response.factory";
import { ServiceError } from "@/lib/res/service-error";

export async function GetFamilyData(
  groupId: string,
): Promise<ActionResponse<IDraftFamilyData>> {
  try {
    const headerList = await headers();
    const userId = headerList.get("X-User-Id");
    if (!userId) {
      throw new ServiceError("Unauthorized", 401);  // FIXED: was Error("Unauthorized")
    }
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

`ResponseFactory.handleError()` in `src/lib/res/response.factory.ts:121` is the **single error handler** used by all server actions. It already handles:

- `ServiceError` -> maps `statusCode` and `message`
- `ZodError` -> returns 422 with first error message
- `PrismaUniqueConstraintError` -> 409 with field name
- `PrismaRecordDoesNotExistError` -> 404
- `PrismaForeignKeyConstraintError` -> 400 with field name
- `PrismaClientKnownRequestError` codes P2000 (too long) and P1008 (timeout)
- Unknown errors -> 500

**No changes needed** to this handler. It is correctly designed and already used everywhere.

### 8.3 Service Layer Rules

1. **Services return raw typed data** -- no wrapping in response objects
2. **Services throw `ServiceError`** for business logic failures:
   ```typescript
   import { ServiceError } from "@/lib/res/service-error";
   throw new ServiceError("User is not a leader of this group", 403);
   ```
3. **Services throw raw `Error`** only for unexpected/programmer errors
4. **Services never catch and return error objects** -- let the action layer handle it

### 8.4 CRITICAL BUG FIX: Replace `Error("Unauthorized")` with `ServiceError`

All server actions that check for `userId` must change from:
```typescript
// BUG: handleError() treats this as unknown Error -> returns 500
if (!userId) {
  throw new Error("Unauthorized");
}
```

To:
```typescript
// CORRECT: handleError() recognizes ServiceError -> returns 401
if (!userId) {
  throw new ServiceError("Unauthorized", 401);
}
```

This affects all 7+ action files that read `X-User-Id` from headers.

### 8.5 Message Constants

All user-facing messages should use the translation key system in `src/lib/messages/response.messages.ts`:

```typescript
import { Exception } from "@/lib/messages/response.messages";
throw new ServiceError(Exception.PEMRISSION, 403);
throw new ServiceError(Exception.NOT_EXIST, 404);
```

Note: Services currently throw hardcoded English strings (e.g., `"User is not a leader of this group"`) rather than translation keys. Migrating to `Exception.*` keys is recommended for i18n support.

### 8.6 `fetchWithAuth` Ad-Hoc Handling

`src/lib/api/fetch-with-auth.ts:20-27` returns a hand-crafted object on 401:
```typescript
if (res.status === 401) {
  return { success: false, message: "Unauthorized: Please login again", code: 401 };
}
```

This bypasses `ResponseFactory` and is structurally compatible with `ApiResponse` but lacks `meta` and `errors` fields. Additionally, non-401 errors throw raw `Error` instead of `ServiceError`. This file should be updated to use `ResponseFactory.error()`.

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
| 1.2 | Remove unused types from `base.types.ts` (`ResponseDataBase<T>`) -- **keep** `IErrorResponse`, `ISuccessResponse`, `IPaginationBase<T>` (they are actively used) | `types/base.types.ts` |
| 1.3 | Delete `response.interface.ts` (redundant with `response.factory.ts` local interfaces) | `lib/res/response.interface.ts` |
| 1.4 | Remove all 13 unused DTO types (see Section 2.7) | Multiple `.dto.ts` files |

### Phase 2: Fix Critical Bug

| Step | Action | Files |
|------|--------|-------|
| 2.1 | Replace `throw new Error("Unauthorized")` -> `throw new ServiceError("Unauthorized", 401)` in all action files that check `X-User-Id` | All `*.actions.ts`, `*.action.ts` |
| 2.2 | Replace `throw new Error(...)` -> `throw new ServiceError(...)` in all service files for business logic errors | All `*.service.ts` |
| 2.3 | Update `fetchWithAuth` to use `ResponseFactory.error()` for 401 and throw `ServiceError` for non-401 errors | `lib/api/fetch-with-auth.ts` |

### Phase 3: Unify Action Return Types

| Step | Action | Files |
|------|--------|-------|
| 3.1 | Add explicit `Promise<ActionResponse<T>>` return types to all actions | All `*.actions.ts`, `*.action.ts` |
| 3.2 | Wrap success returns: `return { success: true, data: result }` | All `*.actions.ts`, `*.action.ts` |
| 3.3 | Replace ad-hoc `ISuccessResponse` returns with `ActionSuccess<T>` | `auth.actions.ts` |
| 3.4 | Unify pagination schema -- migrate `IPaginationBase<T>` consumers to use `PaginationMeta` from `api.types.ts` | `blog.action.ts`, `user.actions.ts` |

### Phase 4: DTO Consolidation & Type Safety

| Step | Action | Files |
|------|--------|-------|
| 4.1 | Keep Zod-inferred types as source of truth, delete manual interface duplicates | `family.dto.ts`, `family-member.dto.ts`, `relationship.dto.ts`, `group-member.dto.ts` |
| 4.2 | Remove `as Type` assertions by aligning Prisma `select` with DTO shapes | `auth.service.ts`, `family.service.ts`, `blog.service.ts` |
| 4.3 | Replace `z.any()` in `BlogUpdateServiceDto.content` with proper schema | `blog/blog.service-validator.ts` |

### Phase 5: Client Consumption Update

| Step | Action | Files |
|------|--------|-------|
| 5.1 | Update all client components to use `isActionSuccess()` / `isActionError()` type guards | All `*.tsx` client components |
| 5.2 | Update Redux thunks to use `ActionResponse<T>` | `store/family/familyThunk.ts`, `store/blog/blogThunk.ts` |
| 5.3 | Remove duck-typing patterns (`"error" in result`, `"content" in result`) | `feature-editor-internal.tsx`, `login-form.tsx`, `auth-client-lib.ts` |

### Files to Modify

| File | Change |
|------|--------|
| `src/types/action.types.ts` | **CREATE** -- New discriminated union types |
| `src/types/api.types.ts` | Keep as-is (already well-designed) |
| `src/types/base.types.ts` | Remove `ResponseDataBase<T>` only; keep `IErrorResponse`, `ISuccessResponse`, `IPaginationBase<T>`, JWT types, `dataProps` |
| `src/lib/res/response.factory.ts` | Already correct -- use as-is |
| `src/lib/res/response.interface.ts` | **DELETE** -- Redundant with factory's local interfaces |
| `src/lib/api/fetch-with-auth.ts` | Use `ResponseFactory.error()` for 401, add typed return |
| All `*.actions.ts` / `*.action.ts` | Return `ActionResponse<T>`, fix `Error("Unauthorized")` -> `ServiceError` |
| All `*.service.ts` | Throw `ServiceError` instead of `Error` for business errors |
| All `*.dto.ts` | Remove unused types, keep Zod-inferred as source of truth |
| All client components | Use `isActionSuccess()` / `isActionError()` type guards |
| `store/family/familyThunk.ts` | Handle `ActionResponse` |
| `store/blog/blogThunk.ts` | Handle `ActionResponse` |

---

> **Summary**: The error handling infrastructure (`ResponseFactory.handleError()` + `ApiResponse<T>`) is already well-designed and used by all actions. The core problem is that the **success path has no unified envelope** -- actions return raw data, `ISuccessResponse`, or `IPaginationBase<T>` with no consistent wrapper. Additionally, `throw new Error("Unauthorized")` in action files causes a critical bug (500 instead of 401). By adopting `ActionResponse<T>` and fixing the `ServiceError` throws, we achieve full type safety from service -> action -> client with zero duck-typing.
