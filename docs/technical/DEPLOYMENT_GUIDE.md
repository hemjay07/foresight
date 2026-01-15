# Foresight Deployment Guide

## Option 1: Quick Share with ngrok (5 minutes)

### Setup:
1. **Install ngrok** (if not already done):
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

2. **Sign up at ngrok.com** and get your auth token

3. **Authenticate ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

4. **Expose Backend** (in terminal 1):
   ```bash
   cd backend
   ngrok http 3001
   ```
   Copy the forwarding URL (e.g., `https://abc123.ngrok.io`)

5. **Update Frontend** to use ngrok backend:
   ```bash
   cd frontend
   # Edit .env file:
   echo "VITE_API_URL=https://YOUR_NGROK_BACKEND_URL" > .env
   ```

6. **Expose Frontend** (in terminal 2):
   ```bash
   cd frontend
   ngrok http 5173
   ```

7. **Share the frontend ngrok URL** with your friends!

### Important:
- Both URLs change each time you restart ngrok (free tier)
- Your computer must stay on and connected
- Good for 5-20 testers

---

## Option 2: Production Deployment (Permanent)

### A. Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```
   Follow prompts, it will give you a permanent URL!

3. **Set environment variables** on Vercel dashboard:
   - `VITE_API_URL` = your backend URL

### B. Deploy Backend to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g railway
   ```

2. **Login and deploy**:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Add database**:
   - Go to Railway dashboard
   - Add PostgreSQL service
   - Copy connection string

4. **Set environment variables** on Railway:
   - `DATABASE_URL` = PostgreSQL connection string
   - `NODE_ENV` = production
   - `PORT` = 3001

### C. Alternative: Deploy to Render

1. Connect your GitHub repo to Render
2. Create Web Service for backend (Node.js)
3. Create Static Site for frontend
4. Add PostgreSQL database
5. Set environment variables

---

## Option 3: Self-Host with Domain

If you have a VPS/server:

1. **Setup reverse proxy** (nginx/caddy)
2. **Get SSL certificate** (Let's Encrypt)
3. **Point domain** to your server
4. **Use PM2** to keep processes running

---

## Recommended: Start with ngrok, move to Vercel later

**For testing today:**
- Use ngrok (option 1)
- Share with 5-10 friends
- Get feedback

**When ready for launch:**
- Deploy to Vercel (free tier)
- Get permanent URL
- Share on Twitter/Discord

---

## Database Migration for Production

When deploying, you'll need to migrate your data:

```bash
# Export local data
pg_dump foresight > backup.sql

# Import to production
psql $PRODUCTION_DATABASE_URL < backup.sql
```

Or start fresh and run migrations:
```bash
NODE_OPTIONS='--import tsx' npx knex migrate:latest
```
