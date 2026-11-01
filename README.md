RoCash

*Know your money. Grow your savings. Enjoy the journey.

RoCash is a gamified daily spending and savings tracker for Ugandans. Log an expense or a saving in seconds, watch your daily goal fill up, keep a streak, and earn XP and badges as the habit grows. All amounts are whole Uganda shillings (UGX).

> Status: early development. Features and screens are still being tested and refined.

Concept by Roshina.

Features

- Quick entry for expenses and savings, with categories, notes and back-dated entries
- Home dashboard: spent today, saved today against your daily goal, a seven-day streak, this month's totals and recent activity
- History: a year overview of month cards, and a month view grouped by day, with filters and search
- Reports: spent vs saved by week or month, category breakdown, savings growth
- Rewards: XP, levels (Starter to Money Master), nine badges and a daily-goal streak
- Dated daily goals, so changing your goal never rewrites past days
- Editable categories (archived, never deleted), export to CSV, account deletion
- Installable as a PWA

How it works

Every number on screen comes from database functions, never from client-side maths, so Home, History and Reports can never disagree. Amounts are stored as integers. Streaks, XP and badges are calculated by the database from the user's real entries. Each user can only read and write their own rows (row level security).

Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, Framer Motion
- Supabase: Postgres, Auth and row level security
- DiceBear (generated locally) for avatars
- Screens designed in Google Stitch and built with Google AI Studio

Getting started

1. Clone the repo and run `npm install`.
2. Create a project at supabase.com.
3. In the Supabase SQL Editor, run the files in `supabase/` in this order:
   1. `01_schema.sql` (tables, new-user trigger, security rules)
   2. `02_totals.sql` (daily, monthly, yearly and category totals, streak)
   3. `03_rewards.sql` (achievements, XP, levels and badges)
   4. `04_account.sql` (account deletion)
4. In Authentication, enable email sign-in. While developing you can turn "Confirm email" off; before real users arrive, set up a proper email provider (custom SMTP) and turn it back on.
5. Put your project URL and **publishable** key in `src/config.ts`.
6. Run `npm run dev`.

Project structure

- `src/api`: typed data layer for tables and database functions
- `src/hooks`: shared data hook with global refresh
- `src/lib`: money, date and Supabase helpers
- `src/auth`: sign-in state and route guard
- `src/components`, `src/pages`: UI
- `src/routes`: boot and routing rules
- `supabase`: SQL for the database
- `public`: PWA manifest, icons and service worker

Security

- Only the publishable key belongs in the app. **Never commit** the database password or the service-role key.
- Every table uses row level security so users only see their own data.
- The service worker never caches API responses.

Roadmap

- Google sign-in
- Offline queue for entries made without a connection
- Dark mode and notifications
- Privacy policy and help centre

Credits

Concept by Roshina. Font: Plus Jakarta Sans. Avatars: DiceBear.
