# Policy Translation Release Gate

Policy Translation Release Gate is a GenLayer Studionet application that prevents a localized policy from being published until independent validator consensus confirms that its meaning remains materially equivalent to the canonical policy.

## Verified links

- Live app: [policy-translation-release-gate.vercel.app](https://policy-translation-release-gate.vercel.app)
- Source repository: [ldkfj/policy-translation-release-gate](https://github.com/ldkfj/policy-translation-release-gate)
- Studionet contract: [0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75](https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75)
- Network: [GenLayer Studionet](https://studio.genlayer.com/) (61999)
- Fixture repository: [pcong5239/policy-translation-release-gate-fixtures](https://github.com/pcong5239/policy-translation-release-gate-fixtures)

The live contract is bound to executable source commit `5d50e4fc8f2f6f77bc09fb8a7fc205021d7bc09e`, source SHA-256 `55262740969342C0721A6DC6A4282708E86B7B74D2C71363B7BC2305FA169738` (66,182 UTF-8 bytes), and the matching on-chain code readback. The final release package records the exact documentation revision and live evidence in docs/VERIFICATION.md.

The exact final application/test package is public commit `2c07257acd2e3299adc5bff20a3aee7dfd108455`. It contains the production frontend repairs, GenLayer transaction-finality recovery, and regression coverage used by the verified Vercel deployment.

## Trust problem

Publishers, localizers, and consumers do not share the same incentives. A translation can look fluent while weakening a right, omitting an obligation, changing an exception, or altering a deadline or threshold. A central release operator can also claim that a review happened without leaving a durable, independently checkable record.

This project makes the source documents, semantic decision, release state, consumer binding, and objections auditable on-chain. A translation is not publishable merely because one operator says it is correct.

## Why GenLayer is essential

The decisive operation is semantic comparison of two immutable GitHub commit artifacts. The contract cannot reduce this operation to a deterministic hash comparison: validators independently refetch the declared raw files, derive the same bounded 17-field result, and use gl.nondet.exec_prompt to classify seven non-overlapping legal consequence dimensions. GenLayer consensus compares the validator results before the contract mutates the candidate state.

The on-chain consequence is strict: only a candidate whose consensus outcome is MATERIALLY_EQUIVALENT, whose evidence is available, and whose canonical revision is active can pass the release gate and become PUBLISHED.

## How it works

The frontend exposes six connected journeys:

1. **Publisher** registers and activates a canonical policy revision, identified by a Git commit, path, and SHA-256 digest.
2. **Localizer** registers a translation candidate, updates its draft metadata, and freezes it for assessment.
3. **Assess** triggers GenLayer intelligent validator consensus, displays all 17 result fields and seven dimensional statuses, and supports bounded recovery of unresolved assessments.
4. **Publish** applies the release gate. A candidate can become PUBLISHED only after an accepted assessment and active-canonical checks.
5. **Consumer** binds a namespace and locale to a published candidate, then resolves exact and base-locale fallbacks.
6. **Public Audit** records objections, displays paginated objections and contract events, and shows the locked upgrade authority.

The deployed instance has canonical revision 2 active and candidate 8 published for es; the exact state and transaction matrix are in docs/STUDIO-LIVE-MATRIX.md.

## Architecture

The Intelligent Contract owns authorization, immutable source identity, canonical and candidate state machines, consensus results, publication guards, consumer bindings, objections, events, and upgrade authority. The frontend owns discovery, input validation, wallet interaction, read presentation, and transaction lifecycle UX. It never replaces contract authority.

Public reads are wallet-free and use one bounded Studionet read client. Writes bind to the exact user-selected EIP-6963 provider and account. The chain is the source of truth for state, finality, execution result, and post-write readback; GitHub is the source of truth for the declared document bytes.

## Intelligent Contract

- **Actors:** locked publisher/admin for canonical registration and publication; localizers own their drafts; any valid account may submit an eligible candidate, bind a consumer namespace, or record an objection.
- **State:** canonical revisions move through ACTIVE and SUPERSEDED; candidates move through draft, frozen, assessment, revision, accepted, published, stale, or unresolved states.
- **Evidence:** commit hashes, safe relative paths, SHA-256 digests, section identifiers, locale, and client nonces are validated on-chain.
- **Consensus:** validators independently fetch and compare the canonical and translation artifacts, then return the same structured 17-field decision before state mutation.
- **Recoverability:** the contract uses the native upgradable Root Slot path; the current upgrader is read back from the deployed instance. The recovery chronology and stale-editor incident are disclosed in docs/DEPLOYMENT-RECOVERY.md.

## Transaction lifecycle

The frontend validates inputs, checks the selected account and chain, captures one transaction hash, and presents explicit phases: awaiting signature, submitted, consensus pending, finalized, execution result, authoritative readback, and success. It does not label a write successful from a wallet response alone. A pending or ambiguous hash is retained for reconciliation and is never silently resubmitted.

## Run locally

Prerequisites are Python with the installed GenLayer test tooling and Node.js/npm. From the repository root:

~~~bash
cd frontend
npm install

# Set a real Studionet address for live reads/writes; empty values fail closed.
# PowerShell: $env:VITE_GENLAYER_CONTRACT_ADDRESS="0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75"
# POSIX shell: export VITE_GENLAYER_CONTRACT_ADDRESS=0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75
npm run dev
~~~

The frontend requires an explicit EIP-6963 selection among MetaMask, OKX Wallet, and Rabby for writes. It starts disconnected after each full reload and never falls back to a global injected provider.

## Tests and verification

~~~bash
# repository root
python -m pytest

# frontend/
npm run typecheck
npm run test:run
npm run build
~~~

The exact deployed package records 71 contract tests, 103 frontend tests across 10 suites, clean typecheck, successful production build, genvm-lint check/schema/typecheck/validate passes, and successful Python compilation. The Vite build reports a disclosed minified-chunk size warning; it does not change correctness or source parity. The exact-source upgrade, threshold proof, and current exact-release external-wallet objection are recorded in the live transaction matrix.

## Deployment

The contract runs on GenLayer Studionet chain 61999 at [the verified Explorer address](https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75), with RPC endpoint https://studio.genlayer.com/api. The frontend must be built with VITE_GENLAYER_CONTRACT_ADDRESS set to that exact address. Source parity, final readback, recovery records, and the bounded live proof matrix are maintained in docs/VERIFICATION.md, docs/STUDIO-EVIDENCE.md, and docs/STUDIO-LIVE-MATRIX.md.

## Security and trust boundaries

- The contract validates all declared paths, digests, commit hashes, locales, nonces, evidence, state transitions, and authorization.
- Validator code refetches the declared immutable artifacts and compares all consequence-bearing fields before mutation.
- The frontend uses strict runtime decoders, lossless integer handling, bounded FIFO RPC access, safe caching, backoff, finality checks, and method-specific readback.
- Supported injected wallets are exactly MetaMask (io.metamask), OKX Wallet (com.okex.wallet/com.okx.wallet), and Rabby (io.rabby). No private key, seed phrase, token, or Studio credential is part of the frontend.
- The source restoration incident caused by a stale Studio editor buffer is retained as adverse evidence; the live source hash and pending source hash are stated separately and must not be conflated.

## Known limitations

- The deployed instance intentionally binds publisher/admin and Root Slot upgrade authority to the selected Studio account. Publisher-only registration and publication writes therefore require that authority; a fresh external wallet can use the public reads and non-admin journeys but must not import the Studio account.
- Historical threshold fixtures that also removed a deletion/restriction right are retained as negative controls. Corrected immutable fixture `es-threshold-drift-v3.md` produced a live `SCOPE_OR_THRESHOLD_DRIFT` result with only `deadlines` and `thresholds` changed.
- The final stable Vercel URL is `https://policy-translation-release-gate.vercel.app`. The current exact-release external-wallet objection is finalized and read back on-chain; reload/disconnect confirmation and the fresh final reviewer remain the only release gates documented in `docs/VERIFICATION.md`.
