# Deployment and Recovery Manifest

Status: PRE-DEPLOY draft. No transaction has been signed or sent.

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
- Reviewed source commit: `25312f7b8fc6045c0a9d44b1a7bb018bf412c7f0`.
- Contract source SHA-256: `88897A97DA0E71D369D985F07E8DCE60930AF883E2114977129D749249E94028`.
- Specification SHA-256: `3CB5182CF978E048944B5FD7239D9F0A93E0A0EFF84CBBBD849A423557DD8D93`.
- The final manifest adds the deployed contract address, deployment transaction and Explorer URL.

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

- `_fetch_and_validate_evidence` performs bounded immutable-commit GitHub API/raw reads via `gl.nondet.web.get`; `_evaluate_section_pair` uses `gl.nondet.exec_prompt` with an exact seven-dimension schema.
- `assess_translation` and `retry_unresolved` wrap all nondeterminism in `gl.vm.run_nondet_unsafe`. Before closure creation, storage-backed values are copied into primitive immutable local strings; no storage proxy or custom persisted object is captured.
- Each validator independently refetches and re-derives the complete assessment and compares all 17 consequence-bearing fields, including fingerprint, outcome, dimensional results, coverage, source identities, and bounded reason. Exceptions, malformed evidence, unavailable evidence, and disagreement fail closed; state mutates only after consensus returns.
- The test fixture uses real `cloudpickle` round trips for leader, validator, and returned assessment data. The full nondeterministic suite therefore exercises closure/result serialization as well as agreement, deliberate material disagreement, malformed/overlong model output, HTTP failures, source mismatch, retry, and safe outcomes.

Linked-interface and Studio declaration:

- No linked Intelligent Contract, EVM contract, EOA message, child transaction, value transfer, or custom calldata boundary exists.
- Studio evidence will be claimed only for this contract's own deployment, consensus transactions, finality/execution result, and authoritative state readbacks. No unsupported chain-layer, ghost-contract, or EVM behavior is advertised.
- Known non-blocking frontend warning: the production main bundle is approximately `815.20 kB`. It does not alter contract schema/runtime behavior; frontend functional, type, and production-build gates remain mandatory.
