# Verification

This document is the compact judge-facing verification record for Policy Translation Release Gate. Detailed live transaction rows and recovery chronology remain in the linked documents below.

## Exact source and live contract

- Executable source: contracts/policy_translation_release_gate.py
- Exact executable Git revision: `06d067ca97db7086643a678c02986169cc391e6e`
- Metadata follow-up: `5d413a886f44f1a363d3bc561b815bff845c00`
- Exact source length: 74,639 UTF-8 bytes
- Exact source SHA-256: `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`
- Network: GenLayer Studionet, chain 61999
- Contract: 0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- RPC: https://studio.genlayer.com/api
- Live web: https://policy-translation-release-gate.vercel.app
- Public repository: https://github.com/ldkfj/policy-translation-release-gate
- Constructor: no arguments
- Deployment class: UPGRADABLE native Root Slot
- Locked publisher/upgrader: 0x34b92E6553eaCA11A00A9d86d75d8a7881779D78

The deployed source readback is the lowercase form of the exact SHA above. Contract evidence is bound to executable revision `06d...`; the frontend implementation baseline is public commit `2c07257acd2e3299adc5bff20a3aee7dfd108455`. The base evidence package is Git commit `404a7ccf8b0b828c6be7b98cc1567e0e380c85c1`; the current public evidence package HEAD is `1c1902a08380ca5456637c0fc11c1cb247391ff0`, whose metadata follow-up binds the public deployment alias and final evidence lineage.

The refreshed Vercel production deployment is `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi` in team `gam9`; the stable production alias above is the judge-facing URL. Primary live review confirmed the correct title, contract/Explorer link, disconnected wallet state, all six journeys, 2 canonical revisions, published candidate 8, consumer resolution data, audit/upgrader data, and the fresh current-deployment objection E2E. The cross-journey read-dedup cancellation defect, EIP-6963 provider-object deduplication defect, and GenLayer transaction-finality/readback defect were fixed in the application baseline; their regression tests passed. The refreshed package changes documentation/evidence only after that frontend verification.

## Exact-source upgrade and threshold proof

- Specification snapshot SHA-256: `6C4A036CE4248BD967071AA52A9CEC87336DBE23CEF96A49D36A9B56563ED8EF`.
- PRE_DEPLOY verdict: `APPROVED` for the exact source, address, network and locked account.
- Upgrade `0x5f5579eabab78edee329a9cdcb7f4cbbd7ac3c9d7cb11ffade526d26b7538100`: `FINALIZED / SUCCESS / MAJORITY_AGREE`; on-chain source readback `b6784931eed81b7ee33e48814cf53dabf6bae2fa21b57eb914cce7415c60eba1`.
- Fresh threshold proof `0x8ca4c78a0168658d49f1544dbb9a3d833809c32645c67a6b40db07af4446770e`: `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 18 became `REVISION_REQUIRED`, evidence `AVAILABLE/AVAILABLE`, 3/3 sections, 10000 bps, changed dimensions exactly `deadlines, thresholds`, outcome `SCOPE_OR_THRESHOLD_DRIFT`.

## Live state readback

The final read-only Studionet observer readback records:

- initialized profile; active canonical revision 2; canonical revision 1 SUPERSEDED;
- 18 translation candidates and 4 recorded objections;
- candidate 8 PUBLISHED for canonical 2 and locale es;
- candidate 8 assessment MATERIALLY_EQUIVALENT, 3/3 sections, 10000 bps coverage, and all 7 consequence dimensions EQUIVALENT;
- studio-consumer/es bound to candidate 8 and effective;
- 69 contract events;
- get_upgrader() equal to the locked authority.

## External-wallet E2E status

- Exact final application/test package: `2c07257acd2e3299adc5bff20a3aee7dfd108455`.
- Stable Vercel URL: https://policy-translation-release-gate.vercel.app
- Prior-release external wallet: `0x008704...E01f`, connected to Studionet 61999 through the supported wallet selector before the provider-identity repair.
- Prior-release Public Audit flow: candidate `#16` (`REVISION_REQUIRED`), digest auto-populated by the contract read, objection reason submitted once.
- Prior-release transaction: [0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001](https://explorer-studio.genlayer.com/tx/0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001)
- Prior-release authoritative result remains historical evidence: `FINALIZED / SUCCESS / MAJORITY_AGREE`; contract return value `2`; objection ID `2`.
- Prior application-package external-wallet: account `0x008704...E01f`, candidate `16`, digest `a00c15...2906ea`, transaction [0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b](https://explorer-studio.genlayer.com/tx/0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b), `FINALIZED / SUCCESS / MAJORITY_AGREE`, contract return value `4`, objection ID `4`, candidate-16 objection page total `3`, profile `objection_count=4`, `event_count=63`; historical deployment `dpl_AcLC5FenPms81vhyZwh1eJTdG9Dh`.
- Current exact Vercel user E2E: account `0x008704...E01f`, candidate `16`, digest `a00c15...2906ea`, transaction [0xcd1a63d8696dfa7b26330b3787234d4bf57032bfd0e706e483e25670869c5a01](https://explorer-studio.genlayer.com/tx/0xcd1a63d8696dfa7b26330b3787234d4bf57032bfd0e706e483e25670869c5a01), `FINALIZED / SUCCESS / MAJORITY_AGREE`, contract return value `5`, objection ID `5`, candidate-16 objection page total `4`, profile `objection_count=5`, `event_count=70`; deployment `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi`. Reload returned disconnected `Connect Wallet` and reconnect/readback passed.

The complete transaction matrix, including expected failures, disagreement controls, invalid external-fetch controls, source restoration, and authoritative readbacks, is in [STUDIO-LIVE-MATRIX.md](STUDIO-LIVE-MATRIX.md). The narrative evidence is in [STUDIO-EVIDENCE.md](STUDIO-EVIDENCE.md). Recovery and incident handling are in [DEPLOYMENT-RECOVERY.md](DEPLOYMENT-RECOVERY.md).

## Local verification

- Contract regression: exact source package 73 passed; live-source historical matrix 66 passed.
- Frontend typecheck: passed.
- Frontend regression: 103 passed across 10 suites, including cross-journey cancellation, provider-identity isolation, and finalized leader-receipt classification.
- Production Vite build: passed with the disclosed 815.19 kB minified-chunk warning.
- genvm-lint check, schema, and typecheck: passed; 25 methods, 13 views, 12 writes, zero constructor parameters.
- Python compilation: passed.
- git diff --check: passed.
- Configured-address production bundle check: passed.

## Frontend trust boundary

Public reads are wallet-free. Writes require explicit EIP-6963 selection of MetaMask, OKX Wallet, or Rabby and bind to the selected provider/account. Full reload starts disconnected. Transaction success requires the captured hash, FINALIZED state, execution SUCCESS, and authoritative contract readback. The contract address is injected at build time through VITE_GENLAYER_CONTRACT_ADDRESS and empty or invalid configuration fails closed.

## Release gates still required

GitHub public rendering, the exact current Vercel deployment, fresh external-wallet objection/readback, reload/disconnect, and reconnect have been verified. POST_DEPLOY_TEST is `APPROVED`; the remaining operational release gates are a fresh anonymous `POST_GITHUB_VERCEL_FINAL` review for the refreshed exact package and matching `DUAL_APPROVED`. No form submission is made by this project.
