# Wireframe Role-Flow Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `wireframes/` so `index.html` is a role-first hub (4 flows: Khách / Chủ nhóm / Biên tập / Người xem), every flow is testable standalone via `?role=` (role pill auto-set, still overridable), every instruction currently in `<details class="note">` and dev-sim buttons is removed from screens and moved into a new `wireframes/PLAN.md`, and screens are split per chặng (22 files).

**Architecture:** Static HTML/CSS/JS wireframes (no build). `index.html` = hub with 4 role groups; each link carries `?role=owner|editor|viewer|anon`; `assets/ui.js` reads `?role=` on boot and sets the pill default (persisted through localStorage `wf:role`, so journey links keep the role). Screen files are renamed/split with `git mv` to preserve history; each screen keeps its real interactivity (role pill, dialogs, tabs, mock data) but loses notes and dev-only buttons. Product decisions extracted from notes land in `wireframes/PLAN.md` (flow × chặng × quyết định, pointing at `docs/planing-refactor-fe/`).

**Tech Stack:** Plain static files (`assets/ui.css`, `assets/ui.js`, `assets/mock-data.js`), served via `server-live.mjs`, verified in Playwright.

**Spec:** Design approved in-session (brainstorming, architectural path): 4 role flows as level-1 IA; "mỗi flow sẽ có UI cho từng chặng"; "flow cho owner, user, editor chẳng hạn => mỗi flow có thể test riêng biệt UI thô"; index theo vai trò; 4 vai (guest gộp vào viewer); "Giữ tương tác, bỏ note + nút dev"; PLAN.md riêng cạnh wireframe. Full current-state facts (old screen contents, index GROUPS, README sections, permission model) in the session's compressed design block.

## Global Constraints

- Vietnamese UI text on every screen; brand "Gia phả".
- Zero `<details class="note">` remain on any screen after Task 3 (all current ones: item their content moves to `wireframes/PLAN.md`).
- Zero dev-sim controls remain: `#simulate`, `#make-dirty`, `#try-expired`, `#try-used`, `#demo-file`, `#demo-gfile`, `#preview-rs`, `#preview-gd`, `#preview-image`, `#try`, and any `i`/info button (`id="info"`, `aria-label="Thông tin"`, `data-size="icon"` with `WF.toast`). Keep every real control (pill, dialog triggers, tabs, submit buttons, show-password, toast from real actions).
- Index link format: `href="<screen>.html?role=<role>"`; role values valid: `owner|editor|viewer|anon` (public flow = `anon`).
- No new CSS tokens/colors; reuse existing classes in `assets/ui.css`. Do not edit `assets/mock-data.js`. Leave mojibake comments alone.
- Naming: exactly the 22 files listed in Task 1; one screen per chặng.
- README.md keeps §2 permission table, §5 UI platform, §7 conventions.
- Fix dead link: `s15-share-readonly.html` must link `s01-landing.html` (was `s01-landing-redirect.html`).
- Verification uses live server: `node "C:\Users\caonh\AppData\Local\Temp\opencode\wf\server-live.mjs" "C:\Users\caonh\orca\workspaces\family-free-management\wireframe-redesign\wireframes" 4322` → `http://127.0.0.1:4322/`.

## Review Focus

1. **`?role=` must drive the pill on entry, and the pill must still override afterwards.** Opening a role-hub link lands on a screen whose pill already shows that role; changing the pill re-renders `data-needs-perm`/`data-roles` and survives navigation (localStorage). → Task 2 verification step.
2. **No 404 after restructure.** Every internal `href` across all 22 screens + hub links must resolve to an existing file (renames + old `s01-landing-redirect` reference). → Task 1 verification step (crawl all `a[href^="s"]`).
3. **Stripping dev UI must not break app interactivity.** After removing notes/buttons, each screen still shows the role pill, dialog triggers still open dialogs, `data-needs-perm` still toggles per role. → Task 3 verification step.
4. **Chặng stops are distinct and reachable per role.** `s05-join|s05-join-expired|s05-join-used` are three separate stop pages; `s06-create-conflict` only in owner flow; `register` (no token) never mentions an invite. → Task 4 verification step.
5. **PLAN.md is the single source for removed instructions.** Every decision stripped from screens appears once in `PLAN.md` and its `docs/planing-refactor-fe/` §reference resolves. → Task 5 verification step (grep for each §ref).

---

### Task 1: Restructure files (renames, splits, deletes) + fix internal links

Files landing state (22):
```
s01-landing.html            (keep)
s02-register.html           (NEW, split)
s03-login.html              (keep)
s04-forgot.html             (NEW, split)
s04-forgot-sent.html        (NEW, split)
s04-forgot-reset.html       (keeps name; content = reset stage only)
s05-join.html               (NEW, split)
s05-join-expired.html       (NEW, split)
s05-join-used.html          (NEW, split)
s06-create.html             (NEW, split)
s06-create-conflict.html    (NEW, split)
s07-tree.html               (« s06-tree-canvas)
s08-member-form.html        (« s07-member-form)
s09-save-conflict.html      (« s08-save-conflict)
s10-activity.html           (« s09-activity)
s11-trash.html              (« s10-trash)
s12-albums.html             (« s11-albums)
s13-events.html             (« s15-events)
s14-share-manage.html       (« s12-share-manage)
s15-share-readonly.html     (« s13-share-readonly)
s16-import-export.html      (« s14-import-export)
s17-profile.html            (« s16-profile-hub)
```
Deleted: `s02-register-invite-fork.html`, `s05-create-family.html`.

- [ ] **Step 1: Rename via `git mv`** (run in worktree root)
```
git mv wireframes/s06-tree-canvas.html wireframes/s07-tree.html
git mv wireframes/s07-member-form.html wireframes/s08-member-form.html
git mv wireframes/s08-save-conflict.html wireframes/s09-save-conflict.html
git mv wireframes/s09-activity.html wireframes/s10-activity.html
git mv wireframes/s10-trash.html wireframes/s11-trash.html
git mv wireframes/s11-albums.html wireframes/s12-albums.html
git mv wireframes/s15-events.html wireframes/s13-events.html
git mv wireframes/s12-share-manage.html wireframes/s14-share-manage.html
git mv wireframes/s13-share-readonly.html wireframes/s15-share-readonly.html
git mv wireframes/s14-import-export.html wireframes/s16-import-export.html
git mv wireframes/s16-profile-hub.html wireframes/s17-profile.html
```
Expected: `git status` shows 11 `R` entries; no file lost.

- [ ] **Step 2: Create split files from old sources** (write new files, content extracted; notes/dev buttons may remain until Task 3)
- `s02-register.html`: from old `s02-register-invite-fork.html` take ONLY the "Không có token" signup form (auth-panes signup pane, no invite summary). Sync links: "Đăng nhập" → `s03-login.html`; brand → `s01-landing.html`.
- `s04-forgot.html` / `s04-forgot-sent.html` / `s04-forgot-reset.html`: from old `s04-forgot-reset.html` (3-step `[data-tabs=pw]`) extract each tab into its own single-chặng file. `s04-reset` keeps `#p1/#p2`, ack checkbox gating `#do-reset`, warn banner "Đổi mật khẩu sẽ khiến bạn bị đăng xuất khỏi mọi thiết bị", hidden `#after-reset`. `s04-sent` keeps trung tính banner + `#sent-to` + "Gửi lại". Cross-links: forgot/sent → `s04-forgot-reset.html` (goes straight to reset stage); all → `s03-login.html`.
- `s05-join.html`: from old `s02` ok-panel = invite summary (avatar N, "Nguyễn Thanh Hà mời bạn vào nhóm" "Nhà họ Nguyễn – Trần", badge Người xem "không sửa được cây", "Link hết hạn 27/09/2026") + "Đăng ký tài khoản" flat card + link "Đăng nhập" → `s03-login.html?token=inv_9c41f2`.
- `s05-join-expired.html` / `s05-join-used.html`: from old `s02` expired/used tabs = `.empty` state (gate-icon, title "Link hết hạn" / "Link đã được dùng", muted p, button "Về trang chủ" → `s01-landing.html`).
- `s06-create.html`: from old `s05-create-family.html` take create form (`#gname` default "Nhà họ Nguyễn – Trần", `#tname`, `#preview` codebox live, `#exp` "Cho hạn 7 ngày" toggle, `#create` "Tạo nhóm và vào cây"). `#create` → `s07-tree.html`. Remove conflict dialog from this file. Link "Bỏ qua, vào cây trống" → `s07-tree.html`.
- `s06-create-conflict.html`: from old `s05` conflict dialog content as a screen: title "Bạn đã có một cây rồi" + warn banner "Tài khoản ha.nguyen@example.com đang có cây... phải xoá cây cũ trước" + btn "Vào cây hiện có của tôi" → `s07-tree.html` + link "Xoá cây cũ rồi tạo cây mới" → `s17-profile.html`. Ownership: only owner flow (per design, create-conflict is owner-only).

- [ ] **Step 3: Delete obsolete sources**
`git rm wireframes/s02-register-invite-fork.html wireframes/s05-create-family.html`

- [ ] **Step 4: Sweep internal hrefs across all screens to new names** (grep `href="s` in `wireframes/*.html`; every target must exist; fix s15 dead `s01-landing-redirect.html` → `s01-landing.html`; fix references to deleted s02/s05).

- [ ] **Step 5: Verify no broken links (Playwright, server on 4322)**
Navigate `http://127.0.0.1:4322/index.html`; collect every `a[href]` in all 22 screens (crawl by fetching each href); expected: every relative `.html` href returns 200.
Command: `node server-live.mjs ... 4322` already running; use `browser_navigate` + `browser_evaluate` per screen.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "refactor(wireframes): tách 22 màn theo chặng, đổi tên theo sơ đồ vai trò"
```

---

### Task 2: `ui.js` `?role=` support + `index.html` role-first hub

- [ ] **Step 1: Add `?role=` reading in `assets/ui.js` `boot()`** (function `getRole()` around line 55; `boot()` around line 521)
In `boot()`, before `mountRolePill()`: parse `location.search` for `role`; if value ∈ `{owner, editor, viewer, guest, anon}`, `setRole(value)` (persists to localStorage `wf:role` so journey links keep it). If no param, leave stored role. Pill select keeps manual override (existing `change` listener wins after boot).

- [ ] **Step 2: Rewrite `index.html` as role hub**
Replace the 4 GROUPS cards + permission table + note with 4 role-flow sections (in order):
1. **Khách (chưa đăng nhập)** — desc "Vào Gia phả: đăng nhập, đăng ký, quên mật khẩu, vào nhóm qua link mời." Links (all `?role=anon`): `s01-landing.html`, `s03-login.html`, `s02-register.html`, `s04-forgot.html`, `s04-forgot-sent.html`, `s04-forgot-reset.html`, `s05-join.html`, `s05-join-expired.html`, `s05-join-used.html`.
2. **Chủ nhóm (owner)** — desc "Tạo cây, quản lý thành viên, chia sẻ, hồ sơ." Links (all `?role=owner`): `s06-create.html`, `s06-create-conflict.html`, `s07-tree.html`, `s08-member-form.html`, `s14-share-manage.html`, `s16-import-export.html`, `s11-trash.html`, `s10-activity.html`, `s17-profile.html`.
3. **Biên tập (editor)** — desc "Sửa cây, thêm thành viên, ảnh, sự kiện." Links (all `?role=editor`): `s07-tree.html`, `s08-member-form.html`, `s09-save-conflict.html`, `s12-albums.html`, `s13-events.html`, `s10-activity.html`, `s16-import-export.html`.
4. **Người xem (viewer)** — desc "Cây chỉ đọc, ảnh của mình, xem qua link." Links (all `?role=viewer`): `s05-join.html`, `s07-tree.html`, `s15-share-readonly.html`, `s12-albums.html`.
Remove the permission table (`#perm`, `ROWS`, `renderPerm`, `wfOnRole`) and the `<details class="note">` from index entirely. Each section header shows the role label; note under header "Vai trò được tự đặt theo flow; vẫn đổi tay được ở góc dưới phải." Keep `.page-head` intro (rewrite desc to mention role flows).

- [ ] **Step 3: Verify (Playwright)**
Navigate index; click into owner hub link `s07-tree.html?role=owner` → pill select value = `owner`, tree edit buttons visible; switch pill to `viewer` → `data-needs-perm` controls hide, still works. Repeat for `?role=editor`, `?role=viewer`, `?role=anon` (s03-login). Expected: pill preset per param; override re-renders immediately.

- [ ] **Step 4: Commit**
`git commit -am "feat(wireframes): index theo vai trò cấp 1, hỗ trợ ?role= để test từng flow"`

---

### Task 3: Strip notes, dev buttons, and info hints from all 22 screens

Per screen, remove:
- the single `<details class="note">…</details>` block (page-end);
- dev-sim buttons and their JS handlers (grep for the ids): `#simulate`, `#make-dirty`, `#try-expired`, `#try-used`, `#demo-file`, `#demo-gfile`, `#preview-rs`, `#preview-gd`, `#preview-image`, `#try`;
- info hint buttons: any `#info`, `aria-label="Thông tin"`, `data-size="icon"` whose click only fires `WF.toast` dev hints (delete element + its `.addEventListener` block).
Do NOT remove: pill markup (ui.js injects it), `data-open-dialog`/`data-close-dialog` triggers, submit/show-password/tab logic, toast for real actions, `window.demoConflict`-style hooks may stay only if they have no visible button (prefer deleting the hook line too).

- [ ] **Step 1: For each of the 22 screens, apply removal**
Files: `s01-landing.html` (remove its landing `<details class="note">` inside `.landing-note-wrap`; move 5 bullets to PLAN.md Task 5), `s02-register.html`, `s03-login.html`, `s04-forgot.html`, `s04-forgot-sent.html`, `s04-forgot-reset.html`, `s05-join.html`, `s05-join-expired.html`, `s05-join-used.html`, `s06-create.html`, `s06-create-conflict.html`, `s07-tree.html`, `s08-member-form.html`, `s09-save-conflict.html`, `s10-activity.html`, `s11-trash.html`, `s12-albums.html`, `s13-events.html`, `s14-share-manage.html`, `s15-share-readonly.html`, `s16-import-export.html`, `s17-profile.html`.

- [ ] **Step 2: Verify (Playwright, vs 4322)**
For each screen: `document.querySelectorAll('details.note').length === 0`; none of the dev ids present; `#role-pill` present; at least one `[data-open-dialog]` or dialog trigger still clickable on dialog-bearing screens (s08 member form, s09 save-conflict, s14 share-manage, s17 profile); console errors = none (only favicon 404 allowed).

- [ ] **Step 3: Commit**
`git commit -am "refactor(wireframes): gỡ mọi ghi chú & nút dev khỏi màn hình, giữ nguyên tương tác"`

---

### Task 4: Auth & create screens content (per approved chặng decisions)

- [ ] **Step 1: `s02-register.html`** — pure signup, NO invite summary/token. Fields: Họ và tên / Email / Mật khẩu (+ show-password), btn "Tạo tài khoản" (toast xác nhận), link "Đã có tài khoản? Đăng nhập" → `s03-login.html`. No "Vào nhóm", no "mời".
- [ ] **Step 2: `s03-login.html`** — keep token-note banner (`#token-note`, hidden unless `?token=`), greet pane, show-password, Google btn, "Quên mật khẩu?" → `s04-forgot.html`, "Không có tài khoản? Đăng kí ngay" → `s02-register.html` (rewrite `#to-signup` to keep `?token=` if present: join flow uses `s05-join.html` instead when token present). Submit keeps "sẽ vào thẳng nhóm của người mời, không tạo cây riêng" behavior.
- [ ] **Step 3: `s04-*`** — each file is one chặng, no tabs. `s04-forgot.html`: email + "Gửi link đặt lại mật khẩu" → `s04-forgot-sent.html`, trung tính banner, link về login. `s04-forgot-sent.html`: "Link đã gửi đến <email>" + "Gửi lại" (toast) + link về login. `s04-forgot-reset.html`: `#p1/#p2` + ack gating `#do-reset` + warn banner + `#after-reset` hidden success + link login.
- [ ] **Step 4: `s05-*`** — valid/expired/used as three separate stop screens (from Task 1 splits); ensure expired shows "Link hết hạn 27/09/2026" phrased as stop, used shows "đã được dùng", both have "Về trang chủ" → `s01-landing.html`. No shared dialog.
- [ ] **Step 5: `s06-create.html` + `s06-create-conflict.html`** — create form (owner); conflict screen only reachable from owner journey, shows 409 info + "Vào cây hiện có của tôi" → `s07-tree.html` + "Xoá cây cũ rồi tạo cây mới" → `s17-profile.html`. No conflict dialog overlay left in `s06-create.html`.
- [ ] **Step 6: Verify (Playwright)** — each file: heading + primary CTA match above; "mời/token" absent from `s02-register`; `s04-*` each contain only its own stage's elements; `s05-join-expired`/`used` contain stop text + single home action. No console errors.
- [ ] **Step 7: Commit**
`git commit -am "feat(wireframes): tách luồng xác thực theo chặng — register, forgot 3 bước, join 3 trạng thái, create + 409"`

---

### Task 5: `wireframes/PLAN.md` (product-decisions doc)

- [ ] **Step 1: Create `wireframes/PLAN.md`** — header: "Kế hoạch sản phẩm theo flow — wireframe chỉ minh hoạ layout, quyết định nằm đây". Sections:
  - §1 Bảng chặng (flow × file × chặng) for the 4 flows.
  - §2 Quyết định đã gỡ khỏi màn: reuse the exact bullet content stripped from screens in Task 3 (landing 5 bullets, register/join decisions, login 4, forgot 5, create 4, permission note bullets from old index note: "Hai trục: việc trong cây tính theo vai trò nhóm, việc với ảnh tính theo người đã tải lên…" 5 bullets), each row prefixed with the screen file it came from and a `docs/planing-refactor-fe/` §reference where one exists.
- [ ] **Step 2: Verify** — every `docs/planing-refactor-fe/` path+§ mentioned exists (grep the section headings in those docs); every decision line has a source screen; no `<details class="note">` line copied verbatim into PLAN.md as HTML (use markdown).
- [ ] **Step 3: Commit**
`git commit -am "docs(wireframes): PLAN.md — quyết định sản phẩm theo flow × chặng, trỏ docs kế hoạch"`

---

### Task 6: `wireframes/README.md` update

- [ ] **Step 1: Rewrite §1 file table** to the 22 files from Task 1 (Route thật + Căn cứ `docs/planing-refactor-fe/` refs retained for each).
- [ ] **Step 2: Replace §4 "Những ràng buộc đã cài trong wireframe"** with a pointer: "Quyết định sản phẩm → `PLAN.md`. Wireframe chỉ hiện layout thật." Keep §2 permission table, §3 role pill (add `?role=` param note), §5 UI platform (add `s*` mapping updates: `s03-login`→auth `s*` unchanged), §6 file tree (update names), §7 conventions (change "exactly one details.note" → "không còn details.note; mọi chỉ dẫn vào PLAN.md").
- [ ] **Step 3: Verify** — README file table links all resolve (Task 1 files); mentions of old names (`s02-register-invite-fork`, `s05-create-family`, `s15-events`, `s16-profile-hub`, `s06-tree-canvas`, `s07-member-form`, `s08-save-conflict`, `s09-activity`, `s10-trash`, `s11-albums`, `s12-share-manage`, `s13-share-readonly`, `s14-import-export`) gone from file-tree/table.
- [ ] **Step 4: Commit**
`git commit -am "docs(wireframes): cập nhật README theo 22 màn vai trò, dẫn PLAN.md"`

---

### Task 7: End-to-end verification + final commit

- [ ] **Step 1: Click-through each of the 4 hubs (Playwright)** at 390px and 1440px widths:
index → each hub → each link: load, pill preset = hub role, `document.documentElement.scrollWidth - clientWidth === 0`, console errors none.
- [ ] **Step 2: Cleanup** — ensure no old-name file references anywhere (`grep -r "s02-register-invite-fork\|s05-create-family\|s15-events\|s16-profile-hub\|s06-tree-canvas\|landing-redirect" wireframes/` → only hits allowed in git history text/PLAN rationale, none in working HTML `href`/README).
- [ ] **Step 3: Final commit** if content changed: `git add -A; git commit -m "chore(wireframes): xác nhận verify role flows"`.
- [ ] **Step 4: Report** — summary of 22 screens, 4 hubs, PLAN.md, README, verify evidence to user.