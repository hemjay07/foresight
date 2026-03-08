export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatSOL(sol: number): string {
  if (!Number.isFinite(sol)) return '0';
  // Backend returns values already in SOL (not lamports)
  if (sol >= 1) return sol.toFixed(1);
  if (sol >= 0.01) return sol.toFixed(2);
  return sol.toFixed(3);
}

export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function timeUntil(date: Date | string): string {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
