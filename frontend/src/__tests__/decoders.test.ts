import { describe, it, expect } from 'vitest';
import {
  toStrictU32,
  toStrictU64,
  toStrictString,
  toStrictBoolean,
  DecoderError,
  VALID_DIMENSIONAL_STATUSES,
  decodePublisherProfile,
  decodeActiveCanonical,
  decodeCanonicalRevision,
  decodeTranslationCandidate,
  decodeAssessment,
  decodeObjectionRecord,
  decodeConsumerBinding,
  decodeEffectiveLocale,
  decodeContractEvent,
  decodePaginatedResponse,
} from '../utils/decoders';

describe('Decoders and Type Boundary', () => {
  describe('Strict Primitive Decoders', () => {
    it('toStrictU32 parses valid numbers and bigints', () => {
      expect(toStrictU32(0, 'f')).toBe(0);
      expect(toStrictU32(42, 'f')).toBe(42);
      expect(toStrictU32(4294967295, 'f')).toBe(4294967295);
      expect(toStrictU32(BigInt(100), 'f')).toBe(100);
      expect(toStrictU32('123', 'f')).toBe(123);
    });

    it('toStrictU32 rejects negative numbers, floats, out-of-range numbers, and non-numbers', () => {
      expect(() => toStrictU32(-1, 'f')).toThrow(DecoderError);
      expect(() => toStrictU32(3.14, 'f')).toThrow(DecoderError);
      expect(() => toStrictU32(4294967296, 'f')).toThrow(DecoderError);
      expect(() => toStrictU32('invalid', 'f')).toThrow(DecoderError);
      expect(() => toStrictU32(null, 'f')).toThrow(DecoderError);
      expect(() => toStrictU32(undefined, 'f')).toThrow(DecoderError);
      expect(() => toStrictU32({}, 'f')).toThrow(DecoderError);
    });

    it('toStrictU64 parses valid numbers and bigints', () => {
      expect(toStrictU64(0, 'f')).toBe('0');
      expect(toStrictU64(1700000000, 'f')).toBe('1700000000');
      expect(toStrictU64(BigInt(1700000000), 'f')).toBe('1700000000');
      expect(toStrictU64('1700000000', 'f')).toBe('1700000000');
      expect(toStrictU64('18446744073709551615', 'f')).toBe('18446744073709551615');
    });

    it('toStrictU64 rejects negative numbers and non-integers', () => {
      expect(() => toStrictU64(-10, 'f')).toThrow(DecoderError);
      expect(() => toStrictU64(12.34, 'f')).toThrow(DecoderError);
      expect(() => toStrictU64(null, 'f')).toThrow(DecoderError);
    });

    it('accepts the contract dimensional NOT_APPLICABLE status', () => {
      expect(VALID_DIMENSIONAL_STATUSES.has('NOT_APPLICABLE')).toBe(true);
    });

    it('toStrictString parses valid strings', () => {
      expect(toStrictString('hello', 'f')).toBe('hello');
      expect(toStrictString('  trimmed  ', 'f')).toBe('  trimmed  ');
    });

    it('toStrictString rejects non-strings', () => {
      expect(() => toStrictString(123, 'f')).toThrow(DecoderError);
      expect(() => toStrictString(null, 'f')).toThrow(DecoderError);
      expect(() => toStrictString(undefined, 'f')).toThrow(DecoderError);
      expect(() => toStrictString({}, 'f')).toThrow(DecoderError);
    });

    it('toStrictBoolean parses booleans correctly', () => {
      expect(toStrictBoolean(true, 'f')).toBe(true);
      expect(toStrictBoolean(false, 'f')).toBe(false);
      expect(() => toStrictBoolean('true', 'f')).toThrow(DecoderError);
      expect(() => toStrictBoolean('false', 'f')).toThrow(DecoderError);
    });

    it('toStrictBoolean rejects non-boolean values', () => {
      expect(() => toStrictBoolean(1, 'f')).toThrow(DecoderError);
      expect(() => toStrictBoolean('yes', 'f')).toThrow(DecoderError);
      expect(() => toStrictBoolean(null, 'f')).toThrow(DecoderError);
    });
  });

  describe('decodePublisherProfile', () => {
    it('decodes valid profile record', () => {
      const raw = {
        initialized: true,
        owner: 'acme',
        repo: 'policies',
        admin: '0x1234567890123456789012345678901234567890',
        policy_version: 1,
        active_canonical_id: 1,
        canonical_count: 2,
        candidate_count: 3,
        objection_count: 0,
        event_count: 5,
      };
      const result = decodePublisherProfile(raw);
      expect(result).not.toBeNull();
      expect(result.initialized).toBe(true);
      expect(result.owner).toBe('acme');
      expect(result.repo).toBe('policies');
      expect(result.admin).toBe('0x1234567890123456789012345678901234567890');
      expect(result.policy_version).toBe(1);
    });

    it('throws DecoderError on invalid or empty payload', () => {
      expect(() => decodePublisherProfile(null)).toThrow(DecoderError);
      expect(() => decodePublisherProfile('not-an-object')).toThrow(DecoderError);
    });
  });

  describe('decodeActiveCanonical', () => {
    it('decodes valid active canonical summary', () => {
      const raw = {
        id: 1,
        commit: 'e424bfade424bfade424bfade424bfade424bfad',
        path: 'policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        language: 'en',
        state: 'ACTIVE',
        created_at: 1700000000,
      };
      const result = decodeActiveCanonical(raw);
      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.is_active).toBe(true);
    });
  });

  describe('decodeCanonicalRevision', () => {
    it('decodes canonical revision record and validates state', () => {
      const raw = {
        id: 2,
        commit: 'e424bfade424bfade424bfade424bfade424bfad',
        path: 'policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        language: 'en',
        state: 'ACTIVE',
        created_at: 1700000000,
      };
      const result = decodeCanonicalRevision(raw);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(2);
      expect(result?.state).toBe('ACTIVE');
    });

    it('throws DecoderError on invalid canonical state', () => {
      const raw = {
        id: 2,
        commit: 'e424bfade424bfade424bfade424bfade424bfad',
        path: 'policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        language: 'en',
        state: 'INVALID_STATE',
        created_at: 1700000000,
      };
      expect(() => decodeCanonicalRevision(raw)).toThrow(DecoderError);
    });
  });

  describe('decodeTranslationCandidate', () => {
    it('decodes translation candidate with state enum', () => {
      const raw = {
        id: 10,
        canonical_id: 2,
        locale: 'es',
        localizer: '0x1234567890123456789012345678901234567890',
        commit: '4ac37ed34ac37ed34ac37ed34ac37ed34ac37ed3',
        path: 'i18n/es/policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        state: 'FROZEN',
        attempts: 0,
        last_assessed_at: 0,
        created_at: 1700000000,
        has_assessment: false,
      };
      const result = decodeTranslationCandidate(raw);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(10);
      expect(result?.state).toBe('FROZEN');
      expect(result?.locale).toBe('es');
    });

    it('throws DecoderError on invalid candidate state', () => {
      const raw = {
        id: 10,
        canonical_id: 2,
        locale: 'es',
        localizer: '0x1234567890123456789012345678901234567890',
        commit: '4ac37ed34ac37ed34ac37ed34ac37ed34ac37ed3',
        path: 'i18n/es/policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        state: 'BAD_STATE',
        attempts: 0,
        last_assessed_at: 0,
        created_at: 1700000000,
        has_assessment: false,
      };
      expect(() => decodeTranslationCandidate(raw)).toThrow(DecoderError);
    });
  });

  describe('decodeAssessment', () => {
    it('strictly decodes all 17 schema fields and validates consensus outcomes', () => {
      const raw = {
        canonical_status: 'AVAILABLE',
        translation_status: 'AVAILABLE',
        canonical_commit: 'e424bfade424bfade424bfade424bfade424bfad',
        translation_commit: '4ac37ed34ac37ed34ac37ed34ac37ed34ac37ed3',
        canonical_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        translation_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        canonical_section_ids: ['sec_1', 'sec_2'],
        translation_section_ids: ['sec_1', 'sec_2'],
        matched_section_count: 2,
        canonical_section_count: 2,
        translation_section_count: 2,
        coverage_bps: 10000,
        section_results: [
          {
            section_id: 'sec_1',
            rights: 'EQUIVALENT',
            obligations: 'EQUIVALENT',
            prohibitions: 'EQUIVALENT',
            exceptions: 'EQUIVALENT',
            scope: 'EQUIVALENT',
            thresholds: 'EQUIVALENT',
            deadlines: 'EQUIVALENT',
          },
        ],
        changed_dimensions: [],
        outcome: 'MATERIALLY_EQUIVALENT',
        fingerprint: 'consensus_fingerprint_hash_123',
        reason: 'Consensus reached with 100% semantic equivalence.',
      };

      const result = decodeAssessment(raw);
      expect(result).not.toBeNull();
      expect(result?.outcome).toBe('MATERIALLY_EQUIVALENT');
      expect(result?.coverage_bps).toBe(10000);
      expect(result?.section_results.length).toBe(1);
      expect(result?.section_results[0].rights).toBe('EQUIVALENT');
    });

    it('throws DecoderError on invalid outcome', () => {
      const raw = {
        outcome: 'UNKNOWN_OUTCOME',
        reason: 'Failed consensus',
      };
      expect(() => decodeAssessment(raw)).toThrow(DecoderError);
    });

    it('throws DecoderError on invalid section dimensional status', () => {
      const raw = {
        canonical_status: 'AVAILABLE',
        translation_status: 'AVAILABLE',
        canonical_commit: 'e424bfade424bfade424bfade424bfade424bfad',
        translation_commit: '4ac37ed34ac37ed34ac37ed34ac37ed34ac37ed3',
        canonical_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        translation_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        canonical_section_ids: ['sec_1'],
        translation_section_ids: ['sec_1'],
        matched_section_count: 1,
        canonical_section_count: 1,
        translation_section_count: 1,
        coverage_bps: 10000,
        section_results: [
          {
            section_id: 'sec_1',
            rights: 'INVALID_STATUS',
            obligations: 'EQUIVALENT',
            prohibitions: 'EQUIVALENT',
            exceptions: 'EQUIVALENT',
            scope: 'EQUIVALENT',
            thresholds: 'EQUIVALENT',
            deadlines: 'EQUIVALENT',
          },
        ],
        changed_dimensions: [],
        outcome: 'MATERIALLY_EQUIVALENT',
        fingerprint: 'fp',
        reason: 'reason',
      };
      expect(() => decodeAssessment(raw)).toThrow(DecoderError);
    });
  });

  describe('decodeObjectionRecord & decodeConsumerBinding', () => {
    it('decodes objection record properly with objection_digest', () => {
      const raw = {
        id: 1,
        candidate_id: 5,
        observer: '0x1234567890123456789012345678901234567890',
        objection_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        reason: 'Missing arbitration clause in Spanish translation.',
        created_at: 1700000000,
      };
      const result = decodeObjectionRecord(raw);
      expect(result.candidate_id).toBe(5);
      expect(result.objection_digest).toBe('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
      expect(result.reason).toContain('arbitration');
    });

    it('decodes consumer binding properly with namespace and locale', () => {
      const raw = {
        exists: true,
        is_effective: true,
        namespace: 'web-portal',
        locale: 'es',
        candidate_id: 5,
        canonical_id: 2,
        candidate_state: 'PUBLISHED',
        bound_at: 1700000000,
      };
      const result = decodeConsumerBinding(raw);
      expect(result.exists).toBe(true);
      expect(result.namespace).toBe('web-portal');
      expect(result.locale).toBe('es');
      expect(result.candidate_id).toBe(5);
    });

    it('decodes effective locale record properly', () => {
      const raw = {
        is_effective: true,
        candidate_id: 5,
        canonical_id: 2,
        locale: 'es',
        commit: 'e424bfade424bfade424bfade424bfade424bfad',
        path: 'i18n/es/policy.md',
        digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        localizer: '0x1234567890123456789012345678901234567890',
      };
      const result = decodeEffectiveLocale(raw);
      expect(result.is_effective).toBe(true);
      expect(result.candidate_id).toBe(5);
      expect(result.localizer).toBe('0x1234567890123456789012345678901234567890');
    });

    it('decodes contract event properly', () => {
      const raw = {
        id: 1,
        event_type: 'CanonicalRegistered',
        payload: { id: 1, commit: 'e424bfad' },
        timestamp: 1700000000,
      };
      const result = decodeContractEvent(raw);
      expect(result.id).toBe(1);
      expect(result.event_type).toBe('CanonicalRegistered');
      expect((result.payload as Record<string, unknown> | null)?.id).toBe(1);
    });
  });

  describe('decodePaginatedResponse', () => {
    it('decodes paginated list with inner item decoder', () => {
      const raw = {
        items: [
          {
            id: 1,
            candidate_id: 1,
            observer: '0x1234567890123456789012345678901234567890',
            objection_digest: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
            reason: 'Objection reason test',
            created_at: 1700000000,
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      };

      const result = decodePaginatedResponse(raw, decodeObjectionRecord);
      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].candidate_id).toBe(1);
    });
  });
});
