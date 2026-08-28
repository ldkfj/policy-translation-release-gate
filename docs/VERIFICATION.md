# Verification

This document is the compact judge-facing verification record for Policy Translation Release Gate. Detailed live transaction rows and recovery chronology remain in the linked documents below.

## Exact source and live contract

- Executable source: contracts/policy_translation_release_gate.py
- Exact executable Git revision: `5d50e4fc8f2f6f77bc09fb8a7fc205021d7bc09e`
- Exact source length: 66,182 UTF-8 bytes
- Exact source SHA-256: `55262740969342C0721A6DC6A4282708E86B7B74D2C71363B7BC2305FA169738`
- Network: GenLayer Studionet, chain 61999
- Contract: 0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- RPC: https://studio.genlayer.com/api
- Live web: https://policy-translation-release-gate.vercel.app
- Public repository: https://github.com/ldkfj/policy-translation-release-gate
- Constructor: no arguments
- Deployment class: UPGRADABLE native Root Slot
- Locked publisher/upgrader: 0x34b92E6553eaCA11A00A9d86d75d8a7881779D78

The deployed source readback is the lowercase form of the exact SHA above. Contract evidence remains bound to executable revision `5d50...`; the production frontend repair is bound to public commit `e3bf7776dfbce3a43577607ad0fe9942e24973ee`.

The final verified Vercel production deployment is `dpl_22X9hMYHuh6Qcztbg7Q2QbSGPMkC` in team `gam9`; immutable URL `https://policy-translation-release-gate-jonggdfyu-gam9.vercel.app`; the stable production alias above is the judge-facing URL. Primary live review confirmed the correct title, contract/Explorer link, disconnected wallet state, all six journeys, 2 canonical revisions, 16 candidates, published candidate 8, consumer resolution data, audit/upgrader data, and no console warnings or errors. The cross-journey read-dedup cancellation defect was fixed at `e3bf777...` and its production transition regression passed.

## Exact-source upgrade and threshold proof

- Specification snapshot SHA-256: `7AFC0B370CCAC0408B6D6F548081F4D3286717CC11561EE1FD29C6A782D0FF71`.
- PRE_DEPLOY verdict: `APPROVED` for the exact source, address, network and locked account.
- Upgrade `0x8c805cec74b97873f9c3eae942937561d20ddf2d963b99099cc584d02b39c7a9`: `FINALIZED / SUCCESS / MAJORITY_AGREE`; on-chain source readback `55262740969342c0721a6dc6a4282708e86b7b74d2c71363b7bc2305fa169738`.
- Threshold proof `0x4dd7d69da71528ede89a644262d109ceb423bc69960824a00a7b5e456ea8df17`: `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 16 became `REVISION_REQUIRED`, evidence `AVAILABLE/AVAILABLE`, 3/3 sections, 10000 bps, changed dimensions exactly `deadlines, thresholds`, outcome `SCOPE_OR_THRESHOLD_DRIFT`.

## Live state readback

The final read-only Studionet observer readback records:

- initialized profile; active canonical revision 2; canonical revision 1 SUPERSEDED;
- 16 translation candidates and 1 recorded objection;
- candidate 8 PUBLISHED for canonical 2 and locale es;
- candidate 8 assessment MATERIALLY_EQUIVALENT, 3/3 sections, 10000 bps coverage, and all 7 consequence dimensions EQUIVALENT;
- studio-consumer/es bound to candidate 8 and effective;
- 60 contract events;
- get_upgrader() equal to the locked authority.

The complete transaction matrix, including expected failures, disagreement controls, invalid external-fetch controls, source restoration, and authoritative readbacks, is in [STUDIO-LIVE-MATRIX.md](STUDIO-LIVE-MATRIX.md). The narrative evidence is in [STUDIO-EVIDENCE.md](STUDIO-EVIDENCE.md). Recovery and incident handling are in [DEPLOYMENT-RECOVERY.md](DEPLOYMENT-RECOVERY.md).

## Local verification

- Contract regression: pending package 71 passed; live-source historical matrix 66 passed.
- Frontend typecheck: passed.
- Frontend regression: 100 passed across 10 suites, including cross-journey cancellation isolation.
- Production Vite build: passed with the disclosed 815.19 kB minified-chunk warning.
- genvm-lint check, schema, and typecheck: passed; 25 methods, 13 views, 12 writes, zero constructor parameters.
- Python compilation: passed.
- git diff --check: passed.
- Configured-address production bundle check: passed.

## Frontend trust boundary

Public reads are wallet-free. Writes require explicit EIP-6963 selection of MetaMask, OKX Wallet, or Rabby and bind to the selected provider/account. Full reload starts disconnected. Transaction success requires the captured hash, FINALIZED state, execution SUCCESS, and authoritative contract readback. The contract address is injected at build time through VITE_GENLAYER_CONTRACT_ADDRESS and empty or invalid configuration fails closed.

## Release gates still required

The user-executed external-wallet E2E result and anonymous POST_GITHUB_VERCEL_FINAL verdict must be added before DUAL_APPROVED. GitHub public rendering and the final Vercel URL have been verified. No form submission is made by this project.
