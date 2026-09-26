# Live Deploy — Railway + Vercel

Repo: https://github.com/Sanskar9755/matka

## Demo logins (seed auto-creates these)

| Role | Username | Password | Notes |
|------|----------|----------|--------|
| SuperAdmin | `superadmin` | `SuperAdmin@123` | |
| Admin | `admin1` | `Admin@12345` | Referral: `ADMINDEMO` |
| User | `user1` | `User@12345` | Wallet: **5000** welcome bonus |

---

## 1) Railway — Backend (do this first)

1. Open [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub** → select repo `Sanskar9755/matka`
3. Add services in the same project:
   - **PostgreSQL** (plugin)
   - **Redis** (plugin)
4. On the **web/backend** service → **Variables** → add:

```env
JWT_SECRET=matka-live-super-secret-change-me-32chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
```

5. Also link / set:
   - `DATABASE_URL` = from Postgres service (Railway can reference `${{Postgres.DATABASE_URL}}`)
   - `REDIS_URL` = from Redis service (e.g. `${{Redis.REDIS_URL}}`)
   - `PORT` is set by Railway automatically

6. Settings:
   - Builder uses `Dockerfile` + `railway.toml` (already in repo)
   - Generate a public domain → copy URL, e.g. `https://matka-production.up.railway.app`

7. Check: `https://YOUR-RAILWAY-URL/health` → `{ "status": "ok" }`

Seed runs on start → SuperAdmin / Admin / User + 5000 bonus create ho jayenge.

---

## 2) Vercel — Frontend

1. Open [vercel.com](https://vercel.com) → **Add New Project**
2. Import GitHub repo `Sanskar9755/matka`
3. Configure:
   - **Root Directory:** `packages/frontend`
   - Framework: Vite (auto)
4. Environment Variable (Production + Preview):

```env
VITE_API_URL=https://YOUR-RAILWAY-URL
```

(no trailing slash — same URL as Railway public domain)

5. Deploy → open the Vercel URL and login with credentials above.

---

## 3) After both are connected

1. Vercel URL pe jao
2. Login `user1` / `User@12345` → wallet **5000** dikhna chahiye
3. Agar API error aaye → Vercel env `VITE_API_URL` + Redeploy check karo

---

## Local (optional)

```bash
cd matka
npm install
# packages/backend/.env with DATABASE_URL + REDIS_URL
npm run build --workspace=packages/types
cd packages/backend && npx prisma db push && npx tsx prisma/seed.ts
npm run dev --workspace=packages/backend
npm run dev --workspace=packages/frontend
```
