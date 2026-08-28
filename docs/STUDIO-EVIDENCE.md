# Studio E2E evidence — partial, not release approval

Date: 2026-08-28. Network: Studionet, chain 61999, full consensus, simulation disabled.

Contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
Corrected executable revision: `e8c4277e908fa08c03eb571ff2a2c4d8ffccec97`.
Deployed source SHA-256: `FD003AE8CE47B3C36C242A8887D0C6F0B7BCFCCE0C9FC022306A3205665F598C`, 61,848 bytes.
Publisher/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
Independent Studio test actor: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`.

## Review and execution identity

Anonymous PRE_DEPLOY verdict: APPROVED for the corrected executable revision, permitting exact-source deployment or storage-compatible upgrade with the locked account. The completed reviewer turn is `01a044f1-9ef9-7381-8dbb-8b54ac21f38b` in the existing reviewer Task. Task read tools omitted the latest final text even after pagination; its exact final verdict was recovered from the reviewer's durable rollout, not inferred from liveness.

The primary AI performed every write through the live Studio UI. Upgrade calldata used Studio's documented `b#<hex>` bytes format, verified against the local source hash before sending. No signature or transaction was sent before the new approval. Read-only SDK RPC queries independently checked transaction execution, consensus, code and state.

## Completed cases

| Case / proof purpose | Transaction | Finality / execution | Authoritative result |
|---|---|---|---|
| Original unauthorized initialization exposed production namespace defect | `0x4ced1b4ed41d554530f7ef1769a5253ed344b1a6ad872157e57d52e8fb0cd1b6` | FINALIZED, MAJORITY_AGREE, ERROR | `AttributeError` for missing `gl.UserError`; diagnostic failure retained, not a passing authorization result |
| Authorized exact-source upgrade proves recovery and transaction timestamp path | `0xb4d3df5145ffd67c1bd8e2a4bcdc1a62320d3a9521ee65e2bbd2a96a4c23ad29` | FINALIZED, MAJORITY_AGREE, leader SUCCESS / return null | Code hash matches corrected source; publisher data/counts preserved; one UPGRADE event recorded |
| Unauthorized initialization rerun proves corrected business rejection | `0x1021407b963a268482e4a61a4727c6041ba9e56063ff770c410244c431a7bab0` | FINALIZED, MAJORITY_AGREE, expected ERROR / rollback | `UNAUTHORIZED_CALLER`, empty stderr, no publisher initialization or count changes |
| Unauthorized exact-source upgrade proves Root Slot permission enforcement | `0xbb8fffa228ea46abf5dd338c046c4f8ef9313946de9c3d282f8cc21f52fc7207` | FINALIZED, MAJORITY_AGREE, expected ERROR | `SystemError: 6: forbidden` at protected code storage write; source hash/state/event count unchanged |
| Authorized caller with malformed repository owner proves validation before immutable binding | `0x06f01aaf77c498d5a28387341444f4a6cb5c0b19d3bce2d512f0ff8c60bf61ba` | FINALIZED, MAJORITY_AGREE, expected ERROR / rollback | `INVALID_OWNER_OR_REPO`, empty stderr, no initialization or count changes |

Negative initialization arguments respectively: `("unauthorized-test", "negative-case")` and `("invalid/owner", "negative-case")`. Both upgrade attempts supplied the exact corrected source bytes; only the authorized one succeeded. Idle validators cancelled after quorum are not counted as successful executions or as contradictory consensus votes.

Profile after those negative controls: `initialized=false`, owner/repo empty, active canonical 0, canonical/candidate/objection counts 0, policy version 1, event count 1, admin unchanged. Events contained only `UPGRADE`, id 1, timestamp `1787863276`, actor the locked upgrader. Root Slot upgrader readback matched the locked account. All three negative controls left that post-upgrade baseline unchanged.

## Public fixtures and source-backed lifecycle

The user authorized fixture-only publication at [the fixture repository](https://github.com/pcong5239/policy-translation-release-gate-fixtures). Immutable commit `3c7431f10d5349c35e82ea400d84442c53b441f0` contains exactly the seven Markdown fixtures at repository root. Public commit API and all raw files returned HTTP 200 with matching local byte hashes. This exception does not authorize project-source release or Vercel deployment.

| Case / purpose | Transaction | Verified result |
|---|---|---|
| Initialize real publisher | `0xe6abbfe2434862cf113cc891658deea37f8414de921aa670b0ff0b3c95f5cacd` | FINALIZED / SUCCESS; owner `pcong5239`, repo `policy-translation-release-gate-fixtures` |
| Register canonical v1 | `0x50e8c9ee21c902a1d4701fed2cc12e1d8ca09ff899fcc478d0683be1b1f62259` | FINALIZED / SUCCESS; id 1, source digest and nonce verified |
| Activate canonical v1 | `0x3a4d9fc47c97f715352232ff64709a72149dd0343bdb2e11db9b33e7be01d7f8` | FINALIZED / SUCCESS; canonical 1 ACTIVE |
| Register localizer draft | `0xf98359e50921679c9227b46abdf40895ad9a529ffe774fa9370a41982a563772` | FINALIZED / SUCCESS; candidate 1 DRAFT, nonce `studio-es-v1`; initial v2 fixture intentionally prepares draft-update case |
| Update draft to equivalent v1 | `0x829e82002e5988fe8f6581eb2badcca41df426372ba7484e26e7c4101cf936b2` | FINALIZED / SUCCESS; candidate 1 DRAFT, `es-equivalent-v1.md`, digest `24b16304995ebba7ba1009190fe81b83c0a6779acb36c636243cdf0878197828` |
| Freeze candidate | `0x42be4da5ed277642684e6924b0e768988501e6b80668fc869a358c42c2686ccd` | FINALIZED / SUCCESS; candidate 1 FROZEN, attempts 0 |

All six writes obtained MAJORITY_AGREE and authoritative matching readbacks. Admin performed the first three; the independent localizer performed the last three. Exact calldata and raw readbacks are retained locally.

| Further case / purpose | Transaction | Verified result |
|---|---|---|
| Equivalent assessment | `0x37191953fe567d6e017c29bd097efb9aa033688b6b8ebbda15e28074b7c0a17a` | FINALIZED / SUCCESS / MAJORITY_AGREE; candidate 1 ACCEPTED, MATERIALLY_EQUIVALENT, both sources AVAILABLE, 3 matched sections, coverage 10000, no changed dimensions |
| Localizer cannot publish | `0xa07f05390187534b54806091db4f3077923a56d164d14adf793a7d9d799c1f82` | FINALIZED / expected rollback UNAUTHORIZED_PUBLISHER; candidate remains ACCEPTED, effective locale false |
| Publisher releases accepted candidate | `0x34db1697769392ce97923e3dd8b1951493836e44476661e910ffe641d7508499` | FINALIZED / SUCCESS; candidate 1 PUBLISHED; effective es true with exact source |
| Independent consumer binding | `0xb2c07aafe04ac2564c0fe54c9b432232b9cd480fa5f10487880e80b4257f4fc8` | FINALIZED / SUCCESS; actor 0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1, namespace studio-consumer/es, candidate 1, is_effective true |
| Register obligation-drift fixture | `0x7f148ff22696e43cf3d751c50049543c0e1ed9ef7712ad96e0482224af19f50b` | FINALIZED / SUCCESS; actor 0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1, candidate 2 DRAFT, locale fr |
| Independent prepublication objection | `0xe42348136c15bb4b47a8055ad7793c7362c196fdabe5b5d5d5902c08c2be04a2` | FINALIZED / SUCCESS; observer 0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902, objection 1 on candidate 2, source digest and reason matched; candidate stayed DRAFT without assessment |
| Freeze obligation-drift fixture | `0xa398ce2afb121d0ea5abdb202c1b6a01e5691731cb117422f96a23b5da569384` | FINALIZED / SUCCESS; candidate 2 FROZEN, attempts 0 |

Equivalent assessment fingerprint: `fbb295581208225006591718c847a48afe629c32be822c1abf46a6a781dfee5e`. The first bounded observer ended while consensus was still COMMITTING; read-only reconciliation of the same hash then verified FINALIZED. No duplicate assessment was submitted.

## Failed drift consensus — retained evidence

`assess_translation(2)` transaction `0x0819097c27405f2ec6218d5803bf26d2051073ed077abea5ee0f76b954b28609` finalized with MAJORITY_DISAGREE after rotations. Leader execution SUCCESS did not make the case pass. Readback: candidate 2 FROZEN, attempts 0, has_assessment false; assessment empty. Historical leaders fetched AVAILABLE sources with the same exact digests but varied between OBLIGATION_DRIFT and RIGHT_OR_EXCEPTION_LOSS and between per-dimension bands. This is a failed required case, not UNRESOLVED or a source-unavailability test. No duplicate assessment was submitted.

POST_DEPLOY_TEST remains incomplete. Equivalent assessment, publication and effective binding passed on this revision; drift rejection is blocked by the recorded consensus failure. Evidence-failure/retry, remaining guard cases, supersession, successor publication and populated-state recovery remain unproven. The fixed Studio-only publisher authority also blocks the advertised independent-wallet publisher web journey; no external-wallet workaround is claimed.

No project-source GitHub push, Vercel deployment, final user web E2E, submission, or experience-ledger update has occurred.
