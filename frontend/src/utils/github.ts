/**
 * Helpers for constructing verified GitHub source links strictly from frozen contract fields.
 * Never accepts caller-entered arbitrary evidence URLs.
 */

import { isValidCommitSha, isValidSafePath, isValidOwnerRepo } from './validation';

export function getGitHubCommitUrl(owner: string, repo: string, sha: string): string | null {
  if (!isValidOwnerRepo(owner, repo) || !isValidCommitSha(sha)) {
    return null;
  }
  return `https://github.com/${owner}/${repo}/commit/${sha.toLowerCase()}`;
}

export function getGitHubRawUrl(owner: string, repo: string, sha: string, path: string): string | null {
  if (!isValidOwnerRepo(owner, repo) || !isValidCommitSha(sha) || !isValidSafePath(path)) {
    return null;
  }
  return `https://raw.githubusercontent.com/${owner}/${repo}/${sha.toLowerCase()}/${path}`;
}

export function getGitHubApiCommitUrl(owner: string, repo: string, sha: string): string | null {
  if (!isValidOwnerRepo(owner, repo) || !isValidCommitSha(sha)) {
    return null;
  }
  return `https://api.github.com/repos/${owner}/${repo}/commits/${sha.toLowerCase()}`;
}

export function getExplorerTxUrl(txHash: string): string {
  return `https://explorer-studio.genlayer.com/tx/${txHash.toLowerCase()}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `https://explorer-studio.genlayer.com/address/${address.toLowerCase()}`;
}
