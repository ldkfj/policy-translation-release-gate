# Resume Checkpoint — UPGRADED / STUDIO E2E PARTIAL

Date: 2026-08-28

- Exact approved revision: `b3d3eb7adbb07b8fbf18a3fc62bd9a95025e7f68`.
- Anonymous reviewer Task: `codex://threads/01a0393a-00d9-7bd2-a5b2-60278c55bb1a`.
- PRE_DEPLOY verdict: `APPROVED` for the exact revision above.
- Contract SHA-256: `322F3278B95CADCD68427DB16E4405D947F22577844D654ACFA32BD743A78F34`.
- Specification SHA-256: `3CB5182CF978E048944B5FD7239D9F0A93E0A0EFF84CBBBD849A423557DD8D93`.
- Locked Studio deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Classification: `UPGRADABLE`, native Root Slot.
- Verified before approval: 64 contract tests including production-shaped cloudpickle boundaries; GenVM lint/schema/typecheck; 98 frontend tests; TypeScript typecheck; production build; clean tracked worktree.
- Deployed contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
- Deployment tx: `0xc9b344962bc468aed13375b4430ae6b434bcaebfb6af2e55fc8ec5a9a1b3f202`; `FINALIZED`; receipt `success`; exact deployed-source SHA-256 match.
- Initial authoritative readback confirms locked admin/upgrader, policy version `1`, uninitialized profile, zero counts, and no active canonical.
- No GitHub push, Vercel deployment, or submission has occurred.

Current executable revision: `e8c4277e908fa08c03eb571ff2a2c4d8ffccec97`, independently PRE_DEPLOY APPROVED. Exact-source upgrade `0xb4d3df5145ffd67c1bd8e2a4bcdc1a62320d3a9521ee65e2bbd2a96a4c23ad29` is FINALIZED with SUCCESS and matching source SHA-256 `FD003AE8CE47B3C36C242A8887D0C6F0B7BCFCCE0C9FC022306A3205665F598C`. Three negative controls have finalized with expected rejection and unchanged state. Full transactions, readbacks and retained original defect are in `docs/STUDIO-EVIDENCE.md`.

Fixture-only publication was explicitly authorized and completed: `pcong5239/policy-translation-release-gate-fixtures`, immutable commit `3c7431f10d5349c35e82ea400d84442c53b441f0`. This does not authorize release-source push or Vercel.

Publisher initialization, canonical v1 registration and activation finalized successfully. Canonical 1 is ACTIVE. Localizer `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902` created candidate 1 (`studio-es-v1`), updated its draft from the v2 fixture to `es-equivalent-v1.md`, then froze it. These three transactions finalized with SUCCESS and matching readback:

- Register: `0xf98359e50921679c9227b46abdf40895ad9a529ffe774fa9370a41982a563772`
- Draft update: `0x829e82002e5988fe8f6581eb2badcca41df426372ba7484e26e7c4101cf936b2`
- Freeze: `0x42be4da5ed277642684e6924b0e768988501e6b80668fc869a358c42c2686ccd`

Assessment `0x37191953fe567d6e017c29bd097efb9aa033688b6b8ebbda15e28074b7c0a17a` finalized SUCCESS/MAJORITY_AGREE; candidate 1 MATERIALLY_EQUIVALENT then published and bound effectively. Candidate 2 was registered, independently objected to, frozen, then assessment `0x0819097c27405f2ec6218d5803bf26d2051073ed077abea5ee0f76b954b28609` finalized MAJORITY_DISAGREE; candidate remains FROZEN, attempts 0, no assessment. None pending. Full details and next-action constraints: `.task/STUDIO-BLOCKERS-2026-08-28.md`. Full Studio E2E is incomplete. A user-approved publisher authority amendment is also needed for the advertised independent-wallet web journey; no permission inferred and no source changed.

Any source, account, network, constructor, or upgrade-classification change invalidates this PRE_DEPLOY approval.
