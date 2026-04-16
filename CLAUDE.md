# CLAUDE.md

Document for AI Agents working in this repository.

## ALWAYS DO THIS

1. Use `bun check` after changes and fix all errors
2. For complex tasks: write a plan first in the `claude-plans/` folder
3. Use `bun check` locally only — never start servers

---

## Design System

**UI Library**: shadcn/svelte — always use these components, never custom elements.

- Install: `bun x shadcn-svelte@latest add [component-name]`
- Components in: `frontend/src/lib/components/ui/`

**CSS Variables** (in `frontend/src/app.css`):

- Colors: `--color-primary-100`, `--surface-n1` to `n5`, `--color-status-{green,red,blue,yellow}`
- Spacing: `--space-{xs,sm,md,lg,xl}` (8/12/16/24/32px)
- Radius: `--corner-radius-{xs,sm,md,lg}` (4/8/12/16px)
- Fonts: `--font-display`, `--font-body-family`, `--font-mono`

❌ Never hardcode colors. ✅ Use CSS variables.

**Font Sizes** (accessibility):

- ❌ Never use hardcoded `px` for font size (e.g., `font-size: 14px`)
- ✅ Always use `rem` units (e.g., `font-size: 0.875rem`)
- This allows text to scale with browser font size settings (Large/Extra Large)
- Conversion: 10px→0.625rem, 11px→0.6875rem, 12px→0.75rem, 13px→0.8125rem, 14px→0.875rem, 16px→1rem

## Svelte 5

- Use `$derived.by` for complex computations
- `$bindable` props have fallback values if the caller doesn't provide them

---

## Tech Stack

| Layer         | Technology               | Notes                                  |
|---------------|--------------------------|----------------------------------------|
| Fullstack     | SvelteKit                | Single project, SSR + API routes       |
| Database      | PostgreSQL + Drizzle ORM |                                        |
| Scheduler     | node-cron                | Runs every hour                        |
| Email         | Resend                   |                                        |
| Telegram      | Telegram Bot API         | Notifications via bot                  |
| Auth          | JWT                      | Manager login and sessions             |

---

## User Roles

- **Manager (admin)** – full access: creates tasks, manages users, configures schedules
- **Employee (member)** – views their own tasks, confirms statuses via link (no login required)

---

## Modules & Features

### 1. Tasks

- Manager can create tasks **for themselves** (own) and **for employees**
- Manager sees all tasks — own and team's
- Employee sees only their own tasks

**Each task contains:**
- Title, description
- Assigned responsible person
- Deadline: one-time or recurring
- Status: `pending` / `in_progress` / `done` / `overdue` (UI labels: Pending / In Progress / Done / Overdue)

**Recurrence types:**
- Every N days (e.g., every 3 days, every 7 days)
- On a specific day of the month (e.g., the 3rd of every month)
- On a specific day of the week at a set time (e.g., every Friday at 8:00)
- First day of the month
- Last day of the month

> Business days (first/last working day of month) — planned for a future stage, requires public holiday handling.

---

### 2. Pre-deadline Notifications

- Sent **to the employee** (not the manager)
- Manager monitors task statuses via the dashboard — not through notifications
- Reminders: 2 days before, 1 day before, on the due date
- Configuration of how many days in advance — **set per employee by the manager**

---

### 3. Recurring Status Reports

- Sent **to the employee** (not the manager)
- Schedule is **individual per employee** (e.g., one every 3 days, another every Friday)
- Manager configures the schedule for each employee separately
- After an employee confirms their status — the manager's dashboard updates in real time

---

### 4. Status Collection Without Login

- The message sent to the employee contains a link with a unique token
- Employee clicks: `done` / `in_progress` / `problem` (displayed as: Done / In Progress / Problem)
- Status updates in the database without requiring login
- Manager sees changes immediately in the dashboard

---

### 5. Per-employee Communication Configuration

Manager sets for each employee:

| Setting                  | Options                              |
|--------------------------|--------------------------------------|
| Notification channel     | Email, Telegram, or both             |
| Report channel           | Email, Telegram, or both (separate)  |
| Report frequency         | Every N days / specific day of week  |
| Send time                | Any time, per employee               |

**Bulk schedule edit:**
- "Change for multiple" button on the employee list
- Select people with checkboxes + "Select all" button
- Form shows checkboxes next to each field (frequency, channel, time) — only check what you want to overwrite
- API accepts an array of `user_ids` instead of a single `user_id`
- Unchecked fields remain unchanged for each individual

> **Important:** message type (notification vs report) can have a separate channel. E.g., notifications via Telegram, reports via email.

---

### 6. Manager Dashboard

- View of all tasks: own and team's
- Filters: person, status, deadline
- Overdue task indicators
- History of completed tasks with dates
- Real-time status updates after employee confirmation

---

## Database Schema (Drizzle)

```
users
  id, name, email, telegram_chat_id, role (admin|member), created_at

tasks
  id, title, description, assigned_to (fk users), created_by (fk users)
  status (pending|in_progress|done|overdue)  -- UI: Pending|In Progress|Done|Overdue
  deadline_type (once|recurring)
  recurrence_type (every_n_days|day_of_month|day_of_week|first_day_of_month|last_day_of_month)
  deadline_date, recurrence_config (JSON: { n?, dayOfMonth?, dayOfWeek?, hour? })
  created_at, updated_at

status_tokens
  id, task_id (fk tasks), token (uuid), expires_at, used_at

notification_schedules
  id, user_id (fk users)
  report_frequency (every_n_days|weekly)
  report_day_of_week, report_time
  report_channel (email|telegram|both)
  reminder_channel (email|telegram|both)
  reminder_days_before (default: [2, 1, 0])
```

---

## SvelteKit Project Structure

```
src/
  routes/
    +layout.svelte              # Global layout
    (auth)/
      login/+page.svelte        # Manager login
    (app)/
      +layout.svelte            # Authenticated layout (auth guard)
      dashboard/+page.svelte    # Manager dashboard
      tasks/
        +page.svelte            # Task list
        new/+page.svelte        # Create task
        [id]/+page.svelte       # Task details
      team/
        +page.svelte            # Employee management
        [id]/+page.svelte       # Employee settings (channels, schedule)
    confirm/[token]/
      +page.svelte              # Status confirmation without login
    api/
      tasks/+server.ts
      users/+server.ts
      status/[token]/+server.ts
      scheduler/+server.ts      # Endpoint triggered by cron
  lib/
    db/
      schema.ts                 # Drizzle schema
      index.ts                  # DB client
    scheduler/
      reminders.ts              # Pre-deadline reminder logic
      reports.ts                # Recurring report logic
    notifications/
      email.ts                  # Resend integration
      telegram.ts               # Telegram Bot API
    auth/
      jwt.ts
```

---

## Implementation Stages

| Stage | Scope |
|-------|-------|
| 1. Foundation | DB schema, JWT auth, REST API (tasks, users, tokens) |
| 2. Interface  | Dashboard, task forms, employee configuration panel |
| 3. Automation | node-cron, Resend, Telegram Bot, token links |
| 4. Extensions | Reporting, advanced filters, history |
| 5. Excel      | Import .xlsx with annual schedule → auto-create tasks |

---

## Key Rules for the Agent

- Use **TypeScript** everywhere
- All database queries via **Drizzle ORM** — no raw SQL
- Scheduler runs **every hour** to check the database and send notifications
- Status tokens are **one-time use** and expire after 7 days
- The `/confirm/[token]` page works **without authorization**
- Manager dashboard requires **JWT in cookie** (httpOnly)
- Do not use `<form>` with action — use `fetch` + `+server.ts`

---

## Core Principles

### Parse, Don't Validate

Transform input into domain types at boundaries. Use branded types. Fail fast, then work with guaranteed-valid types.

```typescript
type CommitSHA = string & { readonly __brand: "CommitSHA" };
function parseCommitSHA(input: string): CommitSHA | null {
  return /^[a-f0-9]{40}$/.test(input) ? (input as CommitSHA) : null;
}
```

### State Modeling (Avoid MIRO)

Use discriminated unions for state machines:

```typescript
type DataState =
  | { type: "not-asked" }
  | { type: "loading" }
  | { type: "success"; data: number[] }
  | { type: "failure"; error: string };
```

### Parnas' Subset Criteria

For modules A using B:

- A is simpler because it uses B
- B is not more complex by not using A
- Useful subset exists with B but not A
- No useful subset with A but not B

**Key insight**: If A cannot exist without B, but B can exist independently, B should be the lower layer.

### Design Principles Summary

1. **Special types, not primitives** — `UserId` not `string`
2. **Enums over booleans** — `status: TodoStatus` not `isDone: boolean`
3. **Methods on right class** — `Item.setDescription()` not `List.updateItem()`
4. **Don't expose mutables** — Return `readonly` or copies
5. **Entities need own types** — `class TodoList` not raw arrays
6. **No unused code for future** — YAGNI
7. **Lambdas over fixed methods** — `filter(predicate)` not `filterByX()`
8. **Avoid primitive domain concepts** — `Priority` enum not `number`
9. **Bake security into representation** — `viewFor(user)` enforces privacy
10. **Don't delegate security checks** — One secure method, not caller choice

---

## Implementation Rules

### Use ts-pattern (not switch)

```typescript
import { match } from "ts-pattern";
const result = match({ platform, arch })
  .with({ platform: "linux", arch: "x64" }, () => linuxX64)
  .otherwise(() => null);
```

### Exhaustive Svelte Union Rendering

When rendering discriminated unions in Svelte templates, check explicit `type` branches (including `type === "loading"` when applicable) and use `assertIsNever(...)` in the final `{:else}` branch.

### Internal Functions Take Objects, Not IDs

```typescript
// ❌ BAD: constructor(workspaceId: WorkspaceId)
// ✅ GOOD: constructor(workspace: Workspace)
```

Use IDs only at API boundaries, storage keys, serialization.

### Type Safety

- **NEVER cast to fix type errors** — fix the root cause
- **No `as any`** — if unavoidable, add a dated comment with a removal plan
- **No dynamic imports** — always import at the top of the file
- **No re-exports for compatibility** — update importers directly

### NO DEPRECATION

Never deprecate — always remove and update all callers. No transition periods, no `@deprecated` comments. We control frontend + backend; make clean breaks.

### No Re-exports When Moving Code

When moving a symbol from one file to another, **never** add a re-export in the old file. Update all importers directly to point to the new location.

---

## Codebase-Specific

### General

- Zod schemas: prefix with `z` (e.g., `zGitDataOutput`)
- Name/date TODO/NOTE comments: `// TODO jkoppel 2025.05.01: description`
- Include function name in errors: `log.error(\`rerunJob: Job not found\`)`
- Use `CONSPICUOUSLY_NAMED_TAGS` for related comments

### TypeScript

- Type aliases over interfaces (unless implementing a class)
- Namespaces with Zod over native enums:

```typescript
export const zSessionStatus = z.enum(["waiting", "active"]);
export namespace SessionStatus {
  export type Type = z.infer<typeof zSessionStatus>;
  export const Waiting = "waiting" as Type;
  export const Active = "active" as Type;
}
```

### Frontend

- Use `RouterInputs`/`RouterOutputs` for backend types (no duplicates)
- Use `$derived` for computed values
- Use `createErasablePersistedState` for persistent state

### Svelte Styles with Tailwind

```svelte
<style lang="postcss">
  @reference "tailwindcss";
  .class {
    @apply text-sm;
  }
</style>
```

---

## Code Organization

### Section Headers

```typescript
// #######################################
// H1 - Major Section
// #######################################

// ##############################
// H2 - Subsection
// ##############################

// ####################
// H3 - Sub-subsection
// ####################
```