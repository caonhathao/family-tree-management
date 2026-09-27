# AGENTS.md

Family-tree management system: **decoupled two-app repo, no root workspace.** There is no root `package.json` — every command must run inside `project/backend/` or `project/frontend/`. The two apps share no code; they talk over REST.

- `project/backend/` — NestJS 11 + Prisma 7.2 + PostgreSQL (port 3001, global prefix `/api`)
- `project/frontend/` — Next.js 16 App Router + Turbopack + React 19 (port 3000)
- `project/backend/AGENTS.md` — backend-specific conventions (response factory, guards, DTO style). Also `project/backend/GEMINI.md`.

## Toolchain

- **pnpm only** (v10 in CI). Both packages have `pnpm-lock.yaml`; no npm/yarn lockfiles. Backend scripts internally shell out to `pnpm nest ...`, so npm breaks the build.
- Node 22 in CI (README says v20+).
- Separate CI per app (`.github/workflows/{backend,frontend}-ci.yml`), triggered only on changes under that app's path. **CI gate order:** `prettier --check` → `lint` → `typecheck` → `test` → `build`. Run that order locally before claiming done.

## Commands

```bash
# backend (cd project/backend)
pnpm start:dev                 # nest watch
pnpm build                     # prisma generate + rm -rf dist + nest build
pnpm lint:fix                  # CI uses lint:src; lint:fix = {src,apps,libs,test}
pnpm exec tsc --noEmit         # there is NO `typecheck` script
pnpm test                      # jest, rootDir=src → only *.spec.ts (5 unit specs)
pnpm test -- <file>.spec.ts    # single unit spec
pnpm test:e2e                  # jest --config ./test/jest-e2e.json, 9 suites in test/
pnpm test:e2e -- --testNamePattern="..."

# frontend (cd project/frontend)
pnpm dev                       # next dev --turbo
pnpm typecheck                 # tsc --noEmit
pnpm lint                      # bare `eslint` — no path args in the script
pnpm test                      # vitest run
```

Prettier is enforced as an **eslint error** in both packages, with **opposite quote styles**: backend `.prettierrc` = `singleQuote: true`, frontend = `singleQuote: false`. Never reformat one package with the other's config. `endOfLine: "auto"` everywhere.

## Testing gotchas

- Backend `pnpm test` and backend `pnpm test:e2e` are **separate suites and CI only runs the unit one**. The e2e suite boots the real `AppModule` (`test/test-app.ts`), so it needs a **live PostgreSQL** and a complete `.env` — it will not pass without one.
- Backend e2e helpers live in `test/helpers/*.ts` (not `test/*.helpers.ts`): `test-app.ts` builds the Nest app, `api.client.ts` is a supertest wrapper, `cleanup.helpers.ts` has `wipeTestData(prisma)`. Follow them instead of hand-rolling supertest setup.
- Test file naming is asymmetric: backend `*.spec.ts` / `*.e2e-spec.ts`, frontend `src/**/*.test.{ts,tsx}` (vitest `include`). Jest `rootDir` is `src`, so specs outside `src` are silently not run.
- Backend jest maps `^src/(.*)` only, and remaps `event-notification.email.js` → `templates/event-notification.email.tsx` (react-email templates are `.tsx`).
- Frontend vitest: `jsdom`, globals on, setup `./src/test/setup.ts` (jest-dom matchers), alias `@` → `src`.

## Environment (backend)

`ConfigModule` loads `.env.local` **then** `.env`, and Joi-validates at boot — a missing key crashes startup, it does not warn. Required: `DATABASE_URL`, `JWT_ACCESS_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `FOLDER_ALBUM`, `FOLDER_USER`, `FOLDER_FAMILY`, `FOLDER_BLOG`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`, `CLIENT_DOMAIN`, `GOOGLE_CLIENT_ID`.

- **`.env.example` is wrong:** it ships `CLOUDINARY_CLOUD_NAME`, but Joi and `src/common/config/env/config.ts` read `CLOUDINARY_NAME`. Copying it verbatim fails validation — rename the key.
- Frontend env is Zod-validated in `src/lib/env/env-config.lib.ts`: full validation on the server only, browser path only checks `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. `BACKEND_API_URL` is server-side only. Add new env reads through `EnvConfig`, and keep `process.env.NEXT_PUBLIC_*` written literally so the bundler can inline it.

## Prisma 7 specifics

- Schema is **multi-file**: `prisma/schema/*.prisma` (12 files) resolved by `prisma.config.ts` (`schema: 'prisma/schema'`, `migrations.path: 'prisma/migrations'`, url from `process.env.DATABASE_URL`). There is no `prisma/schema.prisma` and the `datasource` block has **no `url`** — don't add one.
- `pnpm install` runs `postinstall: prisma generate`; CI runs it explicitly. Regenerate after any schema edit or types go stale.
- `PrismaService` uses the **pg driver adapter** (`@prisma/adapter-pg` → `new PrismaPg({ connectionString })`) and is imported from `@prisma/client`. `PrismaModule` is `@Global()` and lives at `prisma/` (outside `src`), so services get it injected without importing anything.
- Migrations: `pnpm prisma migrate dev` only. Never hand-edit `prisma/migrations/`.
- DB columns are snake_case, mapped to camelCase Prisma properties.

## Conventions an agent would guess wrong

- **Path alias:** backend supports only `src/*` (tsconfig + jest). `@/` is a **frontend-only** alias; `@/...` in backend fails `tsc --noEmit` even though `test/jest-e2e.json` maps it.
- **Response envelope is automatic.** A global `TransformInterceptor` wraps every successful return into `{ success, code, message, data }` and is idempotent (already-shaped `ResponseFactory` output passes through). Use `@BypassTransform()` for streams/file downloads. Errors go through `AllExceptionsFilter` + `ResponseFactory` / `ServiceError`; Prisma errors are mapped centrally in `src/common/errors/prisma-errors.ts`. Full contract: `docs/api-response-flow.md`.
- **Frontend endpoint URLs are centralized** in `src/lib/api/api-client.lib.ts` and called through `apiRequest` (`src/lib/api/http.client.ts`). Add endpoints there; don't inline `/api/...` strings.
- **Next 16 middleware is `src/proxy.ts`** exporting `proxy` (there is no `middleware.ts`). It verifies the token against the backend, silently refreshes, enforces RBAC, and forwards `x-user-id` / `x-user-role`. Tokens live in httpOnly cookies `access_token` / `refresh_token`. New protected routes must be added to `publicRoutes` or they will redirect to `/auth`.
- Some files contain mojibake in Vietnamese comments (bad UTF-8). Leave those artifacts alone instead of "fixing" encoding while editing.

## Docs worth opening

- `docs/architecture_map.html` — module + ERD explorer; `docs/api-response-flow.md` — response contract; `docs/pending_features.md` — roadmap/tech debt.
- `graphs/*.drawio` — source ERD and flow diagrams (edit these, not the rendered `.png`).
- `project/backend/postman.json` and `.postman/` — API collection; keep in sync when adding endpoints.
- `project/frontend/generated_credentials.txt` is checked in — do not treat it as an example file.
