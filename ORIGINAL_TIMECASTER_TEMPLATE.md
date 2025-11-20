# Original Timecaster Template

## 📍 Location

The original Timecaster template this project was based on is located at:
**`/Users/yonko/timecaster`**

## 🏗️ What Was Timecaster?

Timecaster was a **multi-game Web3 gaming platform** with 4 game modes:

1. **Timecaster Arena** - 1v1 Twitter prediction battles
2. **Daily Gauntlet** - Daily challenges for XP
3. **CT Whisperer** - Trivia game about CT personalities
4. **CT Draft** - Fantasy league (this project!)

## 🎯 What We Kept for Foresight

This `foresight` project is a **focused extraction** of just the **CT Draft** fantasy league from Timecaster:

### Kept ✅
- CT Draft fantasy league game mode
- 100-point budget system (was 25M, now metrics-based)
- Automated scoring with follower counts
- Private leagues system
- XP & progression system
- SIWE wallet authentication
- PostgreSQL database with Knex migrations
- React + Vite frontend
- Base Sepolia blockchain integration

### Removed ❌
- Arena battles (1v1 predictions)
- Daily Gauntlet challenges
- CT Whisperer trivia
- WebSocket real-time features
- Oracle keeper service
- Twitter scraper
- Complex notification system
- Multi-game navigation
- Onboarding flows

## 📂 How to Access Original Template

```bash
# Navigate to original Timecaster project
cd /Users/yonko/timecaster

# View the full multi-game structure
ls -la

# Key directories in original:
# - /contracts      → All 6 smart contracts
# - /frontend       → Full multi-game UI
# - /backend        → All 4 game modes
```

## 🔄 How This Project Differs

| Feature | Original Timecaster | Foresight (This Project) |
|---------|---------------------|--------------------------|
| **Game Modes** | 4 (Arena, Gauntlet, Whisperer, Draft) | 1 (CT Draft only) |
| **Scoring System** | Voting-based | Automated metrics-based |
| **Budget System** | 25M (millions) | 100 points |
| **Influencers** | 20 initial | 50 active CT accounts |
| **Smart Contracts** | 6 contracts | Only CT Draft contract needed |
| **Real-time** | WebSocket server | Optional (simplified) |
| **Oracle** | Manual keeper bot | Automated cron jobs |

## 🚀 Benefits of Focused Approach

### Why Extract Just CT Draft?

1. **Simpler to Deploy** - One game mode = easier hosting
2. **Lower Costs** - No WebSocket server, no manual keepers
3. **Easier Maintenance** - Fewer moving parts
4. **Better UX** - Focused experience, not overwhelming
5. **Faster Iteration** - Can improve one game quickly

### Still Want Multi-Game?

If you want to restore the full Timecaster experience:

```bash
# Option 1: Start fresh from original
cd /Users/yonko/timecaster
git checkout master  # If it's a git repo

# Option 2: Cherry-pick features back to Foresight
cd /Users/yonko/foresight
# Manually copy Arena/Gauntlet/Whisperer code from:
# /Users/yonko/timecaster/backend/src/api/
# /Users/yonko/timecaster/frontend/src/pages/
```

## 📊 Migration Summary

### Database Migrations Kept
```
✅ Users & Authentication
✅ CT Draft (Fantasy League)
✅ XP System
✅ Streak System
✅ Badge System
✅ Private Leagues
❌ Arena tables
❌ Gauntlet tables
❌ Whisperer tables
```

### Frontend Pages Kept
```
✅ Home.tsx
✅ League.tsx (was Draft.tsx)
✅ Vote.tsx
✅ Profile.tsx
✅ Layout.tsx
❌ Arena.tsx
❌ Gauntlet.tsx
❌ Whisperer.tsx
❌ TerminalDashboard.tsx
```

### Backend APIs Kept
```
✅ /api/auth
✅ /api/league (was /api/draft)
✅ /api/users
✅ /api/admin
✅ /api/private-leagues
❌ /api/arena
❌ /api/gauntlet
❌ /api/whisperer
❌ /api/quests
```

## 🎓 Key Learnings from Extraction

### What Worked Well
- Modular architecture made extraction clean
- Separate API routes per game mode
- Database migrations were self-contained
- Frontend pages were independent

### Challenges Faced
- Removing WebSocket dependencies
- Simplifying navigation (4 games → 1 game)
- Updating shared components (Layout, etc.)
- Migrating from voting to metrics-based scoring

## 📝 Documentation

Both projects now have comprehensive docs:

### Original Timecaster
- Location: `/Users/yonko/timecaster/README.md`
- Covers all 4 game modes
- Full deployment guide
- Smart contract architecture

### Foresight (This Project)
- `TECHNICAL_DOCUMENTATION.md` - Full system architecture
- `METRICS_MIGRATION_COMPLETE.md` - Scoring system details
- `DEPLOYMENT_COMPLETE.md` - Deployment status (if exists)

## 🔗 Quick Links

| Resource | Path |
|----------|------|
| Original Template | `/Users/yonko/timecaster` |
| This Project | `/Users/yonko/foresight` |
| Original Contracts | `/Users/yonko/timecaster/contracts` |
| This Project Docs | `/Users/yonko/foresight/TECHNICAL_DOCUMENTATION.md` |

## ⚡ Quick Command Reference

```bash
# Clone original template to new project
cp -r /Users/yonko/timecaster /Users/yonko/new-project

# Compare this project to original
diff -r /Users/yonko/foresight /Users/yonko/timecaster

# View original smart contracts
ls /Users/yonko/timecaster/contracts/src

# Access original frontend code
open /Users/yonko/timecaster/frontend/src
```

---

**Last Updated:** November 20, 2025
**Original Template:** Timecaster v1.0
**This Project:** Foresight v1.0 (CT Draft focused)
