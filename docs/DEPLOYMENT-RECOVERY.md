# Deployment and Recovery Manifest

Status: the exact-source Studio upgrade, bounded post-upgrade proof, and POST_DEPLOY_TEST approval are complete. The existing GitHub/Vercel/frontend evidence remains available; the refreshed package remains before POST_GITHUB_VERCEL_FINAL and DUAL_APPROVED submission closure.

## Locked deployment configuration

- Network: GenLayer Studionet, chain ID `61999`.
- Contract address: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
- Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- Contract source: `contracts/policy_translation_release_gate.py`.
- Exact live executable Git revision: `06d067ca97db7086643a678c02986169cc391e6e`.
- Metadata follow-up: `5d413a886f44f1a363d3bc561b815bff845c00`.
- Exact source: `74,639` UTF-8 bytes; SHA-256 `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`.
- Exact specification snapshot: `.task/SPECIFICATION.md`, SHA-256 `6C4A036CE4248BD967071AA52A9CEC87336DBE23CEF96A49D36A9B56563ED8EF`.
- Constructor arguments: none.
- Classification: `UPGRADABLE`, using the native Root Slot code replacement path.
- Locked Studio deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Root Slot readback: the locked account is the reported upgrader.
- Freeze choice: not frozen; the public `upgrade(bytes)` method remains protected by the Root Slot authority.
- Linked contracts, child transactions and value transfers: none.

The original deployment transaction is retained as historical evidence: `0xc9b344962bc468aed13375b4430ae6b434bcaebfb6af2e55fc8ec5a9a1b3f202`. The current exact source is established by the finalized upgrades and on-chain source readback below, not by the stale original-deployment record.

## PRE_DEPLOY correction manifest (now deployed)

This manifest records the exact package approved at PRE_DEPLOY and now installed on the target. It does not authorize another upgrade.

- Exact revision: `06d067ca97db7086643a678c02986169cc391e6e` (metadata follow-up `5d413a886f44f1a363d3bc561b815bff845c00`).
- Exact source: `74,639` UTF-8 bytes; SHA-256 `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`.
- Exact specification: `.task/SPECIFICATION.md`, SHA-256 `6C4A036CE4248BD967071AA52A9CEC87336DBE23CEF96A49D36A9B56563ED8EF`.
- Upgrade target: the same contract `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75` on Studionet `61999`, using the locked upgrader above.
- Storage compatibility: every legacy storage field remains in its original order. `consumer_binding_owners` is appended after the legacy `events` field; no existing record is rewritten. Existing ownerless bindings remain readable/effective. A non-admin cannot update an ownerless legacy key; the publisher admin may initialize/recover its owner on first update.
- Verification basis: the contract suite includes an exact append-only layout assertion and a populated-state Root Slot upgrade preservation test covering publisher profile, active canonical, published candidate, consumer binding and effective-locale state.

The prior `5d50...`/`552627...` deployment is historical. The live source and evidence below are bound to this exact `06d...`/`B678...` package.

## Review and local verification

The anonymous co-review AI returned fresh PRE_DEPLOY `APPROVED` for the exact `06d...` executable source, network, address and locked account. Upgrade `0x5f5579eabab78edee329a9cdcb7f4cbbd7ac3c9d7cb11ffade526d26b7538100` finalized successfully and exact source/state readback passed. The same reviewer returned POST_DEPLOY_TEST `APPROVED` after independent verification.

Current checks on the exact local source:

- Live-source historical Python contract tests: `66 passed`.
- Exact application baseline `2c07257acd2e3299adc5bff20a3aee7dfd108455`: Python contract tests `73 passed`; frontend typecheck pass; `103 passed` across 10 Vitest files; Vite production build pass.
- `genvm-lint check`: pass; schema `25` methods (`13` views, `12` writes), zero constructor parameters.
- `genvm-lint typecheck`: pass.
- Python compilation: pass.
- The installed linter reports only an optional newer runner warning; no dependency/header change was made.

## Recovery chronology

1. `0x94e49246bd439f521c931fe45682fcc9f8a15b0a48b0c378d53aa46f9c6f5414` finalized as `upgrade(bytes)` with raw calldata whose source body exactly matched the approved `1a26...` bytes; it preserved the populated v1 state.
2. `0x1e484b14483fdfbf7b8df0a283572201dfaa3d092f697064d01b22ea71969169` finalized as a Studio code upgrade from a stale editor buffer. Its source readback was `322F3278B95CADCD68427DB16E4405D947F22577844D654ACFA32BD743A78F34`, not the approved source. This material incident is retained in `.task/live-evidence/` and disclosed in `docs/STUDIO-EVIDENCE.md`; it is not treated as an approved release.
3. The visible Studio editor was replaced with the exact local source. `0xef831609be9fb78aa866e94c69c665aabe02698bcab659f9cc3be9ce6522cd99` finalized as an exact-source Studio code upgrade.
4. Queued exact-source Studio upgrades `0xb5a5b98820b1aa876d0513df51bbe230d61275a9b6ef18484a412e77081f7eac` and `0x067cf62b52aadae5750461dba29113e8f4e83969cf76cbb06db0806fd08afd4a` later finalized too; raw `new_code` payloads are each exactly 63,417 bytes with SHA `92A777...`.
5. The final read-only observer run after the queue settled returned source `92a777...`, active canonical 2, candidate 8 `PUBLISHED`, effective consumer binding, preserved objection/event records and the locked upgrader address.
6. The approved repair upgrade `0x8c805cec74b97873f9c3eae942937561d20ddf2d963b99099cc584d02b39c7a9` finalized `SUCCESS / MAJORITY_AGREE`, installed the prior exact source `552627...`, and preserved active canonical 2, candidate 8 published/effective, objections and upgrader authority.
7. Corrected immutable fixture commit `957a4521f155d24cfc8291a98782314c78239f8b` removed unintended rights drift from the threshold control. Register `0x75fcd92...`, freeze `0xc023219...`, and assess `0x4dd7d69...` proved `SCOPE_OR_THRESHOLD_DRIFT` with exact changed dimensions `deadlines, thresholds`; one disclosed duplicate register `0xea257a8...` was an idempotent no-op returning candidate 16 with counts unchanged.
8. The prior application-package external-wallet Vercel E2E recorded objection ID `4` in transaction `0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b`; authoritative readback returned objection count `4` and event count `63`. It remains historical evidence for deployment `dpl_AcLC5FenPms81vhyZwh1eJTdG9Dh`.
9. The current exact Vercel deployment `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi` passed the fresh external-wallet objection E2E on `2026-08-30`: transaction `0xcd1a63d8696dfa7b26330b3787234d4bf57032bfd0e706e483e25670869c5a01` finalized `SUCCESS / Accepted`, returned objection ID `5`, and independently read back on-chain. Candidate 16 page total became `4`, profile readback became `objection_count=5` and `event_count=70`; the UI showed the new row after reconnect. Reload returned `Connect Wallet` without auto-connect, and reconnect succeeded.
10. After the current exact-source upgrade, fresh candidate 18 registration `0xfcd08c100bb435f5b26ce3c1b7f420bdccc89e480708ef87eb014047f3d95200`, freeze `0xe5b7e1f9fcd3eae9b674c989f84249a3c4d48d6b64357327faf6f88708944f70`, and assessment `0x8ca4c78a0168658d49f1544dbb9a3d833809c32645c67a6b40db07af4446770e` finalized with majority agreement. Readback proved `AVAILABLE/AVAILABLE`, 3/3 sections, 10000 bps, exact `deadlines, thresholds`, and `SCOPE_OR_THRESHOLD_DRIFT`.

The prior public exact-source upgrade `0xe676236385c4d3eefd5739acb2fce782c839c79e596cbf85b140b689e91a65d0` is also retained: `FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`; its raw calldata source body matches the approved source exactly and its contract event is the final `UPGRADE` event in the readback.

## Recovery rules

- Do not change the source, dependency header, constructor, chain, contract address, upgrade classification or locked account without a new exact-source review.
- If a transaction is pending or ambiguous, retain its full hash and reconcile finality and execution before sending another transaction. Never duplicate an unknown transaction.
- Current release evidence is bound to live source `06d...` and hash `B678...`; the older `5d50...`/`552627...`, `1a26...`/`92A777...` rows are historical evidence only.
- If the Studio UI resets while chain state and the locked account remain available, reconnect the locked account, import the recorded address, load the exact recorded source, and verify source/state before any upgrade.
- If the locked Studio authority is unavailable, do not claim upgrade recovery. A replacement deployment requires the recorded source/constructor manifest, a complete live matrix and new release links.
- If Studionet state resets, the old state cannot be recovered; redeploy from the exact source and rerun all required live cases.
- No private key, seed phrase, token or credential belongs in this manifest.

## Runtime/schema record

The source uses the current `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` header. It performs bounded immutable GitHub commit/raw reads through `gl.nondet.web.get` and uses `gl.nondet.exec_prompt` for the seven non-overlapping consequence dimensions. Both nondeterministic paths run under `gl.vm.run_nondet_unsafe`; validators independently refetch, rederive and compare all 17 consequence-bearing result fields before state mutation.

Storage uses the documented `@allow_storage` dataclass records and fully instantiated typed maps/arrays. Public views return JSON-compatible dictionaries; on-chain sized integers and frontend BigInt/decimal handling are lossless. There is no linked EVM/EOA interface, value transfer or custom child transaction.

Official documentation was checked on `2026-08-28` for storage, equivalence, testing, messages/interfaces, error handling, Studio limitations, networks and the Studio workflow. The required `gl.vm.UserError` namespace is used in the exact source.
