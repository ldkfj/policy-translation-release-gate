import { describe, it, expect } from 'vitest';
import {
  isValidAddress,
  isValidCommitSha,
  isValidDigest,
  isValidSafePath,
  isValidLocale,
  isValidNamespace,
  isValidClientNonce,
  isValidOwnerRepo,
  isValidSectionId,
  isValidObjectionReason,
  generateClientNonce,
} from '../utils/validation';

describe('Validation Utilities', () => {
  describe('isValidAddress', () => {
    it('accepts valid 20-byte 0x hex addresses', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('0x1234')).toBe(false);
      expect(isValidAddress('1234567890123456789012345678901234567890')).toBe(false);
      expect(isValidAddress('0xZZZZ567890123456789012345678901234567890')).toBe(false);
      expect(isValidAddress('0x123456789012345678901234567890123456789012')).toBe(false);
      expect(isValidAddress(null)).toBe(false);
      expect(isValidAddress(undefined)).toBe(false);
    });
  });

  describe('isValidCommitSha', () => {
    it('accepts 40-character hex commit hashes', () => {
      expect(isValidCommitSha('e424bfade424bfade424bfade424bfade424bfad')).toBe(true);
      expect(isValidCommitSha('E424BFADE424BFADE424BFADE424BFADE424BFAD')).toBe(true);
    });

    it('rejects invalid commit hashes', () => {
      expect(isValidCommitSha('')).toBe(false);
      expect(isValidCommitSha('e424bfad')).toBe(false);
      expect(isValidCommitSha('e424bfade424bfade424bfade424bfade424bfaZ')).toBe(false);
      expect(isValidCommitSha('e424bfade424bfade424bfade424bfade424bfad123')).toBe(false);
    });
  });

  describe('isValidDigest', () => {
    it('accepts 64-character hex SHA-256 digests', () => {
      expect(isValidDigest('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8')).toBe(true);
      expect(isValidDigest('0'.repeat(64))).toBe(true);
    });

    it('rejects invalid digests', () => {
      expect(isValidDigest('')).toBe(false);
      expect(isValidDigest('0'.repeat(63))).toBe(false);
      expect(isValidDigest('0'.repeat(65))).toBe(false);
      expect(isValidDigest('G'.repeat(64))).toBe(false);
    });
  });

  describe('isValidSafePath', () => {
    it('accepts valid relative policy paths', () => {
      expect(isValidSafePath('policy.md')).toBe(true);
      expect(isValidSafePath('terms/privacy.md')).toBe(true);
      expect(isValidSafePath('i18n/es/policy.txt')).toBe(true);
      expect(isValidSafePath('policies/v1/user_agreement.markdown')).toBe(true);
    });

    it('rejects unsafe paths with directory traversal or absolute roots', () => {
      expect(isValidSafePath('/policy.md')).toBe(false);
      expect(isValidSafePath('../secret.md')).toBe(false);
      expect(isValidSafePath('terms/../../secret.md')).toBe(false);
      expect(isValidSafePath('policy\0.md')).toBe(false);
      expect(isValidSafePath('')).toBe(false);
    });
  });

  describe('isValidLocale', () => {
    it('accepts standard BCP-47 locale tags', () => {
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('es')).toBe(true);
      expect(isValidLocale('zh-CN')).toBe(true);
      expect(isValidLocale('pt-BR')).toBe(true);
      expect(isValidLocale('es-419')).toBe(true);
      expect(isValidLocale('en-US')).toBe(true);
    });

    it('rejects invalid locale tags', () => {
      expect(isValidLocale('')).toBe(false);
      expect(isValidLocale('en_US')).toBe(false);
      expect(isValidLocale('invalid!locale')).toBe(false);
      expect(isValidLocale('a'.repeat(40))).toBe(false);
    });
  });

  describe('isValidNamespace', () => {
    it('accepts valid namespace identifiers', () => {
      expect(isValidNamespace('web-portal')).toBe(true);
      expect(isValidNamespace('mobile_app_ios')).toBe(true);
      expect(isValidNamespace('api-v1')).toBe(true);
      expect(isValidNamespace('default')).toBe(true);
    });

    it('rejects invalid namespaces', () => {
      expect(isValidNamespace('')).toBe(false);
      expect(isValidNamespace('invalid namespace')).toBe(false);
      expect(isValidNamespace('ns@domain')).toBe(false);
      expect(isValidNamespace('x'.repeat(65))).toBe(false);
    });
  });

  describe('isValidClientNonce & generateClientNonce', () => {
    it('generates and validates client nonces', () => {
      const nonce = generateClientNonce();
      expect(isValidClientNonce(nonce)).toBe(true);
    });

    it('rejects invalid nonces', () => {
      expect(isValidClientNonce('')).toBe(false);
      expect(isValidClientNonce('short')).toBe(false);
      expect(isValidClientNonce('invalid nonce spaces!')).toBe(false);
    });
  });

  describe('isValidOwnerRepo', () => {
    it('accepts valid GitHub owner and repository names', () => {
      expect(isValidOwnerRepo('acme-corp', 'policies')).toBe(true);
      expect(isValidOwnerRepo('john_doe', 'terms.service')).toBe(true);
    });

    it('rejects invalid owner or repo names', () => {
      expect(isValidOwnerRepo('', 'repo')).toBe(false);
      expect(isValidOwnerRepo('owner', '')).toBe(false);
      expect(isValidOwnerRepo('owner/bad', 'repo')).toBe(false);
      expect(isValidOwnerRepo('owner', 'repo/bad')).toBe(false);
    });
  });

  describe('isValidSectionId', () => {
    it('accepts valid section identifiers', () => {
      expect(isValidSectionId('sec_intro')).toBe(true);
      expect(isValidSectionId('section-1.2')).toBe(true);
      expect(isValidSectionId('privacy_terms_v2')).toBe(true);
    });

    it('rejects invalid section IDs', () => {
      expect(isValidSectionId('')).toBe(false);
      expect(isValidSectionId('sec intro')).toBe(false);
      expect(isValidSectionId('s'.repeat(65))).toBe(false);
    });
  });

  describe('isValidObjectionReason', () => {
    it('accepts reasons between 1 and 500 characters matching contract constraints', () => {
      expect(isValidObjectionReason('X')).toBe(true);
      expect(isValidObjectionReason('Material discrepancy in section 3.')).toBe(true);
      expect(isValidObjectionReason('A'.repeat(500))).toBe(true);
    });

    it('rejects reasons outside character bounds', () => {
      expect(isValidObjectionReason('')).toBe(false);
      expect(isValidObjectionReason('   ')).toBe(false);
      expect(isValidObjectionReason('A'.repeat(501))).toBe(false);
      expect(isValidObjectionReason(null)).toBe(false);
    });
  });
});
