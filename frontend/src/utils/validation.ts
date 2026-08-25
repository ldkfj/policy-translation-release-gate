/**
 * Strict input validation helpers matching contract-side constraints.
 * Mirroring contract checks before signing without replacing contract authority.
 */

export function isValidAddress(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^0x[0-9a-fA-F]{40}$/.test(val.trim());
}

export function isValidCommitSha(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-fA-F]{40}$/.test(val.trim());
}

export function isValidDigest(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-fA-F]{64}$/.test(val.trim());
}

export function isValidSafePath(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  if (val.includes('\0')) return false;
  const p = val.trim();
  if (!p || p.length > 255) return false;
  if (p.includes('\\') || p.includes('//') || p.includes('..') || p.includes('?') || p.includes('#') || p.includes(':')) {
    return false;
  }
  if (p.startsWith('/') || p.endsWith('/')) return false;
  const segments = p.split('/');
  for (const seg of segments) {
    if (!seg || seg === '.' || seg === '..') return false;
  }
  return true;
}

export function isValidLocale(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const l = val.trim();
  if (l.length < 2 || l.length > 16) return false;
  if (l.startsWith('-') || l.endsWith('-')) return false;
  return /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(l);
}

export function isValidNamespace(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const ns = val.trim();
  if (!ns || ns.length > 64) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(ns);
}

export function isValidClientNonce(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const n = val.trim();
  if (n.length < 8 || n.length > 64) return false;
  return /^[a-zA-Z0-9_.:-]+$/.test(n);
}

export function isValidOwnerRepo(owner: unknown, repo: unknown): boolean {
  if (typeof owner !== 'string' || typeof repo !== 'string') return false;
  const o = owner.trim();
  const r = repo.trim();
  if (!o || o.length > 39) return false;
  if (o.startsWith('-') || o.endsWith('-') || o.includes(' ')) return false;
  if (!/^[a-zA-Z0-9._-]+$/.test(o)) return false;

  if (!r || r.length > 100) return false;
  if (r === '.' || r === '..' || r.endsWith('.git') || r.includes(' ')) return false;
  if (!/^[a-zA-Z0-9._-]+$/.test(r)) return false;

  return true;
}

export function isValidSectionId(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (!s || s.length > 64) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(s);
}

export function isValidObjectionReason(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const r = val.trim();
  return r.length >= 1 && r.length <= 500;
}

export function generateClientNonce(prefix: string = 'nonce'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`;
}
