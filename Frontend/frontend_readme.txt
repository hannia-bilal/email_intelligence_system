# MailMind – frontend

React + TypeScript + Tailwind CSS. Runs fully in the browser (no backend needed yet): accounts, mail and
settings are kept in `localStorage`, so you can use every screen straight away.

## Run it

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build in dist/
```

## Accounts and sign-in

There is **one sign-in page** for everybody (`/login`). Where you land depends on your account:

| Account | Lands on | What they see |
|---|---|---|
| Member | `/dashboard` | Dashboard, inbox, assistant, analytics, import, profile. No admin options anywhere. |
| Admin | `/admin` | A separate admin console with its own layout. Admins don't see the member app. |

- **Default admin** (created automatically, can't be deleted, disabled or demoted):
  email `demo@mailmind.ai`, password `12344321`. Change the password in *Admin → Settings*.
- **Registering** asks for name, phone (optional), email and password (8+ characters). Members can't pick a role.
- The sign-in page shows no hints, and every failed sign-in gives the same message. After 5 wrong attempts it pauses for a minute.
- **Forgot password** sends a request to the admins (*Admin → Users*), who can issue a temporary password.

### Admin console

| Page | Purpose |
|---|---|
| Overview | Member / admin counts, newest members, recent activity |
| Users | Search members, enable/disable, reset password, promote to admin, delete |
| Admins | **Add other admins**, remove admin rights, disable an admin |
| Activity | Log of admin actions |
| Settings | Open/close new sign-ups, change your own password |

## Before going live

This is a front-end stand-in for a real backend:

- Passwords are salted + hashed in `localStorage`, but real authentication (bcrypt/argon2, sessions or JWT,
  server-side rate limiting, email delivery for resets) has to live on your server. The account logic is isolated in
  `src/lib/accounts.ts` and the actions in `src/store/useStore.ts` – swap those for API calls.
- The default admin credentials are seeded in `src/lib/accounts.ts`; create the first admin on the server instead.
- Each member gets a private copy of the sample mailbox. Set `SEED_NEW_ACCOUNTS = false` in `src/store/useStore.ts`
  to start new accounts with an empty inbox.
- Email sorting, summaries and draft replies are simulated in `src/lib/mockAi.ts`; connect your model/API there.

## Project layout

```
src/
  components/  Layout (member app), AdminLayout, AuthShell, Logo, ui
  pages/       member pages, Auth (login / register / forgot), admin/*
  lib/         accounts, hash, storage, mockAi, parsers, stats, types, utils
  store/       useStore.ts (zustand)
```
