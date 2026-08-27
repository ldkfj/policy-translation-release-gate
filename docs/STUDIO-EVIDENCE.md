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

Final observed profile: `initialized=false`, owner/repo empty, active canonical 0, canonical/candidate/objection counts 0, policy version 1, event count 1, admin unchanged. Final events page contains only `UPGRADE`, id 1, timestamp `1787863276`, actor the locked upgrader. Root Slot upgrader readback matches the locked account. Thus all three negative controls left the post-upgrade baseline unchanged.

## Remaining live dependency and gate

The seven source-backed files under `live-fixtures/` exist locally only; no public fixture repository/commit has been supplied or authorized for publication. Locked Stage 1/Stage 2 and specification section 4 require real GitHub commit API and raw file retrieval, including stable `[[SECTION:...]]` markers. Local files and mock results cannot establish semantic equivalence, publication, effective consumer binding, supersession, or successor publication on Studionet.

Do not initialize the immutable owner/repository binding with an invented or unrelated repository. Do not publish project source, use another Task's repository, or change the evidence boundary to evade this dependency. The next source-backed lifecycle needs an existing suitable public fixture repository or explicit user authorization for fixture-only publication before the release push. POST_DEPLOY_TEST remains incomplete and no approval is claimed for it.

No GitHub push, Vercel deployment, final user web E2E, submission, or experience-ledger update has occurred.
