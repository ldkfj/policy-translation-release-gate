import { describe, it, expect } from 'vitest';
import {
  getGitHubCommitUrl,
  getGitHubRawUrl,
  getGitHubApiCommitUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '../utils/github';

describe('GitHub & Explorer URL Utilities', () => {
  it('generates correct GitHub commit URL', () => {
    const url = getGitHubCommitUrl('acme', 'policies', 'e424bfade424bfade424bfade424bfade424bfad');
    expect(url).toBe('https://github.com/acme/policies/commit/e424bfade424bfade424bfade424bfade424bfad');
  });

  it('generates correct GitHub raw content URL', () => {
    const url = getGitHubRawUrl('acme', 'policies', 'e424bfade424bfade424bfade424bfade424bfad', 'terms/privacy.md');
    expect(url).toBe('https://raw.githubusercontent.com/acme/policies/e424bfade424bfade424bfade424bfade424bfad/terms/privacy.md');
  });

  it('generates correct GitHub API commit URL', () => {
    const url = getGitHubApiCommitUrl('acme', 'policies', 'e424bfade424bfade424bfade424bfade424bfad');
    expect(url).toBe('https://api.github.com/repos/acme/policies/commits/e424bfade424bfade424bfade424bfade424bfad');
  });

  it('generates correct Studionet Explorer URLs', () => {
    expect(getExplorerTxUrl('0xabcdef')).toBe('https://explorer-studio.genlayer.com/tx/0xabcdef');
    expect(getExplorerAddressUrl('0x123456')).toBe('https://explorer-studio.genlayer.com/address/0x123456');
  });
});
