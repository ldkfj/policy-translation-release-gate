# Deployment and Recovery Manifest

Status: POST_DEPLOY_TEST found a runtime blocker; corrected candidate requires fresh PRE_DEPLOY approval before any replacement deployment or upgrade.

## Runtime remediation candidate (2026-08-28)

- Candidate source SHA-256: `FD003AE8CE47B3C36C242A8887D0C6F0B7BCFCCE0C9FC022306A3205665F598C`.
- The existing deployment below remains diagnostic evidence, not a passed release.
- Unauthorized `initialize_publisher("unauthorized-test", "negative-case")` from `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902` produced transaction `0x4ced1b4ed41d554530f7ef1769a5253ed344b1a6ad872157e57d52e8fb0cd1b6`. It finalized but full execution reported `ERROR`, with `AttributeError: module 'genlayer.gl' has no attribute 'UserError'`; the simplified receipt's `success` was not execution proof.
- Root cause: contract rejection paths referenced `gl.UserError`, while the local fixture fabricated this missing alias. All contract/test references now use `gl.vm.UserError`; fixture aliases are removed. A regression asserts the alias remains absent.
- Scope: error namespace only; storage, ABI, consensus comparison, source boundaries and approved product behavior are unchanged. This is the existing contract work item's Codex takeover after two Claude attempts.
- Applicable experience: **Keep GenVM test doubles narrower than the real runtime**. Test conveniences must not invent production API members.
- Current verification: Python 3.13 with installed cloudpickle 3.1.2; 65 contract tests pass; `genvm-lint check` passes lint and semantic validation; schema remains 25 methods (13 view, 12 write), zero constructor args; typecheck and py_compile pass. Use `PYTHONIOENCODING=utf-8` and `GENVM_VERSION=v0.3.0-rc7` for the installed linter.
- Frontend regression: TypeScript passes, 99 tests across 10 files pass, production build passes with the existing 815.19 kB chunk warning. No frontend source changes in this correction.
- Locked Studio account was rechecked in the live account selector: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78` remains available and selected. No new transaction was sent before review.
- Official API: [Error Handling](https://docs.genlayer.com/developers/intelligent-contracts/features/error-handling), checked 2026-08-28. The dedicated UserError section specifies `gl.vm.UserError`; the actual deployed runtime corroborates that namespace despite inconsistent examples elsewhere.
- Required closure: fresh exact-revision PRE_DEPLOY approval, corrected source deployment/upgrade, authoritative source parity, rerun failed authorization and complete the bounded Studio matrix. No POST_DEPLOY_TEST approval, GitHub push or Vercel deployment is claimed.

## Locked deployment configuration

- Network: GenLayer Studionet, chain ID `61999`.
- Classification: `UPGRADABLE` using the native Root Slot code replacement path.
- Contract source: `contracts/policy_translation_release_gate.py`.
- Constructor arguments: none.
- Locked Studio deployer/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`.
- Role: the same Studio account deploys the contract and is registered by the constructor in `Root.get().upgraders`.
- Freeze choice: not frozen; the reviewed `upgrade(bytes)` path remains available only to a Root Slot upgrader.
- Linked contracts: none.
- Configuration transactions: none before deployment; the frontend address is wired only after verified deployment.
- Reviewed executable source commit: `d230059e0cec5a2196d70061731e5a079c7b6622`.
- Contract source SHA-256: `322F3278B95CADCD68427DB16E4405D947F22577844D654ACFA32BD743A78F34`.
- Specification SHA-256: `3CB5182CF978E048944B5FD7239D9F0A93E0A0EFF84CBBBD849A423557DD8D93`.
- Deployed contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
- Deployment transaction: `0xc9b344962bc468aed13375b4430ae6b434bcaebfb6af2e55fc8ec5a9a1b3f202`.
- Transaction execution hash: `0x56840bf97604c6867e542fbd8f336adf23c4cf45e0b1998090e83fd4326071c2`.
- Explorer: `https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`.
- Deployment closure: `FINALIZED`; receipt execution status `success`; deployed source SHA-256 `322F3278B95CADCD68427DB16E4405D947F22577844D654ACFA32BD743A78F34` exactly matches the approved source.
- Authoritative initial readback: publisher admin and sole reported upgrader are both `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`; profile is uninitialized with policy version `1` and all counts zero; active canonical is empty.

Changing the locked Studio account, source, constructor setup, network, or upgrade classification invalidates PRE-DEPLOY approval and requires a new review before any transaction.

## Deployment verification

After approval, deploy only the exact reviewed source with the locked Studio account. Record the transaction hash, contract address, Explorer links, finality, explicit execution success, deployed-source hash and authoritative view readbacks. Confirm the recorded account is the sole intended initial upgrader before running the bounded live matrix.

## Upgrade procedure

Use the locked Studio upgrader account and the contract's public `upgrade(bytes)` method with reviewed replacement source. Before upgrading, verify storage compatibility and run the complete local regression suite. After upgrading, prove finalized execution success, source parity, preserved publisher/canonical/candidate state and authoritative readbacks. An unauthorized account must remain unable to replace code.

## Recovery runbook

- Studio/local UI reset while chain state and the locked account remain available: reconnect the locked account, import the contract by its recorded address, load the exact recorded source revision, then verify state before any upgrade.
- Locked Studio account unavailable: the old contract may remain readable, but upgrade authority is lost. Do not claim recovery. Deploy a replacement from the recorded source/constructor manifest, rerun the full live matrix, and update every frontend and evidence link.
- Studionet/chain-state reset: the old address and state cannot be recovered. Redeploy from the recorded source and constructor manifest, rerun all required live tests, and replace frontend, Explorer and release evidence references.
- Failed or ambiguous deployment: retain the transaction hash, reconcile finality and execution result, and do not redeploy until terminal failure is proven. Never submit a duplicate while the first outcome is unknown.

No private key, seed phrase, token or credential belongs in this manifest.

## Schema and runtime compatibility evidence

Retrieval date: `2026-08-28`. The candidate was checked against the current official GenLayer documentation for [storage](https://docs.genlayer.com/developers/intelligent-contracts/storage), [equivalence](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle), [testing](https://docs.genlayer.com/developers/intelligent-contracts/testing), [`genlayer-test`](https://docs.genlayer.com/api-references/genlayer-test), [messages/interfaces](https://docs.genlayer.com/developers/intelligent-contracts/features/messages), [Studio limitations](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio/limitations), [networks](https://docs.genlayer.com/developers/genlayer-network/networks), and the current Studio deployment workflow. The source header remains the current project dependency selected by the linter/runtime: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.

Tool/runtime record:

- `genvm-lint 0.11.0`; `genvm-lint check`, `schema`, and `typecheck` pass on the exact contract source.
- Schema discovers a zero-argument constructor and 25 public methods: 13 views and 12 writes, matching the specification and frontend callers.
- Python `3.12`; `cloudpickle 3.1.2`; the test harness serializes/deserializes each leader closure, validator closure, and leader result before validator execution.
- The linter reports a newer optional runner hash. Disposition: disclosed warning, not an automatic dependency change. Control: current source passes the installed current linter's lint, SDK semantic validation, schema, typecheck, Python compilation, production-shaped serialization tests, and the full regression suite. Any runner/header change is material and requires a new exact-source review.

Storage/ABI inventory:

- Scalar contract fields use `Address`, `str`, `bool`, `u32`, and `u64`; no persisted bare Python `int` or `float` is used.
- Six custom persisted records use the current `@allow_storage` plus `@dataclass` form: `CanonicalRevision`, `TranslationCandidate`, `AssessmentRecord`, `ConsumerBindingRecord`, `ObjectionRecord`, and `EventRecord`.
- Fully instantiated persistent maps: `TreeMap[u32, CanonicalRevision]`, `TreeMap[u32, TranslationCandidate]`, `TreeMap[u32, AssessmentRecord]`, `TreeMap[str, ConsumerBindingRecord]`, two `TreeMap[str, u32]`, `TreeMap[u32, u32]`, and `TreeMap[str, str]`.
- Fully instantiated arrays: `DynArray[ObjectionRecord]` and `DynArray[EventRecord]`. Top-level runtime-managed collections are not reassigned in the constructor.
- Every map crossing a public return boundary is converted into JSON-compatible dictionaries with string keys. Addresses return as canonical hex strings except `get_upgrader`, whose declared ABI return is `Address`. Counts/timestamps are losslessly handled as sized integers on-chain and decimal-string/BigInt values in the frontend. Coverage uses integer basis points; no currency or value transfer exists.

Nondeterministic and serialization inventory:

- `_fetch_and_validate_evidence` performs bounded immutable-commit GitHub API/raw reads via `gl.nondet.web.get`; `_evaluate_section_pair` uses `gl.nondet.exec_prompt` with an exact seven-dimension schema. After the retained live drift-consensus failure, the axes were clarified as non-overlapping and label-only `NOT_APPLICABLE` is normalized to `EQUIVALENT`; substantive changes, exact section bands, outcome, fingerprint and independent validator re-derivation remain strict.
- `assess_translation` and `retry_unresolved` wrap all nondeterminism in `gl.vm.run_nondet_unsafe`. Before closure creation, storage-backed values are copied into primitive immutable local strings; no storage proxy or custom persisted object is captured.
- Each validator independently refetches and re-derives the complete assessment and compares all 17 consequence-bearing fields, including fingerprint, outcome, dimensional results, coverage, source identities, and bounded reason. Exceptions, malformed evidence, unavailable evidence, and disagreement fail closed; state mutates only after consensus returns.
- The test fixture uses real `cloudpickle` round trips for leader, validator, and returned assessment data. The full nondeterministic suite therefore exercises closure/result serialization as well as agreement, deliberate material disagreement, malformed/overlong model output, HTTP failures, source mismatch, retry, and safe outcomes.

Linked-interface and Studio declaration:

- No linked Intelligent Contract, EVM contract, EOA message, child transaction, value transfer, or custom calldata boundary exists.
- Studio evidence will be claimed only for this contract's own deployment, consensus transactions, finality/execution result, and authoritative state readbacks. No unsupported chain-layer, ghost-contract, or EVM behavior is advertised.
- Known non-blocking frontend warning: the production main bundle is approximately `815.20 kB`. It does not alter contract schema/runtime behavior; frontend functional, type, and production-build gates remain mandatory.
