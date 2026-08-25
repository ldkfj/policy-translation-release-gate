/**
 * Contract types, states, outcomes, and view payload schemas.
 * Strictly aligned with contracts/policy_translation_release_gate.py.
 */

export type CanonicalState = 'REGISTERED' | 'ACTIVE' | 'SUPERSEDED';

export type CandidateState =
  | 'DRAFT'
  | 'FROZEN'
  | 'ACCEPTED'
  | 'REVISION_REQUIRED'
  | 'HOLD_UNRESOLVED'
  | 'PUBLISHED'
  | 'STALE_BY_CANONICAL_REVISION';

export type AssessmentOutcome =
  | 'MATERIALLY_EQUIVALENT'
  | 'OBLIGATION_DRIFT'
  | 'RIGHT_OR_EXCEPTION_LOSS'
  | 'SCOPE_OR_THRESHOLD_DRIFT'
  | 'NOT_COMPARABLE'
  | 'UNRESOLVED';

export type SourceStatus = 'AVAILABLE' | 'MISSING' | 'UNAVAILABLE' | 'INVALID';

export type DimensionStatus = 'EQUIVALENT' | 'CHANGED' | 'LOST';

export const CONSEQUENCE_DIMENSIONS = [
  'rights',
  'obligations',
  'prohibitions',
  'exceptions',
  'scope',
  'thresholds',
  'deadlines',
] as const;

export type ConsequenceDimension = typeof CONSEQUENCE_DIMENSIONS[number];

export interface SectionResult {
  section_id: string;
  rights: DimensionStatus;
  obligations: DimensionStatus;
  prohibitions: DimensionStatus;
  exceptions: DimensionStatus;
  scope: DimensionStatus;
  thresholds: DimensionStatus;
  deadlines: DimensionStatus;
}

export interface PublisherProfile {
  owner: string;
  repo: string;
  admin: string;
  policy_version: number;
  initialized: boolean;
  active_canonical_id: number;
  canonical_count: number;
  candidate_count: number;
  objection_count: number;
  event_count: number;
}

export interface ActiveCanonicalSummary {
  is_active: boolean;
  id: number;
  commit: string;
  path: string;
  digest: string;
  language: string;
  state: CanonicalState;
  created_at: number;
}

export interface CanonicalRevision {
  id: number;
  commit: string;
  path: string;
  digest: string;
  language: string;
  state: CanonicalState;
  created_at: number;
}

export interface TranslationCandidate {
  id: number;
  canonical_id: number;
  locale: string;
  localizer: string;
  commit: string;
  path: string;
  digest: string;
  state: CandidateState;
  created_at: number;
  attempts: number;
  last_assessed_at: number;
  has_assessment: boolean;
}

export interface Assessment {
  candidate_id?: number;
  canonical_status: SourceStatus;
  translation_status: SourceStatus;
  canonical_commit: string;
  translation_commit: string;
  canonical_digest: string;
  translation_digest: string;
  canonical_section_ids: string[];
  translation_section_ids: string[];
  matched_section_count: number;
  canonical_section_count: number;
  translation_section_count: number;
  coverage_bps: number;
  section_results: SectionResult[];
  changed_dimensions: string[];
  outcome: AssessmentOutcome;
  fingerprint: string;
  reason: string;
}

export interface ObjectionRecord {
  id: number;
  candidate_id: number;
  observer: string;
  objection_digest: string;
  digest?: string;
  reason: string;
  created_at: number;
}

export interface ConsumerBinding {
  exists: boolean;
  is_effective: boolean;
  namespace: string;
  locale: string;
  candidate_id: number;
  canonical_id: number;
  candidate_state: string;
  bound_at: number;
  reason?: string;
}

export interface EffectiveLocale {
  is_effective: boolean;
  candidate_id: number;
  canonical_id: number;
  locale: string;
  commit: string;
  path: string;
  digest: string;
  localizer: string;
  reason?: string;
}

export interface NonceResult {
  exists: boolean;
  entity_type: 'canonical' | 'translation' | '';
  id: number;
}

export interface ContractEvent {
  id: number;
  event_type: string;
  payload_json: string;
  payload: Record<string, unknown> | null;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
