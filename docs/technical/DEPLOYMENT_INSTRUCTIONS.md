# Foresight Deployment Instructions 🚀

## ✅ Pre-Deployment Checklist

- ✅ Frontend built successfully (`pnpm build` completed)
- ✅ All Arena/Gauntlet code removed
- ✅ Pure CT Fantasy League product
- ✅ 61 verified human influencers
- ✅ Base Mini App integration configured
- ✅ Clean, focused codebase

---

## 🎯 Quick Deploy (Recommended)

### Option 1: Vercel CLI (Fastest)

1. **Login to Vercel:**
   ```bash
   npx vercel login
   ```
   - Follow the prompts to login via email or GitHub

2. **Deploy Frontend:**
   ```bash
   cd frontend
   npx vercel --prod --yes
   ```
   - Vercel will automatically detect Vite config
   - Will create project & deploy in one command
   - You'll get a production URL like: `https://foresight-xxx.vercel.app`

3. **Set Environment Variables** (after first deploy):
   ```bash
   npx vercel env add VITE_API_URL
   # Enter your backend URL when prompted

   npx vercel env add VITE_WALLETCONNECT_PROJECT_ID
   # Enter your WalletConnect Project ID
   ```

4. **Redeploy with env vars:**
   ```bash
   npx vercel --prod --yes
   ```

---

### Option 2: Vercel Web UI (Visual)

1. **Go to Vercel:**
   - Visit https://vercel.com/new
   - Login with GitHub

2. **Import Git Repository:**
   - Click "Import Project"
   - Select your GitHub repo: `yonko/foresight`
   - Or connect GitHub if not connected

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.com
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   VITE_FARCASTER_CLIENT_ID=your_farcaster_id (optional)
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait ~2 minutes
   - Get production URL

---

## 🔧 Backend Deployment Options

### Option 1: Railway (Easiest for Node.js)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize Project:**
   ```bash
   cd backend
   railway init
   ```

4. **Add PostgreSQL:**
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="$(railway variables get DATABASE_URL)"
   railway variables set JWT_SECRET="your-secret-here"
   railway variables set NODE_ENV="production"
   railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

---

### Option 2: Render (Free PostgreSQL)

1. **Go to Render:**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database:**
   - New → PostgreSQL
   - Name: `foresight-db`
   - Plan: Free
   - Copy the "Internal Database URL"

3. **Create Web Service:**
   - New → Web Service
   - Connect your GitHub repo
   - **Name:** `foresight-backend`
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`

4. **Environment Variables:**
   ```
   DATABASE_URL=<paste Internal Database URL>
   JWT_SECRET=<generate random string>
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=10000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait ~5 minutes
   - Get backend URL

---

### Option 3: Fly.io (Fast & Global)

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Launch App:**
   ```bash
   cd backend
   fly launch
   ```
   - Follow prompts
   - Choose region closest to users
   - Say YES to PostgreSQL

4. **Set Secrets:**
   ```bash
   fly secrets set JWT_SECRET="your-secret"
   fly secrets set FRONTEND_URL="https://your-frontend.vercel.app"
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

---

## 📱 Update Mini App Manifest

After deploying, update the manifest with production URLs:

**Edit `frontend/public/.well-known/farcaster.json`:**
```json
{
  "version": "1.0.0",
  "name": "Foresight - CT Fantasy League",
  "homeUrl": "https://foresight-xxx.vercel.app",
  "iconUrl": "https://foresight-xxx.vercel.app/icon.png",
  "splashImageUrl": "https://foresight-xxx.vercel.app/splash.png",
  "splashBackgroundColor": "#0052FF",
  "primaryCategory": "games"
}
```

Then redeploy frontend:
```bash
cd frontend
npx vercel --prod --yes
```

---

## 🗄️ Database Setup

After backend is deployed, run migrations:

### For Railway:
```bash
railway run npx knex migrate:latest
railway run npx knex seed:run
```

### For Render:
Connect via their web shell or use psql locally:
```bash
psql "postgresql://..."
# Then run migrations manually or via API
```

### For Fly.io:
```bash
fly ssh console
cd backend
npx knex migrate:latest
npx knex seed:run
```

---

## ✅ Post-Deployment Checklist

1. **Frontend is live:** https://your-app.vercel.app
2. **Backend is live:** https://your-backend.railway.app (or render/fly)
3. **Database connected:** Migrations ran successfully
4. **Influencers seeded:** 61 influencers in database
5. **Mini App manifest updated:** Production URLs set
6. **Environment variables set:** All services configured
7. **Health check passes:** Visit `/api/health`

---

## 🧪 Testing Deployment

1. **Frontend:**
   ```bash
   curl https://your-app.vercel.app
   # Should return HTML
   ```

2. **Backend Health:**
   ```bash
   curl https://your-backend.railway.app/api/health
   # Should return {"status":"ok"}
   ```

3. **Database:**
   ```bash
   curl https://your-backend.railway.app/api/influencers
   # Should return 61 influencers
   ```

4. **Full E2E:**
   - Visit your frontend URL
   - Connect wallet
   - Draft a team
   - Check leaderboard
   - Verify everything works!

---

## 🎯 Recommended Setup

**For Production:**
- **Frontend:** Vercel (free, fast, automatic)
- **Backend:** Railway (easiest, $5/mo)
- **Database:** Railway PostgreSQL (included with backend)

**Total Cost:** $5/month (Railway backend + DB)

**Why?**
- Vercel: Best for static sites, automatic deployments, global CDN
- Railway: Simplest backend deployment, includes PostgreSQL, one command deploy
- Combined: Fast, reliable, easy to manage

---

## 📊 Expected Deployment Time

- **Frontend (Vercel):** 2-3 minutes
- **Backend (Railway):** 3-5 minutes
- **Database Setup:** 1-2 minutes
- **Total:** ~10 minutes from start to live 🚀

---

## 🆘 Troubleshooting

### Frontend build fails:
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Backend won't start:
- Check DATABASE_URL is set correctly
- Verify all env vars are present
- Check logs: `railway logs` or render web UI

### Database migrations fail:
- Ensure DATABASE_URL is correct
- Check PostgreSQL is running
- Try manual migration:
  ```bash
  railway run bash
  npx knex migrate:latest --env production
  ```

### Mini App not loading:
- Verify manifest is accessible: `/Users/yonko/foresight/frontend/public/.well-known/farcaster.json`
- Check CORS is configured in backend
- Ensure production URLs are correct

---

## 🎉 You're Ready!

1. Choose deployment method above
2. Deploy frontend to Vercel
3. Deploy backend to Railway/Render/Fly
4. Run database migrations
5. Update Mini App manifest
6. Test everything
7. Launch to users! 🚀

**Your CT Fantasy League is ready for the world!** 🎯
