# PHASE 1 TACTICAL GUIDE
## Developers: Start Here Tomorrow (Feb 23)

> **Goal:** 6 hours of focused implementation
> **Scope:** Follow button + Activity feed
> **Deadline:** Day 2 EOD (Feb 24, 11:59 PM)
> **Success:** Merge to main, zero merge conflicts, all tests pass

---

## QUICK START (Copy-Paste Ready Code)

### Task 1: Backend Batch Endpoint (1 hour, do first)

**File:** `backend/src/api/tapestry.ts`

Add this route BEFORE `export default router;` at the end:

```typescript
/**
 * POST /api/tapestry/following-state-batch
 * Batch check if current user follows multiple profiles.
 * Takes array of 50+ target profile IDs, returns { targetId: boolean } map.
 */
router.post(
  '/following-state-batch',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { targetProfileIds } = req.body;

    if (!Array.isArray(targetProfileIds) || targetProfileIds.length === 0) {
      throw new AppError('targetProfileIds must be a non-empty array', 400);
    }

    const myProfileId = await getTapestryProfileId(userId);

    // Parallel fetch: check follow status for all profiles
    const statesArray = await Promise.all(
      targetProfileIds.map(id => tapestryService.isFollowing(myProfileId, id))
    );

    // Map results: { profileId: isFollowing }
    const followingMap: Record<string, boolean> = {};
    targetProfileIds.forEach((id, index) => {
      followingMap[id] = statesArray[index];
    });

    sendSuccess(res, { followingMap });
  })
);
```

**Test it:**
```bash
cd backend
NODE_OPTIONS='--import tsx' pnpm dev

# In another terminal, test with curl:
curl -X POST http://localhost:3001/api/tapestry/following-state-batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetProfileIds":["profile1","profile2","profile3"]}'

# Expected response:
# { "success": true, "data": { "followingMap": { "profile1": true, "profile2": false, "profile3": true } } }
```

**Verify:**
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Route registered in `server.ts` (if not auto-imported)
- [ ] Returns correct shape: `{ followingMap: Record<string, boolean> }`

---

### Task 2: Follow Button Component (1.5 hours, do second)

**File:** `frontend/src/components/FollowButton.tsx` (CREATE NEW)

```typescript
import { useState } from 'react';
import { Check, Plus } from '@phosphor-icons/react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FollowButtonProps {
  targetProfileId: string;
  displayName: string;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  targetProfileId,
  displayName,
  isFollowing: initialFollowing = false,
  onFollowChange,
  size = 'md',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        showToast('Please sign in to follow users', 'error');
        setIsLoading(false);
        return;
      }

      const endpoint = isFollowing ? '/unfollow' : '/follow';
      await axios.post(
        `${API_URL}/api/tapestry${endpoint}`,
        { targetProfileId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      onFollowChange?.(newFollowingState);

      const message = newFollowingState
        ? `Followed ${displayName}`
        : `Unfollowed ${displayName}`;
      showToast(message, 'success');
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      showToast('Failed to update follow status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  const buttonClasses = isFollowing
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    : 'bg-gold-500 text-gray-950 hover:bg-gold-600';

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-1
        ${sizeClasses[size]}
        ${buttonClasses}
      `}
    >
      {isLoading ? (
        <span className="animate-spin">⟳</span>
      ) : isFollowing ? (
        <>
          <Check size={16} weight="bold" />
          Following
        </>
      ) : (
        <>
          <Plus size={16} weight="bold" />
          Follow
        </>
      )}
    </button>
  );
}
```

**Test it:**
```bash
cd frontend
pnpm test # Should compile without errors

# Manual testing:
# 1. Import into a page
# 2. Pass targetProfileId (from tapestry_user_id in DB)
# 3. Click button → should call API
# 4. Should show toast on success
```

**Verify:**
- [ ] No TypeScript errors
- [ ] Renders two states: "Follow" (gold) and "Following" (gray)
- [ ] Click triggers follow/unfollow API
- [ ] Loading state shows spinner
- [ ] Toast appears on success/error

---

### Task 3: Leaderboard Integration (1.5 hours, do third)

**File:** `frontend/src/pages/Compete.tsx`

Find the leaderboard rendering section. In the `rankings` tab, render:

```typescript
// 1. Import at top
import FollowButton from '../components/FollowButton';
import { useAuth } from '../hooks/useAuth';

// 2. Inside the Compete component, add after state setup:
const { authToken } = useAuth();
const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
const [loadingFollowing, setLoadingFollowing] = useState(false);

// 3. Load batch follow state when leaderboard loads
useEffect(() => {
  if (!authToken || !fsLeaderboard?.length) return;

  setLoadingFollowing(true);
  axios
    .post(
      `${API_URL}/api/tapestry/following-state-batch`,
      {
        targetProfileIds: fsLeaderboard
          .map(entry => entry.tapestryUserId)
          .filter(Boolean),
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    )
    .then(res => {
      setFollowingMap(res.data.data.followingMap);
    })
    .catch(error => {
      console.error('Failed to load following states:', error);
    })
    .finally(() => setLoadingFollowing(false));
}, [fsLeaderboard, authToken]);

// 4. In the leaderboard row rendering, add follow button:
{/* In the map function rendering each row */}
<tr key={entry.userId} className={entry.userId === currentUserId ? 'bg-gold-500/10' : ''}>
  <td>{rank}</td>
  <td>{entry.username}</td>
  <td>{entry.score}</td>
  {/* NEW: Add follow button */}
  <td>
    {entry.tapestryUserId && (
      <FollowButton
        targetProfileId={entry.tapestryUserId}
        displayName={entry.username || 'Player'}
        isFollowing={followingMap[entry.tapestryUserId] || false}
        size="sm"
      />
    )}
  </td>
</tr>
```

**Mobile consideration:**
On small screens (< 768px), stack follow button under name:
```typescript
<div className="md:table-cell hidden">
  {/* Desktop: follow button in column */}
</div>
<div className="md:hidden">
  {/* Mobile: follow button under name */}
</div>
```

**Verify:**
- [ ] Leaderboard loads
- [ ] Batch endpoint called once on load
- [ ] Follow buttons appear on all rows with tapestryUserId
- [ ] Click follow → button updates → toast shows
- [ ] Mobile: buttons stack properly

---

### Task 4: Activity Feed Card (1.5 hours, do fourth)

**File:** `frontend/src/components/ActivityFeedCard.tsx` (CREATE NEW)

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Activity {
  id: string;
  type: string; // 'follow', 'like', 'comment'
  actor: string; // Username who did the action
  target?: string; // Username who received the action
  timestamp: string;
  description?: string;
}

export default function ActivityFeedCard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/tapestry/activity?page=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setActivities(response.data.data.activity?.slice(0, 6) || []);
      } catch (error) {
        console.error('Failed to load activity:', error);
        // Fail silently - activity feed is non-critical
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();

    // Poll every 30 seconds
    const interval = setInterval(loadActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-gray-200 mb-4">Recent Activity</h3>
        <p className="text-gray-400">No activity yet. Be the first to follow someone!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-200">Recent Activity</h3>
        <span className="text-xs text-gold-500 font-medium">Live</span>
      </div>

      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
            <div className="flex-grow">
              <p className="text-gray-200">
                <span className="font-semibold text-gold-400">@{activity.actor}</span>
                {activity.type === 'follow' && (
                  <>
                    {' '}
                    followed <span className="font-semibold text-cyan-400">@{activity.target}</span>
                  </>
                )}
                {activity.type === 'like' && (
                  <>
                    {' '}
                    liked a team
                  </>
                )}
                {activity.type === 'comment' && (
                  <>
                    {' '}
                    commented on a team
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full py-2 text-center text-gold-500 hover:text-gold-400 text-sm font-medium transition-colors flex items-center justify-center gap-2">
        View All Activity
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  );
}
```

**Add to home page:**

**File:** `frontend/src/pages/Home.tsx`

```typescript
// 1. Import at top
import ActivityFeedCard from '../components/ActivityFeedCard';

// 2. In the JSX, add below "Active Team" section:
<div className="grid gap-6 md:grid-cols-2">
  {/* Active Team Card */}
  <ActiveTeamCard />

  {/* Activity Feed Card */}
  <ActivityFeedCard />
</div>
```

**Verify:**
- [ ] Card renders on home page
- [ ] Activities load from API
- [ ] Polls every 30 seconds
- [ ] Shows activity icons (follow, like, comment)
- [ ] Gracefully handles empty state
- [ ] No TypeScript errors

---

### Task 5: Toast Confirmations (0.5 hours)

Already done in Task 2 (FollowButton) — every follow/unfollow action shows a toast via:

```typescript
showToast(message, 'success');
```

If you need to add toasts elsewhere, use:

```typescript
import { useToast } from '../contexts/ToastContext';

// In component:
const { showToast } = useToast();
showToast('Your message', 'success' | 'error' | 'info');
```

---

## VERIFICATION CHECKLIST

### Before Merging to Main

**Backend:**
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `pnpm test` — all tests pass (add new tests if needed)
- [ ] Batch endpoint tested with `curl` or Postman
- [ ] API returns correct shape: `{ followingMap: { id: boolean } }`

**Frontend:**
- [ ] `pnpm build` — production build succeeds
- [ ] `pnpm test` — all tests pass
- [ ] Manual test on localhost:
  - [ ] Leaderboard page loads
  - [ ] Follow buttons appear on all rows
  - [ ] Click follow → API called → button updates → toast shows
  - [ ] Activity feed shows activities (may need test data)
  - [ ] Activity feed polls every 30 sec

**Git:**
- [ ] No merge conflicts
- [ ] All changes committed on feature branch (e.g., `feature/phase-1-social`)
- [ ] Ready to merge to `main`

---

## COMMON GOTCHAS

### "Batch endpoint returns empty object"
**Problem:** No activities in `tapestry_activity` table
**Fix:** This is okay for dev. API returns `{ followingMap: {} }` which is valid. Frontend handles gracefully.

### "Follow button doesn't update when I click it"
**Problem:** `isFollowing` state out of sync
**Fix:** Check localStorage has `authToken`. Check API returns 200. Check `onFollowChange` callback is fired.

### "Activity feed never updates"
**Problem:** Poll interval too short or too long
**Fix:** Currently 30 seconds. If API is slow, increase to 60. Frontend doesn't break if poll fails.

### "TypeScript error: 'tapestryUserId' does not exist"
**Problem:** FsLeaderEntry interface missing field
**Fix:** Add to interface:
```typescript
interface FsLeaderEntry {
  // ... existing fields
  tapestryUserId?: string;
}
```

### "Follow button appears on leaderboard but doesn't work"
**Problem:** Auth token not passed to batch request
**Fix:** Check `useAuth()` hook returns token. Check `Authorization: Bearer ${token}` in axios call.

---

## TIMELINE (6 Hours Across 2 Days)

**Day 1 (Feb 23):**
- 9:00-10:00: Batch endpoint implementation (backend) ✅
- 10:00-11:30: Follow button component (frontend) ✅
- 11:30-12:00: Confirmations + quick test ✅
- **Lunch**
- 13:00-13:30: Code review + merge batch endpoint
- **Target:** Batch endpoint in `main` by EOD

**Day 2 (Feb 24):**
- 9:00-10:30: Leaderboard integration ✅
- 10:30-12:00: Activity feed card + home page ✅
- **Lunch**
- 13:00-14:00: Full integration test + final polish ✅
- 14:00-14:30: Code review
- **Target:** All Phase 1 in `main` by 14:30 UTC

---

## ROLLBACK PLAN (If Something Breaks)

If batch endpoint doesn't work by Day 1 EOD:
```bash
git reset --hard origin/main
# Remove batch endpoint from implementation
# Switch to per-row follow checks (slower but works)
```

If follow button has bugs after Day 1:
```bash
git revert <commit-hash>
# Remove follow button from leaderboard
# Keep activity feed only
```

If activity feed breaks the home page:
```bash
git reset --hard origin/main
# Focus on follow button + explorer links only
# Activity feed is nice-to-have
```

---

## QUESTIONS?

1. **Which branch to work on?** Create `feature/phase-1-social` from `main`
2. **Where's the auth token?** `localStorage.getItem('authToken')`
3. **What if Tapestry API is down?** Fallbacks: return empty map, don't break UI
4. **Do we need new database schema?** No, all data lives on Tapestry
5. **What about rate limiting?** Batch endpoint is 1 request. Should be fine.

---

## SUCCESS LOOKS LIKE

By end of Day 2:
- Main branch has Phase 1 fully implemented
- Zero TypeScript errors
- All tests passing
- Leaderboard shows follow buttons
- Home page shows activity feed
- Everything merged and ready for QA (Day 3)

**Then:** Days 3-4 = QA + video, Day 5 = deploy + submit

