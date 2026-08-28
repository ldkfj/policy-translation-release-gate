# Verification

This document is the compact judge-facing verification record for Policy Translation Release Gate. Detailed live transaction rows and recovery chronology remain in the linked documents below.

## Exact source and live contract

- Executable source: contracts/policy_translation_release_gate.py
- Exact executable Git revision: 1a26dccf6ca8a69eb5ebd6812184d40cdbd2a1b0
- Exact source length: 63,417 UTF-8 bytes
- Exact source SHA-256: 92A77792DBD393E7DAFBA5C6127791E2D9C04999A5B3B826354782FB0B0DE35F
- Network: GenLayer Studionet, chain 61999
- Contract: 0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
- RPC: https://studio.genlayer.com/api
- Constructor: no arguments
- Deployment class: UPGRADABLE native Root Slot
- Locked publisher/upgrader: 0x34b92E6553eaCA11A00A9d86d75d8a7881779D78

The deployed source readback is the lowercase form of the exact SHA above. The release package commit is the Git commit containing this verification record; the final public URL and commit are recorded in the release handoff after GitHub push.

## Live state readback

The final read-only Studionet observer readback records:

- initialized profile; active canonical revision 2; canonical revision 1 SUPERSEDED;
- 8 translation candidates and 1 recorded objection;
- candidate 8 PUBLISHED for canonical 2 and locale es;
- candidate 8 assessment MATERIALLY_EQUIVALENT, 3/3 sections, 10000 bps coverage, and all 7 consequence dimensions EQUIVALENT;
- studio-consumer/es bound to candidate 8 and effective;
- 37 contract events;
- get_upgrader() equal to the locked authority.

The complete transaction matrix, including expected failures, disagreement controls, invalid external-fetch controls, source restoration, and authoritative readbacks, is in [STUDIO-LIVE-MATRIX.md](STUDIO-LIVE-MATRIX.md). The narrative evidence is in [STUDIO-EVIDENCE.md](STUDIO-EVIDENCE.md). Recovery and incident handling are in [DEPLOYMENT-RECOVERY.md](DEPLOYMENT-RECOVERY.md).

## Local verification

- Contract regression: 66 passed.
- Frontend typecheck: passed.
- Frontend regression: 99 passed across 10 suites.
- Production Vite build: passed with the disclosed 815.23 kB minified-chunk warning.
- genvm-lint check, schema, and typecheck: passed; 25 methods, 13 views, 12 writes, zero constructor parameters.
- Python compilation: passed.
- git diff --check: passed.
- Configured-address production bundle check: passed.

## Frontend trust boundary

Public reads are wallet-free. Writes require explicit EIP-6963 selection of MetaMask, OKX Wallet, or Rabby and bind to the selected provider/account. Full reload starts disconnected. Transaction success requires the captured hash, FINALIZED state, execution SUCCESS, and authoritative contract readback. The contract address is injected at build time through VITE_GENLAYER_CONTRACT_ADDRESS and empty or invalid configuration fails closed.

## Release gates still required

The final Vercel URL, user-executed external-wallet E2E result, post-push GitHub rendering check, and anonymous POST_GITHUB_VERCEL_FINAL verdict must be added before DUAL_APPROVED. No form submission is made by this project.
