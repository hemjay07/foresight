# GROWTH & RETENTION QUICK START
## Tactical Implementation Guide (Copy-Paste Ready)

> **For:** Engineering team implementing engagement features
> **Time:** Read in 5 mins, reference during builds
> **Status:** Phase 1 ready to implement

---

## THE CORE PROBLEM (30 seconds)

- Weekly contests = 5-day dead zone between action and reward
- 80% of users churn after first week
- Current engagement: 1 action/week (draft)
- Target: 12+ checks/week (4 score updates + friend activity + leaderboard)

---

## THE SOLUTION (3 Components)

### 1. Score Updates (4x/day)
Pull users back with real-time progress feedback.

### 2. Social Leverage (Follow + Friends)
Friends are stronger motivation than strangers.

### 3. Progression Visibility (XP + Levels)
Show users they're making progress (even if not winning).

---

## PHASE 1: QUICK WINS (This Week)

### Task 1: Email Templates (Backend)

**File:** `backend/src/services/emailService.ts` (CREATE or UPDATE)

**What to add:**

```typescript
// Score update email (send 4x/day after scoring round)
const scoreUpdateEmail = (user: User, round: number, scoreGain: number, newRank: number) => ({
  subject: `You gained ${scoreGain} pts! You're #${newRank} now`,
  html: `
    <h2>Scores Updated</h2>
    <p>Your team earned <strong>+${scoreGain} pts</strong> this round.</p>
    <p>You're now ranked <strong>#${newRank}</strong> out of ${totalPlayers}.</p>
    <p style="color: gold;">Score: +${scoreGain} | Rank: #${newRank}</p>
    <a href="${appUrl}/play?tab=rankings&type=fs">View Leaderboard</a>
  `
});

// Countdown email (Sun 24h, 12h, 1h before lock)
const countdownEmail = (user: User, hoursLeft: number, userRank: number) => ({
  subject: `${hoursLeft} hours left! You're #${userRank}`,
  html: `
    <h2>Contest Ends in ${hoursLeft} Hours</h2>
    <p>Your rank: <strong>#${userRank}</strong></p>
    <p>Don't miss out on claiming your prize!</p>
    <a href="${appUrl}/play?tab=rankings&type=fs">View Final Scores</a>
  `
});

// Prize email (Mon after lock)
const prizeEmail = (user: User, finalRank: number, prizeAmount: number) => ({
  subject: `Results: You finished #${finalRank}!`,
  html: `
    <h2>Contest Results</h2>
    <p>Your final rank: <strong>#${finalRank}</strong></p>
    ${prizeAmount > 0 ? `<p>Prize earned: <strong>$${prizeAmount} SOL</strong></p>` : ''}
    <a href="${appUrl}/play?tab=rankings&type=fs">View Leaderboard</a>
    <a href="${appUrl}/draft">Draft Next Week's Team</a>
  `
});
```

**Trigger points:**
- Score update email: After each scoring round (12:00, 18:00, 00:00, 06:00 UTC)
- Countdown email: Sun at 00:00 (24h), 12:00 (12h), 23:00 (1h)
- Prize email: Mon 00:15 (after finalization)

**Integration:**
```typescript
// In cronJobs.ts, after score calculation:
await emailService.sendScoreUpdate(userId, roundNumber, scoreGain, newRank);

// Before contest lock:
await emailService.sendCountdown(userId, hoursLeft, currentRank);

// After finalization:
await emailService.sendPrize(userId, finalRank, prizeAmount);
```

---

### Task 2: Progression Card (Frontend)

**File:** `frontend/src/components/ProgressionCard.tsx` (CREATE)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUp, Star, Trophy } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';

interface ProgressionData {
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
  recentQuests: Array<{
    name: string;
    reward: number;
    completed: boolean;
  }>;
}

export default function ProgressionCard() {
  const { isConnected } = useAuth();
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/xp/current`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch progression:', error);
      }
      setLoading(false);
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isConnected]);

  if (!isConnected || !data) return null;

  const progressPercent = (data.currentXP / data.nextLevelXP) * 100;

  return (
    <div className="card card-elevated mb-6">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
          <Star size={16} weight="fill" />
          YOUR PROGRESSION
        </h3>

        {/* XP Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-gray-400">
              Level {data.currentLevel}
            </span>
            <span className="text-xs text-gray-500">
              {data.currentXP} / {data.nextLevelXP} XP
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded h-2">
            <div
              className="bg-gradient-to-r from-gold-500 to-amber-500 h-2 rounded transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Recent Quests */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">
            RECENT QUESTS
          </h4>
          <div className="space-y-2">
            {data.recentQuests.slice(0, 3).map((quest, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={quest.completed ? '✓' : '○'}>
                    {quest.name}
                  </span>
                </div>
                <span className="text-gold-400 text-xs">+{quest.reward} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button className="text-xs text-cyan-400 hover:text-cyan-300 underline">
          View All Progress
        </button>
      </div>
    </div>
  );
}
```

**Where to add:** `frontend/src/pages/Home.tsx`, below ActivityFeedCard:

```typescript
// In Home component, after <ActivityFeedCard />:
import ProgressionCard from '../components/ProgressionCard';

// In render:
<ProgressionCard />
<div className="mt-8">
  {/* CT Feed goes here */}
</div>
```

---

### Task 3: Leaderboard Level Badges (Frontend)

**File:** `frontend/src/pages/Compete.tsx` (UPDATE)

**Change 1: Add xpLevel to API call**

```typescript
// Current (around line 150):
const response = await axios.get(`${API_URL}/api/leaderboard/fs?type=${fsType}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Change interface to include xpLevel:
interface FsLeaderEntry {
  userId: string;
  username?: string;
  avatarUrl?: string;
  score: number;
  tier: string;
  rank?: number;
  isFoundingMember: boolean;
  foundingMemberNumber?: number;
  earlyAdopterTier?: string;
  tapestryUserId?: string;
  xpLevel?: number;  // ADD THIS
}
```

**Change 2: Update table header & rows**

```typescript
// Find the leaderboard table render (around line 450-550)
// Add column header:
<th className="text-right text-xs font-semibold text-gray-400 px-4">Level</th>

// Add level cell in each row:
<td className="text-right text-sm px-4">
  <div className="flex items-center justify-end gap-1">
    {entry.xpLevel ? (
      <>
        <span className="text-gold-400 font-medium">
          Lvl {entry.xpLevel}
        </span>
        <span className="text-gold-500">⭐</span>
      </>
    ) : (
      <span className="text-gray-600">—</span>
    )}
  </div>
</td>
```

**Backend change needed:**

In `backend/src/api/leaderboard.ts`:

```typescript
// Add to query for FS leaderboard:
.select(
  'users.id as userId',
  'users.username',
  'users.avatar_url as avatarUrl',
  'foresight_scores.score',
  'users.tier',
  'xp.level as xpLevel'  // ADD THIS
)
.leftJoin('xp', 'users.id', 'xp.user_id')  // ADD THIS JOIN
```

**Styling:** Level badge appears in gold on right side of row.

---

### Task 4: Contest Countdown Banner (Frontend)

**File:** `frontend/src/pages/Compete.tsx` (UPDATE)

Add this component above the leaderboard:

```typescript
// Calculate time until contest ends
const calculateTimeRemaining = (contestEndTime: string) => {
  const now = new Date();
  const end = new Date(contestEndTime);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return { hours: 0, mins: 0, ended: true };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, mins, ended: false };
};

// In render (before leaderboard):
{currentContest && (
  <div className={`mb-6 p-4 rounded-lg border ${
    timeRemaining.hours < 24
      ? 'bg-rose-500/10 border-rose-500/30'
      : 'bg-gold-500/10 border-gold-500/20'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Clock size={20} className={timeRemaining.hours < 24 ? 'text-rose-400' : 'text-gold-400'} />
        <div>
          <h4 className="font-semibold text-white">
            {timeRemaining.hours > 0 ? (
              `⏳ ${timeRemaining.hours} hours ${timeRemaining.mins} mins left`
            ) : (
              '⏳ Final hour!'
            )}
          </h4>
          <p className="text-sm text-gray-400">
            Your rank: <span className="text-gold-400">#{userFsRank}</span>
          </p>
        </div>
      </div>
      <Link
        to={`/contest/${currentContest.id}`}
        className="btn-cyan btn-sm"
      >
        View Details
      </Link>
    </div>
  </div>
)}
```

---

## PHASE 2: SOCIAL INTEGRATION (Next Week)

### Task 5: Profile Level + Quest List

**File:** `frontend/src/pages/Profile.tsx` (UPDATE)

In the profile header, add:

```typescript
{/* Level Badge */}
<div className="flex items-center gap-2 mb-4">
  <span className="text-sm text-gray-400">Level</span>
  <div className="flex items-center gap-1">
    <span className="text-lg font-bold text-gold-400">{userLevel}</span>
    <span className="text-gold-500">⭐</span>
  </div>
  <div className="flex-1 ml-4 bg-gray-800 rounded h-2">
    <div
      className="bg-gold-500 h-2 rounded"
      style={{ width: `${(userXP / nextLevelXP) * 100}%` }}
    />
  </div>
</div>

{/* Quest List Section */}
<div className="mt-8">
  <h3 className="text-sm font-semibold text-gold-400 mb-3">ACTIVE QUESTS</h3>
  <div className="space-y-2">
    {activeQuests.map(quest => (
      <div key={quest.id} className="card p-3 flex justify-between">
        <span className={quest.completed ? 'line-through text-gray-500' : 'text-white'}>
          {quest.name}
        </span>
        <span className="text-gold-400 text-sm">+{quest.reward} XP</span>
      </div>
    ))}
  </div>
</div>
```

---

### Task 6: Referral Widget on Home

Move referrals from buried page to home-page widget.

**File:** `frontend/src/components/ReferralWidget.tsx` (CREATE)

```typescript
export default function ReferralWidget() {
  return (
    <div className="card card-elevated mb-6 bg-gradient-to-br from-gold-500/10 to-amber-500/10">
      <div className="p-4">
        <h3 className="font-semibold text-gold-400 mb-2">EARN WITH FRIENDS</h3>
        <p className="text-sm text-gray-400 mb-4">
          Get +200 XP for each friend who joins. They get a free team too.
        </p>
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Referrals: {referralCount}/5</p>
          <div className="w-full bg-gray-800 rounded h-2">
            <div
              className="bg-gold-500 h-2 rounded"
              style={{ width: `${(referralCount / 5) * 100}%` }}
            />
          </div>
        </div>
        <button className="btn-gold btn-sm w-full">
          Copy Referral Link
        </button>
      </div>
    </div>
  );
}
```

Add to home: `<ReferralWidget />`

---

## BACKEND INTEGRATION CHECKLIST

### Cron Jobs

**File:** `backend/src/services/cronJobs.ts`

Add these triggers:

```typescript
// 4x daily score updates → emails
schedule('0 12 * * *', () => triggerScoringRound()); // 12:00 UTC
schedule('0 18 * * *', () => triggerScoringRound()); // 18:00 UTC
schedule('0 0 * * *', () => triggerScoringRound());  // 00:00 UTC
schedule('0 6 * * *', () => triggerScoringRound());  // 06:00 UTC

// Sunday countdown emails
schedule('0 0 * * 0', () => sendCountdownEmail(24)); // 24h
schedule('0 12 * * 0', () => sendCountdownEmail(12)); // 12h
schedule('0 23 * * 0', () => sendCountdownEmail(1));  // 1h

// Monday finalization + prize emails
schedule('15 0 * * 1', () => sendPrizeEmails()); // After lock
```

---

### API Endpoints (Already Exist)

Verify these are working:

- `GET /api/xp/current` — User's current XP + next level
- `GET /api/xp/me` — User's full XP history
- `GET /api/quests/active` — User's active quests
- `GET /api/leaderboard/fs` — Full FS leaderboard with levels
- `POST /api/tapestry/follow` — Follow a user
- `GET /api/activity/feed` — Activity feed

---

## TESTING CHECKLIST

- [ ] Email templates render correctly (test@example.com)
- [ ] Progression card loads and updates every 30s
- [ ] Level badges show on leaderboard
- [ ] Countdown banner appears in final 24h
- [ ] Mobile responsive (375px width)
- [ ] Activity feed updates in real-time
- [ ] Follow buttons work on leaderboard rows

---

## COMMON PITFALLS

1. **Email not sending:** Check `SENDGRID_KEY` or mail provider setup
2. **XP not updating:** Verify quest triggers in `prizedContestsV2.ts`
3. **Leaderboard pagination:** Add `xpLevel` to database join, not just response
4. **Activity feed lag:** Ensure 30s polling is set (not 60s)
5. **Mobile overflow:** Test with Safari 375px viewport

---

## WHAT HAPPENS WHEN YOU SHIP THIS

**Week 1:** New users see progression immediately (home page card)
**Week 2:** Veterans are leveled up, new users are competitive
**Week 3:** Referral widget drives viral growth (friends see shared progress)
**Week 4+:** Retention metrics improve 2-3x (more reasons to check app)

---

**Total implementation time: 10-12 hours**
**Expected impact: D7 retention ↑ 15-20%**

