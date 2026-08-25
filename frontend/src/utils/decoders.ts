/**
 * Runtime type decoders and validation boundaries.
 * Strictly verifies schema and field types returned from GenLayer Studionet contract views.
 * Rejects unsafe integers, malformed schemas, and fabricated fallbacks.
 */

import {
  PublisherProfile,
  ActiveCanonicalSummary,
  CanonicalRevision,
  TranslationCandidate,
  Assessment,
  AssessmentOutcome,
  SourceStatus,
  DimensionStatus,
  SectionResult,
  ObjectionRecord,
  ConsumerBinding,
  EffectiveLocale,
  NonceResult,
  ContractEvent,
  PaginatedResponse,
  CanonicalState,
  CandidateState,
} from '../types/contract';

export class DecoderError extends Error {
  constructor(message: string) {
    super(`[DecoderError] ${message}`);
    this.name = 'DecoderError';
  }
}

export const VALID_OUTCOMES: ReadonlySet<AssessmentOutcome> = new Set([
  'MATERIALLY_EQUIVALENT',
  'OBLIGATION_DRIFT',
  'RIGHT_OR_EXCEPTION_LOSS',
  'SCOPE_OR_THRESHOLD_DRIFT',
  'NOT_COMPARABLE',
  'UNRESOLVED',
]);

export const VALID_SOURCE_STATUSES: ReadonlySet<SourceStatus> = new Set([
  'AVAILABLE',
  'MISSING',
  'UNAVAILABLE',
  'INVALID',
]);

export const VALID_DIMENSIONAL_STATUSES: ReadonlySet<DimensionStatus> = new Set([
  'EQUIVALENT',
  'CHANGED',
  'LOST',
  'NOT_APPLICABLE',
]);

export const VALID_CANONICAL_STATES: ReadonlySet<CanonicalState> = new Set([
  'REGISTERED',
  'ACTIVE',
  'SUPERSEDED',
]);

export const VALID_CANDIDATE_STATES: ReadonlySet<CandidateState> = new Set([
  'DRAFT',
  'FROZEN',
  'ACCEPTED',
  'REVISION_REQUIRED',
  'HOLD_UNRESOLVED',
  'PUBLISHED',
  'STALE_BY_CANONICAL_REVISION',
]);

export function toStrictU32(val: unknown, fieldName: string): number {
  if (typeof val === 'number') {
    if (!Number.isInteger(val) || val < 0 || val > 4294967295) {
      throw new DecoderError(`Field '${fieldName}' must be an integer between 0 and 4294967295. Received: ${val}`);
    }
    return val;
  }
  if (typeof val === 'bigint') {
    if (val < 0n || val > 4294967295n) {
      throw new DecoderError(`Field '${fieldName}' bigint out of u32 bounds: ${val.toString()}`);
    }
    return Number(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isInteger(num) && num >= 0 && num <= 4294967295) {
        return num;
      }
    }
  }
  throw new DecoderError(`Field '${fieldName}' is not a valid u32. Received: ${String(val)}`);
}

export function toStrictU64(val: unknown, fieldName: string): string {
  const max = 18446744073709551615n;
  if (typeof val === 'number') {
    if (!Number.isInteger(val) || val < 0 || !Number.isSafeInteger(val)) {
      throw new DecoderError(`Field '${fieldName}' must be a non-negative safe integer number. Received: ${val}`);
    }
    return String(val);
  }
  if (typeof val === 'bigint') {
    if (val < 0n || val > max) {
      throw new DecoderError(`Field '${fieldName}' bigint exceeds u64 range: ${val.toString()}`);
    }
    return val.toString();
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) {
      const b = BigInt(trimmed);
      if (b >= 0n && b <= max) {
        return b.toString();
      }
    }
  }
  throw new DecoderError(`Field '${fieldName}' is not a valid u64. Received: ${String(val)}`);
}

export function toStrictString(val: unknown, fieldName: string): string {
  if (typeof val === 'string') return val;
  throw new DecoderError(`Field '${fieldName}' must be a string. Received: ${typeof val}`);
}

export function toStrictBoolean(val: unknown, fieldName: string): boolean {
  if (typeof val === 'boolean') return val;
  throw new DecoderError(`Field '${fieldName}' must be a boolean. Received: ${typeof val}`);
}

export function safeJsonStringify(val: unknown): string {
  try {
    return JSON.stringify(val, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    return '{}';
  }
}

export function decodePublisherProfile(raw: unknown): PublisherProfile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('PublisherProfile must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  return {
    owner: toStrictString(obj.owner, 'owner'),
    repo: toStrictString(obj.repo, 'repo'),
    admin: toStrictString(obj.admin, 'admin'),
    policy_version: toStrictU32(obj.policy_version, 'policy_version'),
    initialized: toStrictBoolean(obj.initialized, 'initialized'),
    active_canonical_id: toStrictU32(obj.active_canonical_id, 'active_canonical_id'),
    canonical_count: toStrictU32(obj.canonical_count, 'canonical_count'),
    candidate_count: toStrictU32(obj.candidate_count, 'candidate_count'),
    objection_count: toStrictU32(obj.objection_count, 'objection_count'),
    event_count: toStrictU32(obj.event_count, 'event_count'),
  };
}

export function decodeActiveCanonical(raw: unknown): ActiveCanonicalSummary {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('ActiveCanonical must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  // Documented empty result when no active canonical is set: {}
  if (Object.keys(obj).length === 0 || obj.id === undefined) {
    return {
      is_active: false,
      id: 0,
      commit: '',
      path: '',
      digest: '',
      language: 'en',
      state: 'REGISTERED',
      created_at: '0',
    };
  }

  const stateStr = toStrictString(obj.state, 'state') as CanonicalState;
  if (!VALID_CANONICAL_STATES.has(stateStr)) {
    throw new DecoderError(`Invalid canonical state '${stateStr}' in ActiveCanonical`);
  }

  return {
    is_active: stateStr === 'ACTIVE',
    id: toStrictU32(obj.id, 'id'),
    commit: toStrictString(obj.commit, 'commit'),
    path: toStrictString(obj.path, 'path'),
    digest: toStrictString(obj.digest, 'digest'),
    language: toStrictString(obj.language, 'language'),
    state: stateStr,
    created_at: toStrictU64(obj.created_at, 'created_at'),
  };
}

export function decodeCanonicalRevision(raw: unknown): CanonicalRevision | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('CanonicalRevision must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  // Documented empty result: {}
  if (Object.keys(obj).length === 0 || obj.id === undefined) {
    return null;
  }

  const stateStr = toStrictString(obj.state, 'state') as CanonicalState;
  if (!VALID_CANONICAL_STATES.has(stateStr)) {
    throw new DecoderError(`Invalid canonical state '${stateStr}' in CanonicalRevision`);
  }

  return {
    id: toStrictU32(obj.id, 'id'),
    commit: toStrictString(obj.commit, 'commit'),
    path: toStrictString(obj.path, 'path'),
    digest: toStrictString(obj.digest, 'digest'),
    language: toStrictString(obj.language, 'language'),
    state: stateStr,
    created_at: toStrictU64(obj.created_at, 'created_at'),
  };
}

export function decodeTranslationCandidate(raw: unknown): TranslationCandidate | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('TranslationCandidate must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  // Documented empty result: {}
  if (Object.keys(obj).length === 0 || obj.id === undefined) {
    return null;
  }

  const stateStr = toStrictString(obj.state, 'state') as CandidateState;
  if (!VALID_CANDIDATE_STATES.has(stateStr)) {
    throw new DecoderError(`Invalid candidate state '${stateStr}' in TranslationCandidate`);
  }

  return {
    id: toStrictU32(obj.id, 'id'),
    canonical_id: toStrictU32(obj.canonical_id, 'canonical_id'),
    locale: toStrictString(obj.locale, 'locale'),
    localizer: toStrictString(obj.localizer, 'localizer'),
    commit: toStrictString(obj.commit, 'commit'),
    path: toStrictString(obj.path, 'path'),
    digest: toStrictString(obj.digest, 'digest'),
    state: stateStr,
    attempts: toStrictU32(obj.attempts, 'attempts'),
    last_assessed_at: toStrictU64(obj.last_assessed_at, 'last_assessed_at'),
    created_at: toStrictU64(obj.created_at, 'created_at'),
    has_assessment: toStrictBoolean(obj.has_assessment, 'has_assessment'),
  };
}

export function decodeSectionResult(raw: unknown): SectionResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('SectionResult must be a non-null object');
  }
  const s = raw as Record<string, unknown>;
  const section_id = toStrictString(s.section_id, 'section_id');

  const checkDim = (dim: string): DimensionStatus => {
    const val = toStrictString(s[dim], `section_result.${dim}`) as DimensionStatus;
    if (!VALID_DIMENSIONAL_STATUSES.has(val)) {
      throw new DecoderError(`Invalid dimensional status '${val}' for section '${section_id}' dimension '${dim}'`);
    }
    return val;
  };

  return {
    section_id,
    rights: checkDim('rights'),
    obligations: checkDim('obligations'),
    prohibitions: checkDim('prohibitions'),
    exceptions: checkDim('exceptions'),
    scope: checkDim('scope'),
    thresholds: checkDim('thresholds'),
    deadlines: checkDim('deadlines'),
  };
}

export function decodeAssessment(raw: unknown): Assessment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('Assessment must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  // Documented empty result: {}
  if (Object.keys(obj).length === 0 || obj.outcome === undefined) {
    return null;
  }

  const outcomeStr = toStrictString(obj.outcome, 'outcome') as AssessmentOutcome;
  if (!VALID_OUTCOMES.has(outcomeStr)) {
    throw new DecoderError(`Invalid outcome '${outcomeStr}' in Assessment`);
  }

  const canonicalStatusStr = toStrictString(obj.canonical_status, 'canonical_status') as SourceStatus;
  if (!VALID_SOURCE_STATUSES.has(canonicalStatusStr)) {
    throw new DecoderError(`Invalid canonical_status '${canonicalStatusStr}' in Assessment`);
  }

  const translationStatusStr = toStrictString(obj.translation_status, 'translation_status') as SourceStatus;
  if (!VALID_SOURCE_STATUSES.has(translationStatusStr)) {
    throw new DecoderError(`Invalid translation_status '${translationStatusStr}' in Assessment`);
  }

  if (!Array.isArray(obj.section_results)) {
    throw new DecoderError('Assessment section_results must be an array');
  }
  const section_results = obj.section_results.map(decodeSectionResult);

  if (!Array.isArray(obj.canonical_section_ids)) {
    throw new DecoderError('Assessment canonical_section_ids must be an array');
  }
  const canonical_section_ids = obj.canonical_section_ids.map((x) => toStrictString(x, 'canonical_section_id'));

  if (!Array.isArray(obj.translation_section_ids)) {
    throw new DecoderError('Assessment translation_section_ids must be an array');
  }
  const translation_section_ids = obj.translation_section_ids.map((x) => toStrictString(x, 'translation_section_id'));

  if (!Array.isArray(obj.changed_dimensions)) {
    throw new DecoderError('Assessment changed_dimensions must be an array');
  }
  const changed_dimensions = obj.changed_dimensions.map((x) => toStrictString(x, 'changed_dimension'));

  const candidateId = obj.candidate_id !== undefined ? toStrictU32(obj.candidate_id, 'candidate_id') : undefined;

  return {
    candidate_id: candidateId,
    canonical_status: canonicalStatusStr,
    translation_status: translationStatusStr,
    canonical_commit: toStrictString(obj.canonical_commit, 'canonical_commit'),
    translation_commit: toStrictString(obj.translation_commit, 'translation_commit'),
    canonical_digest: toStrictString(obj.canonical_digest, 'canonical_digest'),
    translation_digest: toStrictString(obj.translation_digest, 'translation_digest'),
    canonical_section_ids,
    translation_section_ids,
    matched_section_count: toStrictU32(obj.matched_section_count, 'matched_section_count'),
    canonical_section_count: toStrictU32(obj.canonical_section_count, 'canonical_section_count'),
    translation_section_count: toStrictU32(obj.translation_section_count, 'translation_section_count'),
    coverage_bps: toStrictU32(obj.coverage_bps, 'coverage_bps'),
    section_results,
    changed_dimensions,
    outcome: outcomeStr,
    fingerprint: toStrictString(obj.fingerprint, 'fingerprint'),
    reason: toStrictString(obj.reason, 'reason'),
  };
}

export function decodeObjectionRecord(raw: unknown): ObjectionRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('ObjectionRecord must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  const objectionDigest = typeof obj.objection_digest === 'string'
    ? obj.objection_digest
    : toStrictString(obj.digest, 'objection_digest');

  return {
    id: toStrictU32(obj.id, 'id'),
    candidate_id: toStrictU32(obj.candidate_id, 'candidate_id'),
    observer: toStrictString(obj.observer, 'observer'),
    objection_digest: objectionDigest,
    digest: objectionDigest,
    reason: toStrictString(obj.reason, 'reason'),
    created_at: toStrictU64(obj.created_at || obj.timestamp, 'created_at'),
  };
}

export function decodeConsumerBinding(raw: unknown): ConsumerBinding {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('ConsumerBinding must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  const exists = toStrictBoolean(obj.exists, 'exists');
  if (!exists) {
    return {
      exists: false,
      is_effective: false,
      namespace: typeof obj.namespace === 'string' ? obj.namespace : '',
      locale: typeof obj.locale === 'string' ? obj.locale : '',
      candidate_id: 0,
      canonical_id: 0,
      candidate_state: '',
      bound_at: '0',
    };
  }

  return {
    exists: true,
    is_effective: toStrictBoolean(obj.is_effective, 'is_effective'),
    namespace: toStrictString(obj.namespace, 'namespace'),
    locale: toStrictString(obj.locale, 'locale'),
    candidate_id: toStrictU32(obj.candidate_id, 'candidate_id'),
    canonical_id: toStrictU32(obj.canonical_id, 'canonical_id'),
    candidate_state: toStrictString(obj.candidate_state, 'candidate_state'),
    bound_at: toStrictU64(obj.bound_at, 'bound_at'),
  };
}

export function decodeEffectiveLocale(raw: unknown): EffectiveLocale {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('EffectiveLocale must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  const isEffective = toStrictBoolean(obj.is_effective, 'is_effective');
  if (!isEffective) {
    return {
      is_effective: false,
      candidate_id: 0,
      canonical_id: 0,
      locale: typeof obj.locale === 'string' ? obj.locale : '',
      commit: '',
      path: '',
      digest: '',
      localizer: '',
    };
  }

  return {
    is_effective: true,
    candidate_id: toStrictU32(obj.candidate_id, 'candidate_id'),
    canonical_id: toStrictU32(obj.canonical_id, 'canonical_id'),
    locale: toStrictString(obj.locale, 'locale'),
    commit: toStrictString(obj.commit, 'commit'),
    path: toStrictString(obj.path, 'path'),
    digest: toStrictString(obj.digest, 'digest'),
    localizer: toStrictString(obj.localizer, 'localizer'),
  };
}

export function decodeNonceResult(raw: unknown): NonceResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('NonceResult must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  const exists = toStrictBoolean(obj.exists, 'exists');
  if (!exists) {
    return {
      exists: false,
      entity_type: '',
      id: 0,
    };
  }

  const entityTypeStr = toStrictString(obj.entity_type, 'entity_type');
  if (entityTypeStr !== 'canonical' && entityTypeStr !== 'translation') {
    throw new DecoderError(`Invalid nonce entity_type '${entityTypeStr}'`);
  }

  return {
    exists: true,
    entity_type: entityTypeStr,
    id: toStrictU32(obj.id, 'id'),
  };
}

export function decodeContractEvent(raw: unknown): ContractEvent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('ContractEvent must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  let payload: Record<string, unknown> | null = null;
  let payloadJson = '';

  if (typeof obj.payload === 'object' && obj.payload !== null) {
    payload = obj.payload as Record<string, unknown>;
    payloadJson = safeJsonStringify(payload);
  } else if (typeof obj.payload_json === 'string') {
    payloadJson = obj.payload_json;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      payload = null;
    }
  }

  return {
    id: toStrictU32(obj.id, 'id'),
    event_type: toStrictString(obj.event_type, 'event_type'),
    payload_json: payloadJson,
    payload,
    timestamp: toStrictU64(obj.timestamp, 'timestamp'),
  };
}

export function decodePaginatedResponse<T>(
  raw: unknown,
  itemDecoder: (item: unknown) => T
): PaginatedResponse<T> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DecoderError('PaginatedResponse must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.items)) {
    throw new DecoderError('PaginatedResponse items must be an array');
  }

  const total = toStrictU32(obj.total, 'total');
  const offset = toStrictU32(obj.offset, 'offset');
  const limit = toStrictU32(obj.limit, 'limit');

  // Reject malformed rows by mapping directly without silent filtering
  const items: T[] = obj.items.map((item, idx) => {
    try {
      return itemDecoder(item);
    } catch (err) {
      throw new DecoderError(`Failed to decode paginated item at index ${idx}: ${(err as Error).message}`);
    }
  });

  return {
    items,
    total,
    offset,
    limit,
  };
}
