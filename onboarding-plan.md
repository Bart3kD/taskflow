# Onboarding plan

When a new member is added, they receive a welcome email with a temporary password.
Currently they log in and land on the dashboard with no guided setup.

## What needs to be built

### 1. Onboarding flag
Add `onboardingDone: boolean` (default `false`) to the `users` table.
After completing onboarding, set it to `true`.

### 2. Onboarding redirect
In the authenticated layout (`(app)/+layout.server.ts`), if `user.onboardingDone === false`,
redirect to `/onboarding` before allowing access to any other route.

### 3. Onboarding page `/onboarding`
Two steps shown on a single page or as a stepper:

**Step 1 — Set password (required)**
- Current password (pre-filled hint: "use the temporary password from your email")
- New password
- Confirm new password
- Calls `PATCH /api/users/[id]/password`

**Step 2 — Profile picture (optional)**
- Upload an image (store as URL or base64 in a new `avatarUrl` column on `users`)
- Skip button

On completion: set `onboardingDone = true`, redirect to `/dashboard`.

### 4. Avatar display
Once `avatarUrl` exists, replace the initials placeholder in the team grid with `<img>`.
Fall back to initials if `avatarUrl` is null.

### 5. Avatar storage
Options (pick one):
- **Simple**: store as base64 in the DB (fine for small teams, no extra infra)
- **Better**: upload to an S3-compatible bucket (e.g. Cloudflare R2), store URL in DB
