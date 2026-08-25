import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  formatSha,
  formatTimestamp,
  formatCoverageBps,
  formatCooldownRemaining,
} from '../utils/formatters';

describe('Formatters Utilities', () => {
  it('formats addresses with ellipsis', () => {
    expect(formatAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
    expect(formatAddress('short')).toBe('short');
    expect(formatAddress('')).toBe('');
  });

  it('formats sha hashes', () => {
    expect(formatSha('e424bfade424bfade424bfad', 8)).toBe('e424bfad');
    expect(formatSha('short', 8)).toBe('short');
  });

  it('formats timestamps', () => {
    const timestampResult = formatTimestamp(1700000000);
    expect(timestampResult.formatted).not.toBe('-');
    expect(formatTimestamp(0).formatted).toBe('-');
  });

  it('formats coverage bps into percentage', () => {
    expect(formatCoverageBps(10000)).toBe('100.00%');
    expect(formatCoverageBps(9550)).toBe('95.50%');
    expect(formatCoverageBps(0)).toBe('0.00%');
    expect(formatCoverageBps(9550, true)).toBe('95.50% (9550 bps)');
  });

  it('formats cooldown remaining in seconds', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const futureSec = nowSec - 595; // 5 seconds remaining out of 600s cooldown
    const res = formatCooldownRemaining(futureSec, 600);
    expect(res.isCoolingDown).toBe(true);
    expect(res.remainingSeconds).toBe(5);
    expect(res.remainingFormatted).toBe('5s');

    const pastSec = nowSec - 700;
    const resPast = formatCooldownRemaining(pastSec, 600);
    expect(resPast.isCoolingDown).toBe(false);
    expect(resPast.remainingFormatted).toBe('Ready');
  });
});
