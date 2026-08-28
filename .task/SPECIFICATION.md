# Policy Translation Release Gate — Locked Specification

Status: SPEC_APPROVED
Category: PROJECT
Economic model: NON-ECONOMIC
Display name: Policy Translation Release Gate
Technical slug: policy-translation-release-gate

## 1. Baseline and scope lock

This specification implements `STAGE-1.md` and `STAGE-2.md` without changing their idea, scope, architecture, actors, or product boundary. One GenLayer Intelligent Contract and one Vite frontend form the complete product. There is no backend.

MVP supports one publisher profile, one immutable GitHub owner/repository binding, canonical language `en`, at most three BCP-47 locales per canonical revision, at most 16 canonical revisions, at most 12 stable normative section IDs per file, and at most 20,000 UTF-8 characters per document.

Out of scope: legal certification, machine translation generation, private repositories, arbitrary web evidence, PDFs/rich media, automatic website publishing, payments, token custody, appeal or admin override.

## 2. Trust problem and GenLayer consequence

The publisher controls release timing, the localizer controls candidate wording, and neither may choose the semantic verdict. Permissionless assessors only trigger evaluation. Validators independently fetch the exact commit-bound canonical and locale files, verify provenance and bytes, derive the normative comparison, and agree on consequence-bearing fields. Only `MATERIALLY_EQUIVALENT` may move a frozen candidate to `ACCEPTED`; only an accepted candidate may become `PUBLISHED`. Activating a new canonical revision atomically supersedes the prior canonical and makes its published locales `STALE_BY_CANONICAL_REVISION`.

The signal is semantic parity for publication gating, not a certified or legal translation.

## 3. Actors and authorization

- Publisher admin: initializes the immutable GitHub owner/repository profile, registers and activates canonical revisions, publishes accepted translations, and may perform an authorized upgrade. It cannot set or edit an assessment.
- Localizer: registers a locale candidate and may replace its draft commit/path/digest before freezing. It cannot alter a frozen candidate or publish it.
- Assessor: any wallet may trigger an assessment or eligible retry. It supplies only the candidate identifier; no URL, body, verdict, score, or evidence result.
- Observer: any wallet may append a bounded objection before publication. Objections are informational and never independently veto or override consensus.
- Consumer: binds an application namespace to a locale/candidate and reads effective eligibility. It cannot override stale or unpublished state.
- Validators: independently fetch and assess evidence inside nondeterministic execution; they cannot write state unilaterally.
- Upgrader: the publisher admin through the reviewed Root Slot-compatible upgrade path. Upgrade cannot rewrite existing records.

All authorization is enforced by the contract, never by UI role selection alone.

## 4. Canonical evidence boundary

The publisher profile freezes one lowercase GitHub `owner/repo`. Every canonical and translation record freezes:

- exact 40-character lowercase hexadecimal commit SHA;
- safe relative UTF-8 path with no scheme, host, query, fragment, leading slash, backslash, empty segment, `.` segment, or `..` segment;
- declared BCP-47 language/locale;
- caller-declared lowercase SHA-256 digest of the exact fetched raw bytes;
- canonical revision/candidate identity and client nonce.

Validators construct only these URLs from frozen fields:

- `https://api.github.com/repos/{owner}/{repo}/commits/{sha}`
- `https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}`

They verify that the commit API returns the exact SHA, raw bytes hash to the frozen digest, UTF-8 decoding succeeds, character count is at most 20,000, and the document exposes at most 12 unique stable section IDs. Policy text is untrusted data and instructions inside it cannot alter the output schema or decision rules.

Source status taxonomy:

- exact file `404`: `MISSING`;
- rate limit `429`, transport failure, timeout, or any `5xx`: `UNAVAILABLE`;
- wrong returned commit, digest mismatch, malformed UTF-8, unsafe/oversize input, duplicate/missing stable IDs: `INVALID`;
- valid commit and bytes: `AVAILABLE`.

`UNAVAILABLE` always yields retryable `UNRESOLVED` and no adverse semantic conclusion. `MISSING` or `INVALID` yields `NOT_COMPARABLE` only when validators independently establish that exact condition. No infrastructure failure may become semantic drift.

## 5. Normative document protocol

Canonical and locale files must contain the same stable section IDs using one documented plain-text marker format. The implementation must define one strict parser and use it in leader, validator, tests, UI guidance, and README. IDs are unique, bounded, normalized, and compared as a sorted set.

For each section, validators independently classify these consequence-bearing dimensions:

- rights;
- obligations;
- prohibitions;
- exceptions;
- scope;
- thresholds;
- deadlines.

Each dimension uses a bounded enum indicating equivalent, changed/lost, or not comparable. Free-form explanations are optional bounded audit text; they do not participate in strict equality, but validators must ensure any stored explanation is source-grounded and consistent with the agreed dimensions/outcome.

Dimension axes are mutually exclusive for consensus: express beneficiary entitlements map to rights; mandatory acts to obligations; forbidden acts to prohibitions; express carve-outs to exceptions; covered actors/data/conduct/jurisdiction to scope; non-temporal numeric triggers to thresholds; and temporal limits to deadlines. Weakening a duty does not independently create a rights/scope/threshold change. `LOST` is reserved for express rights or exceptions; an equivalent absent dimension is normalized from `NOT_APPLICABLE` to `EQUIVALENT` before strict comparison. This canonicalization removes label-only variance and never converts a substantive `CHANGED`/`LOST` dimension into equivalence.

## 6. Exact consensus result schema

The accepted nondeterministic result has one exact normalized schema shared by contract validation, tests, frontend decoding, and documentation:

- `canonical_status`
- `translation_status`
- `canonical_commit`
- `translation_commit`
- `canonical_digest`
- `translation_digest`
- `canonical_section_ids`
- `translation_section_ids`
- `matched_section_count`
- `canonical_section_count`
- `translation_section_count`
- `coverage_bps`
- `section_results` ordered by stable section ID, each containing the seven bounded dimension enums
- `changed_dimensions` sorted and deduplicated
- `outcome`
- `fingerprint` over the normalized consequence-bearing result
- bounded `reason`

Allowed outcomes are exactly:

- `MATERIALLY_EQUIVALENT`
- `OBLIGATION_DRIFT`
- `RIGHT_OR_EXCEPTION_LOSS`
- `SCOPE_OR_THRESHOLD_DRIFT`
- `NOT_COMPARABLE`
- `UNRESOLVED`

Coverage must be 10,000 basis points and section sets must match before equivalence is possible. Outcome derivation from section dimension bands is deterministic. Rights or exception loss has precedence over obligation drift; scope, threshold, or deadline drift maps to `SCOPE_OR_THRESHOLD_DRIFT`; missing or structurally invalid comparable evidence maps to `NOT_COMPARABLE`; infrastructure uncertainty maps to `UNRESOLVED`.

Leader and validator independently refetch, rehash, parse, and assess. Consensus compares every identity and consequence-bearing field exactly: source statuses where consequential, commits, digests, section sets/counts, coverage, ordered per-section dimension bands, changed dimensions, outcome, and fingerprint. It must not require byte-identical free-form reasoning. A schema-valid but substantively different leader result is rejected.

## 7. State machines and atomic transitions

Canonical: `REGISTERED -> ACTIVE -> SUPERSEDED`.

Candidate: `DRAFT -> FROZEN -> ACCEPTED | REVISION_REQUIRED | HOLD_UNRESOLVED`; an eligible unresolved candidate may retry up to three attempts with a ten-minute cooldown; `ACCEPTED -> PUBLISHED -> STALE_BY_CANONICAL_REVISION`.

Consumer: `UNBOUND -> BOUND`; a binding is effective only when its candidate is `PUBLISHED` for the currently `ACTIVE` canonical revision.

Rules:

- records are append-only after freeze except bounded assessment/retry state;
- client nonces map to the exact created identifier and prevent duplicate writes;
- duplicate `(canonical_id, locale, commit, path)` candidates are rejected;
- only one active canonical exists;
- `activate_canonical` atomically supersedes the old active revision and stales every published locale under it;
- `publish_translation` rechecks accepted state and active canonical in the same transaction;
- no objection, publisher, localizer, assessor, consumer, or upgrader can inject or overwrite a verdict;
- every rejected or replayed action leaves authoritative state unchanged.

## 8. Contract interface

Writes:

- `initialize_publisher(owner, repo)`
- `register_canonical(client_nonce, commit, path, digest)`
- `activate_canonical(canonical_id)`
- `register_translation(client_nonce, canonical_id, locale, commit, path, digest)`
- `update_translation_draft(candidate_id, commit, path, digest)`
- `freeze_translation(candidate_id)`
- `assess_translation(candidate_id)`
- `retry_unresolved(candidate_id)`
- `record_objection(candidate_id, objection_digest, reason)`
- `publish_translation(candidate_id)`
- `bind_consumer(namespace, locale, candidate_id)`
- `upgrade(new_code)` using the current official upgradability pattern.

Views expose publisher profile, active canonical, revision/candidate records, normalized assessment, effective locale, consumer binding, nonce result, upgrader, and bounded paginated revisions/candidates/objections/events. Public types and storage use only current GenVM-supported forms.

## 9. Frontend product requirements

The Vite application provides six real journeys: publisher setup/canonical lifecycle, localizer candidate lifecycle, permissionless assessment/retry, publisher publication, consumer namespace binding/effective-locale lookup, and public side-by-side section matrix with exact source links and objections.

Public reads require no wallet. `Connect wallet` always opens an explicit EIP-6963 selector containing only detected MetaMask, OKX Wallet, and Rabby providers. Selection binds all account, chain, client, and write operations to that exact provider object. Cancellation sends no account request. Every full reload starts disconnected with no automatic account request or restoration.

Each write shows signing, submitted hash, consensus/pending, finalized, execution success, and authoritative method-specific readback. Finalized-with-error is failure. Ambiguous receipt/timeout preserves the hash and locks duplicate submission until bounded reconciliation proves success or terminal failure. Pending intent storage is capability-tested before sending; storage failure blocks submission. No fake result or placeholder contract address is allowed.

## 10. Studionet RPC budget

Use one shared read client and one app-wide FIFO queue. Maximum one in-flight batch; identical in-flight reads deduplicate; safe reads cache for 10 seconds and invalidate after verified writes; pagination is 20; only the active view polls. Transaction checks use bounded 2.5–10 second backoff for at most 10 minutes, pause in hidden tabs, honor `Retry-After`, and apply shared bounded exponential backoff with jitter for `429/5xx`. There is no per-locale polling, infinite retry, address fallback, or duplicate write. Journey-level call counts must be measured and asserted.

## 11. Verification requirements

Contract tests cover roles, immutable repo binding, path/SHA/digest/locale validation, section caps/parser, freeze, all outcome branches, unavailable/missing taxonomy, prompt injection, Unicode/oversize content, validator disagreement, retry cooldown/cap, canonical supersession and atomic stale propagation, publication guards, consumer eligibility, nonce/replay, pagination caps, and authorized/unauthorized upgrade with storage preservation.

Frontend tests cover all six journeys, exact provider routing and reload disconnection, no-provider/cancel/reject/account/chain changes, full transaction lifecycle, hostile receipts and lossless integers, pending persistence/reconciliation/duplicate prevention, stale state, RPC concurrency/dedup/cache/backoff/call budgets, accessibility, responsive layout, and exact source/Explorer links.

Integration fixtures reproduce current GitHub commit API and raw response/error shapes. Current GenVM lint/semantic validation, Python tests, frontend tests, typecheck, and production build must pass under recorded versions before deployment review.

## 12. Release proof and limitations

PRE_DEPLOY requires exact source/spec hashes, tests, upgradable classification, locked Studio deployer/upgrader public address, draft manifest/recovery plan, and anonymous approval before any transaction. Studio proof then covers the smallest sufficient matrix from acceptance criteria, including equivalent, each material drift family, unavailable/retry, publication guard, consumer binding, canonical supersession/stale propagation, successor publication, authorization/path/digest/replay/cap negatives, and upgrade recovery. Every consequential write requires transaction hash, FINALIZED, execution SUCCESS or expected rollback, consensus/finality, and authoritative readback.

The exact final Vercel release requires user-executed E2E with an independent MetaMask/OKX/Rabby wallet, followed by primary-AI chain verification. GitHub, contract, Explorer, Vercel, documentation, and scorecard must bind one exact revision before final dual approval.

Disclosed limitations: public GitHub repositories only; publisher wallet does not prove GitHub ownership; stable section IDs are required; semantic parity is not legal certification; one canonical language and three locales; bounded document/revision/event sizes; Studionet is temporary; no economic value.
