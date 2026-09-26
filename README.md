# Matka Game Platform

A full-stack web-based Matka/Number game platform with 3 panels — SuperAdmin, Admin, and User.

## Live deploy (Railway + Vercel)

Step-by-step: **[DEPLOY.md](./DEPLOY.md)**

| Piece | Host |
|--------|------|
| Backend API + workers | **Railway** (Dockerfile ready) |
| Frontend UI | **Vercel** (`packages/frontend`) |
| Postgres + Redis | Railway plugins (or Neon + Upstash) |

### Demo credentials (created by seed)

| Role | Username | Password |
|------|----------|----------|
| SuperAdmin | `superadmin` | `SuperAdmin@123` |
| Admin | `admin1` | `Admin@12345` |
| User | `user1` | `User@12345` (wallet **5000**) |

---

## Tech Stack

- **Backend:** Node.js 20, TypeScript, Express, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS

---

## Prerequisites (local)

1. **Node.js 20+**
2. **PostgreSQL 16+** (user `postgres`, password `postgres`, port `5432`)
3. **Redis** on port `6379`

---

## Setup & Run (local)

```bash
npm install
```

Create `packages/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/matka_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="matka-platform-super-secret-jwt-key-2026"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=3000
NODE_ENV="development"
```

```bash
cd packages/backend
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ../..
npm run build --workspace=packages/types
npm run dev --workspace=packages/backend
npm run dev --workspace=packages/frontend
```

- API: http://localhost:3000
- App: http://localhost:5173

---

## Project Structure

```
matka/
├── Dockerfile            # Railway backend image
├── railway.toml
├── DEPLOY.md
├── packages/
│   ├── backend/
│   ├── frontend/         # Vercel root directory
│   └── types/
└── README.md
```
