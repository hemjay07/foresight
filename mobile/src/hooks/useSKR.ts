import { useQuery } from '@tanstack/react-query';
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_RPC_URL } from '../constants/api';

// SKR token mint address (Solana Mobile ecosystem token)
const SKR_MINT = new PublicKey('SKRtRYQ1bSWBSbPG7eqUwBPuyGCe7eVpjDVHmHsS1fg');

export interface SKRStatus {
  balance: number;
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  tierLabel: string;
  tierColor: string;
  nextTier: string | null;
  toNextTier: number;
  fsMultiplier: number;
}

const TIERS = {
  none:   { min: 0,     label: 'No Tier',     color: '#71717A', multiplier: 1.0 },
  bronze: { min: 100,   label: 'Bronze',       color: '#CD7F32', multiplier: 1.1 },
  silver: { min: 1000,  label: 'Silver',       color: '#A1A1AA', multiplier: 1.25 },
  gold:   { min: 10000, label: 'Gold',         color: '#F59E0B', multiplier: 1.5 },
} as const;

function getTierFromBalance(balance: number): SKRStatus {
  let tier: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
  if (balance >= TIERS.gold.min) tier = 'gold';
  else if (balance >= TIERS.silver.min) tier = 'silver';
  else if (balance >= TIERS.bronze.min) tier = 'bronze';

  const tierConfig = TIERS[tier];
  const tierOrder: (keyof typeof TIERS)[] = ['none', 'bronze', 'silver', 'gold'];
  const currentIdx = tierOrder.indexOf(tier);
  const nextTierKey = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
  const nextTierConfig = nextTierKey ? TIERS[nextTierKey] : null;

  return {
    balance,
    tier,
    tierLabel: tierConfig.label,
    tierColor: tierConfig.color,
    nextTier: nextTierConfig?.label ?? null,
    toNextTier: nextTierConfig ? Math.max(0, nextTierConfig.min - balance) : 0,
    fsMultiplier: tierConfig.multiplier,
  };
}

export function useSKRBalance(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['skr-balance', walletAddress],
    queryFn: async (): Promise<SKRStatus> => {
      if (!walletAddress) return getTierFromBalance(0);

      try {
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const owner = new PublicKey(walletAddress);

        // Query only the SKR mint token accounts (not ALL token accounts)
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
          mint: SKR_MINT,
        });

        if (tokenAccounts.value.length === 0) return getTierFromBalance(0);

        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0;
        return getTierFromBalance(balance);
      } catch {
        // RPC failure - return 0 balance, query will retry
        return getTierFromBalance(0);
      }
    },
    enabled: !!walletAddress,
    staleTime: 60000,
    retry: 2,
  });
}

export { TIERS };
