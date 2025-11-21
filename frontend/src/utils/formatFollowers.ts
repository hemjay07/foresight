/**
 * Format follower count with K for thousands, M for millions
 * @param count - Raw follower count
 * @returns Formatted string like "1.2K" or "3.5M"
 */
export function formatFollowerCount(count: number | undefined | null): string {
  if (!count || count === 0) return '0';

  if (count >= 1_000_000) {
    // Format millions: 1,234,567 -> "1.2M"
    const millions = count / 1_000_000;
    return `${millions.toFixed(1)}M`;
  } else if (count >= 1_000) {
    // Format thousands: 123,456 -> "123.5K"
    const thousands = count / 1_000;
    return `${thousands.toFixed(1)}K`;
  } else {
    // Less than 1,000: show full number
    return count.toString();
  }
}
