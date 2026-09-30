# repiq

Personal workout tracker. Next.js app with Prisma, Postgres, and next-auth.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

`npm run build` runs `prisma generate` and `next build`. It does not apply database migrations.

## Environment

Copy `.env.example`. Every variable except `VERCEL_AUTOMATION_BYPASS_SECRET` is required in production.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `NEXTAUTH_SECRET` | Signs the session JWT |
| `NEXTAUTH_URL` | Public origin next-auth uses for callbacks |
| `APP_URL` | Origin used to schedule rest-timer callbacks |
| `CRON_SECRET` | Bearer token for the morning notification cron |
| `QSTASH_TOKEN` | Publishes delayed rest-timer jobs |
| `QSTASH_CURRENT_SIGNING_KEY` | Verifies QStash signatures |
| `QSTASH_NEXT_SIGNING_KEY` | Verifies the next QStash signing key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Browser push subscription key |
| `VAPID_PRIVATE_KEY` | Signs web push messages |
| `VAPID_SUBJECT` | `mailto:` contact required by web push. No default is built in |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Lets QStash reach a deployment protected by Vercel Authentication |

## Migrations on the existing production database

The production database was created with `prisma db push`, so it has the tables but no `_prisma_migrations` history. Do not let the baseline migration create those tables again.

Before the release that contains `prisma/migrations/20260930180000_review_fixes` starts serving traffic, run this once against the production `DATABASE_URL`:

```bash
npx prisma migrate resolve --applied 20260929120000_baseline
npx prisma migrate deploy
```

`migrate resolve` records the baseline as already applied and does not execute it. `migrate deploy` then runs only the review migration. That migration adds `User.sessionVersion`, replaces `User.restMessageId` with a `RestTimer` row per device, adds the listed indexes, and deletes duplicate plan placements and notifications before creating the unique indexes.

A brand-new database can skip `migrate resolve` and run `npx prisma migrate deploy` only.

Vercel does not run either command during the build.
