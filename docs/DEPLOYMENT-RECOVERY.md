# Deployment and Recovery Manifest

Status: exact-source live recovery and the bounded Studio matrix are complete. The project remains before project-source GitHub release, Vercel deployment, final external-wallet E2E, and DUAL_APPROVED submission closure.

## Locked deployment configuration

- Network: GenLayer Studionet, chain ID `61999`.
- Contract address: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
- Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- Contract source: `contracts/policy_translation_release_gate.py`.
- Exact approved Git revision: `1a26dccf6ca8a69eb5ebd6812184d40cdbd2a1b0`.
- Exact source: `63,417` UTF-8 bytes; SHA-256 `92A77792DBD393E7DAFBA5C6127791E2D9C04999A5B3B826354782FB0B0DE35F`.
- Constructor arguments: none.
- Classification: `UPGRADABLE`, using the native Root Slot code replacement path.
- Locked Studio deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Root Slot readback: the locked account is the reported upgrader.
- Freeze choice: not frozen; the public `upgrade(bytes)` method remains protected by the Root Slot authority.
- Linked contracts, child transactions and value transfers: none.

The original deployment transaction is retained as historical evidence: `0xc9b344962bc468aed13375b4430ae6b434bcaebfb6af2e55fc8ec5a9a1b3f202`. The current exact source is established by the finalized upgrades and on-chain source readback below, not by the stale original-deployment record.

## Review and local verification

The exact `1a26...` source was reviewed and approved at the PRE_DEPLOY checkpoint in reviewer Task `codex://threads/01a0393a-00d9-7bd2-a5b2-60278c55bb1a`. The source, network, contract address, constructor shape and locked account remain unchanged.

Current checks on the exact local source:

- Python contract tests: `66 passed`.
- Frontend: typecheck pass; `99 passed` across 10 Vitest files; Vite production build pass.
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

The prior public exact-source upgrade `0xe676236385c4d3eefd5739acb2fce782c839c79e596cbf85b140b689e91a65d0` is also retained: `FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`; its raw calldata source body matches the approved source exactly and its contract event is the final `UPGRADE` event in the readback.

## Recovery rules

- Do not change the source, dependency header, constructor, chain, contract address, upgrade classification or locked account without a new exact-source review.
- If a transaction is pending or ambiguous, retain its full hash and reconcile finality and execution before sending another transaction. Never duplicate an unknown transaction.
- If the Studio UI resets while chain state and the locked account remain available, reconnect the locked account, import the recorded address, load the exact recorded source, and verify source/state before any upgrade.
- If the locked Studio authority is unavailable, do not claim upgrade recovery. A replacement deployment requires the recorded source/constructor manifest, a complete live matrix and new release links.
- If Studionet state resets, the old state cannot be recovered; redeploy from the exact source and rerun all required live cases.
- No private key, seed phrase, token or credential belongs in this manifest.

## Runtime/schema record

The source uses the current `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` header. It performs bounded immutable GitHub commit/raw reads through `gl.nondet.web.get` and uses `gl.nondet.exec_prompt` for the seven non-overlapping consequence dimensions. Both nondeterministic paths run under `gl.vm.run_nondet_unsafe`; validators independently refetch, rederive and compare all 17 consequence-bearing result fields before state mutation.

Storage uses the documented `@allow_storage` dataclass records and fully instantiated typed maps/arrays. Public views return JSON-compatible dictionaries; on-chain sized integers and frontend BigInt/decimal handling are lossless. There is no linked EVM/EOA interface, value transfer or custom child transaction.

Official documentation was checked on `2026-08-28` for storage, equivalence, testing, messages/interfaces, error handling, Studio limitations, networks and the Studio workflow. The required `gl.vm.UserError` namespace is used in the exact source.
