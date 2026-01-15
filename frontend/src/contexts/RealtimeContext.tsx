/**
 * Realtime Context
 * Manages WebSocket connections and real-time event streaming
 * Currently uses mock data simulation - can be swapped for real WebSocket later
 */

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';

export type RealtimeEventType =
  | 'win'
  | 'prediction'
  | 'achievement'
  | 'referral'
  | 'streak'
  | 'duel_created'
  | 'duel_joined'
  | 'user_joined'
  | 'user_left'
  | 'quest_completed'
  | 'quest_progress';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  timestamp: Date;
  data: {
    user?: string;
    amount?: number;
    game?: 'draft' | 'whisperer' | 'arena' | 'gauntlet';
    description?: string;
    multiplier?: number;
    achievement?: string;
    duelId?: string;
    prediction?: string;
  };
}

interface RealtimeContextType {
  events: RealtimeEvent[];
  latestEvent: RealtimeEvent | null;
  onlineUsers: number;
  isConnected: boolean;
  subscribe: (callback: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Mock event generator - simulates WebSocket stream
function generateMockEvent(): RealtimeEvent {
  const eventTypes: RealtimeEventType[] = ['win', 'prediction', 'achievement', 'streak', 'duel_created'];
  const games = ['draft', 'whisperer', 'arena', 'gauntlet'] as const;
  const users = [
    '0x1234...5678', '0x2345...6789', '0x3456...789a', '0x4567...89ab',
    '0x5678...9abc', '0x6789...abcd', '0x789a...bcde', '0x89ab...cdef'
  ];

  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const game = games[Math.floor(Math.random() * games.length)];
  const user = users[Math.floor(Math.random() * users.length)];

  const event: RealtimeEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date(),
    data: { user, game },
  };

  switch (type) {
    case 'win':
      event.data.amount = parseFloat((Math.random() * 2 + 0.1).toFixed(3));
      event.data.description = `Won ${event.data.amount} ETH in ${game === 'draft' ? 'CT League' : game === 'whisperer' ? 'CT Whisperer' : game === 'arena' ? 'League' : 'Daily Gauntlet'}`;
      if (Math.random() > 0.7) {
        event.data.multiplier = Math.floor(Math.random() * 3) + 2; // 2x, 3x, or 4x
      }
      break;
    case 'prediction':
      const predictions = [
        'ETH to hit $3000 by Friday',
        'BTC dominance will increase',
        'SOL outperforms this week',
        'Crypto market cap reaches ATH'
      ];
      event.data.prediction = predictions[Math.floor(Math.random() * predictions.length)];
      event.data.description = `Made prediction: ${event.data.prediction}`;
      break;
    case 'achievement':
      const achievements = [
        'First Blood', 'ETH Hunter', 'Prophet', 'Perfect Week',
        'Influencer', 'Consistency', 'Draft Master', 'League Champion'
      ];
      event.data.achievement = achievements[Math.floor(Math.random() * achievements.length)];
      event.data.description = `Unlocked "${event.data.achievement}"`;
      break;
    case 'streak':
      const streakDays = [3, 5, 7, 10, 14, 30][Math.floor(Math.random() * 6)];
      event.data.description = `Reached ${streakDays}-day streak`;
      event.data.multiplier = streakDays >= 7 ? 2 : 1.5;
      break;
    case 'duel_created':
      event.data.duelId = `duel_${Date.now()}`;
      event.data.amount = parseFloat((Math.random() * 5 + 0.5).toFixed(2));
      event.data.description = `Created ${event.data.amount} ETH duel`;
      break;
  }

  return event;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RealtimeEvent | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const subscribers = useRef<Set<(event: RealtimeEvent) => void>>(new Set());

  // Simulate connection
  useEffect(() => {
    // Simulate connection delay
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      // Random online users count
      setOnlineUsers(Math.floor(Math.random() * 150) + 50);
    }, 500);

    return () => clearTimeout(connectTimeout);
  }, []);

  // Simulate real-time event stream
  useEffect(() => {
    if (!isConnected) return;

    // Generate new event every 3-8 seconds
    const generateEvent = () => {
      const event = generateMockEvent();

      setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
      setLatestEvent(event);

      // Notify all subscribers
      subscribers.current.forEach((callback) => callback(event));

      // Schedule next event
      const nextDelay = Math.random() * 5000 + 3000; // 3-8 seconds
      return setTimeout(generateEvent, nextDelay);
    };

    const timeout = generateEvent();
    return () => clearTimeout(timeout);
  }, [isConnected]);

  // Fluctuate online users count
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setOnlineUsers((prev) => {
        const change = Math.floor(Math.random() * 10) - 4; // -4 to +5
        return Math.max(30, Math.min(250, prev + change));
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  // Subscribe to events
  const subscribe = useCallback((callback: (event: RealtimeEvent) => void) => {
    subscribers.current.add(callback);

    return () => {
      subscribers.current.delete(callback);
    };
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        events,
        latestEvent,
        onlineUsers,
        isConnected,
        subscribe,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
