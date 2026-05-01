# TaskFlow

Team task management app with automated reminders and status reporting via email and Telegram.

---

## Features

### Task management
- Create one-time or recurring tasks assigned to team members
- Recurring schedules: every N days, specific day of week, specific day of month, first/last day of month
- Task statuses: Pending, In Progress, Done, Overdue, Problem
- Filter tasks by status, assignee, or search by title
- Overdue detection with visual indicators

### Team management
- Invite new members — a temporary password is emailed automatically
- Per-member onboarding: set password, connect Telegram, upload profile picture
- Per-member notification schedule: report frequency, send time, channels (email, Telegram, or both)
- Admin can view and manage all members from the Team panel

### Notifications
- Pre-deadline reminders sent to the assigned member (configurable: 0, 1, 2… days before)
- Recurring status report requests sent to members on their individual schedule
- Assignment notifications when a new task is created
- All notifications delivered via email (Resend) and/or Telegram

### Status confirmation without login
- Report emails contain one-click buttons: Done / In Progress / Problem
- Clicking updates the task status instantly — no account required
- Links are single-use and expire after 7 days

### Security
- JWT sessions stored in httpOnly cookies
- Forgot password flow with 1-hour expiry reset links
- Password change always requires the current password

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (SSR + API routes) |
| Database | PostgreSQL + Drizzle ORM |
| Scheduler | node-cron (hourly) |
| Email | Resend |
| Telegram | Telegram Bot API |
| Auth | JWT (jose) |
| Runtime | Bun / Node.js |

---

## Setup

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- A [Resend](https://resend.com) account and API key
- A Telegram bot token (create one via [@BotFather](https://t.me/BotFather))

### 1. Clone the repository

```bash
git clone <repo-url>
cd taskflow
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp frontend/.env.example .env
```

Edit the root `.env` file:

```env
# Auth
JWT_SECRET=your-long-random-secret

# App URL (used in emails and Telegram webhook)
ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@yourdomain.com

# Telegram
TELEGRAM_BOT_TOKEN=123456789:AAF_your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

**Notes:**
- `APP_URL` must be a publicly accessible URL for Telegram webhooks to work. Use [ngrok](https://ngrok.com) for local development: `ngrok http 3000` and set `APP_URL=https://your-ngrok-url.ngrok-free.app`
- `FROM_EMAIL` must use a domain verified in your Resend dashboard. The default `onboarding@resend.dev` only delivers to your own Resend account email.

### 3. Start with Docker

```bash
docker-compose up --build
```

This will:
1. Start a PostgreSQL database
2. Build the application image
3. Run database migrations automatically
4. Seed an initial admin account
5. Start the server on port 3000

Open [http://localhost:3000](http://localhost:3000).

**Default admin credentials:**
```
Email:    admin@taskflow.app
Password: admin123
```

Change the password immediately after first login via Settings.

### 4. Stopping and resetting

```bash
# Stop containers (preserves database)
docker-compose down

# Stop and wipe the database volume
docker-compose down -v
```

---

## Local development

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL running locally

### Setup

```bash
cd frontend
bun install
```

Create `frontend/.env` with your local values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
JWT_SECRET=your-dev-secret
NODE_ENV=development
APP_URL=http://localhost:5173
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=onboarding@resend.dev
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

### Run

```bash
# Apply schema to the database
bun run db:push

# Seed admin user
bun run db:seed

# Start dev server
bun run dev
```

### Database commands

| Command | Description |
|---|---|
| `bun run db:push` | Push schema changes to the local database (dev only) |
| `bun run db:generate` | Generate migration files after schema changes |
| `bun run db:migrate` | Apply migrations (used in production/Docker) |
| `bun run db:seed` | Seed the admin user |
| `bun run db:studio` | Open Drizzle Studio (visual DB browser) |

### Schema changes workflow

1. Edit `src/lib/db/schema.ts`
2. For local dev: `bun run db:push`
3. For production: `bun run db:generate` → commit the generated files in `drizzle/` → rebuild Docker

---

## Usage

### First time setup

1. Log in as admin at `/login`
2. Go to **Team** → **Add member** to invite your first team member
3. The member receives an email with a temporary password
4. On first login, the member goes through onboarding: set password, optionally connect Telegram and add a profile picture

### Creating tasks

1. Go to **Tasks** → **New task**
2. Set a title, description, assignee, and deadline type
3. For recurring tasks, configure the recurrence pattern (e.g. every 7 days, every Friday at 9:00)
4. Save — the assigned member is notified automatically

### Configuring member notifications

1. Go to **Team** → click a member → **Settings**
2. Set the report frequency (every N days or weekly on a specific day)
3. Set send time and preferred channels (email, Telegram, or both)
4. Configure how many days before a deadline reminders should be sent

### Connecting Telegram

**As a member:** Settings → Telegram → Generate connect link → open in Telegram → start the bot.

**As an admin (for a member):** Team → select member → Telegram section → Generate link → share with the member.

### Manual scheduler trigger

The scheduler runs automatically every hour. To trigger it manually:

```bash
curl -X POST http://localhost:3000/api/scheduler
```
