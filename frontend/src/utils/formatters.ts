/**
 * Accessible formatting helpers for timestamps, hashes, addresses, and metrics.
 */

export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatSha(sha: string, chars: number = 7): string {
  if (!sha) return '';
  if (sha.length <= chars) return sha;
  return sha.substring(0, chars);
}

export function formatTimestamp(timestamp: number): { formatted: string; iso: string; raw: number } {
  if (!timestamp || timestamp <= 0) {
    return { formatted: '-', iso: '', raw: timestamp };
  }
  // If timestamp is in seconds, convert to ms
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  return {
    formatted: date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    iso: date.toISOString(),
    raw: timestamp,
  };
}

export function formatCoverageBps(bps: number, includeBps: boolean = false): string {
  const pct = (bps / 100).toFixed(2);
  return includeBps ? `${pct}% (${bps} bps)` : `${pct}%`;
}

export function formatCooldownRemaining(lastAssessedAt: number, cooldownSeconds: number = 600): {
  isCoolingDown: boolean;
  remainingSeconds: number;
  remainingFormatted: string;
} {
  if (!lastAssessedAt || lastAssessedAt <= 0) {
    return { isCoolingDown: false, remainingSeconds: 0, remainingFormatted: 'Ready' };
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const lastSec = lastAssessedAt > 1e12 ? Math.floor(lastAssessedAt / 1000) : lastAssessedAt;
  const elapsed = nowSec - lastSec;
  const remaining = Math.max(0, cooldownSeconds - elapsed);
  if (remaining <= 0) {
    return { isCoolingDown: false, remainingSeconds: 0, remainingFormatted: 'Ready' };
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return {
    isCoolingDown: true,
    remainingSeconds: remaining,
    remainingFormatted: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
  };
}
