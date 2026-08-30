# Studio E2E Evidence

Date: `2026-08-30`
Network: GenLayer Studionet, chain `61999`, full consensus, simulation disabled.
Contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`
Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75

## Live executable revision and review binding

- Live executable Git revision: `06d067ca97db7086643a678c02986169cc391e6e`
- Metadata follow-up: `5d413a886f44f1a363d3bc561b815bff845c00`
- Contract source: `contracts/policy_translation_release_gate.py`
- Exact source: `74,639` UTF-8 bytes; SHA-256 `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`
- Final on-chain source readback: `b6784931eed81b7ee33e48814cf53dabf6bae2fa21b57eb914cce7415c60eba1`
- Locked publisher/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`
- Independent localizer: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Independent consumer/auditor: `0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1`
- Final application/test package: `2c07257acd2e3299adc5bff20a3aee7dfd108455`

## Exact-source review and upgrade

- Executable source commit: `06d067ca97db7086643a678c02986169cc391e6e`
- Source: `74,639` UTF-8 bytes; SHA-256 `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`
- Specification snapshot: `.task/SPECIFICATION.md`; SHA-256 `6C4A036CE4248BD967071AA52A9CEC87336DBE23CEF96A49D36A9B56563ED8EF`
- Review status: PRE_DEPLOY `APPROVED`; upgrade receipt `0x5f5579eabab78edee329a9cdcb7f4cbbd7ac3c9d7cb11ffade526d26b7538100`, `FINALIZED / SUCCESS / MAJORITY_AGREE`; POST_DEPLOY_TEST `APPROVED`.

The live source bytes and readback above are bound to `06d...`/`B678...`. Historical rows remain disclosed; current decisive proof rows below were executed after the exact-source upgrade.

Current checks are: contract tests `73/73`; frontend typecheck pass; frontend tests `103/103` across 10 files; frontend production build pass with the existing minified-chunk warning; `genvm-lint check` pass with schema `25` methods (`13` views, `12` writes), zero constructor parameters; `genvm-lint typecheck` pass; Python compilation pass. The frontend cancellation-isolation, EIP-6963 provider-identity, and GenLayer transaction-finality/readback repairs are in application baseline `2c07257acd2e3299adc5bff20a3aee7dfd108455`; the current delta is contract/evidence metadata only.

All state-changing operations in the Studio matrix were submitted through Studio UI. The final external-wallet objection was submitted through the Vercel frontend; the observer script only performs read-only RPC calls and stores raw transaction/readback JSON under `.task/live-evidence/`.

## Populated final readback

The pre-external-objection observer snapshot in `.task/live-evidence/latest-readback.json` is retained as historical baseline; the current post-objection authoritative counts are recorded below and in the live matrix:

- Historical pre-upgrade profile snapshot: initialized `true`; owner `pcong5239`; repo `policy-translation-release-gate-fixtures`; admin `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`; active canonical `2`; canonical count `2`; candidate count `16`; objection count `4`; event count `63`.
- Current post-upgrade authoritative profile readback: candidate count `18`; objection count `4`; event count `69`; the exact upgrade/proof transactions and paginated readbacks are recorded below.
- Active canonical: id `2`, path `canonical-v2.md`, state `ACTIVE`, digest `5F18FA0632DCE5765BC4241676C80D45D9B72F7E18B123AC99456C169C8E71EB`.
- Canonical 1 is `SUPERSEDED`; canonical 2 is `ACTIVE`.
- Candidate 1 is `STALE_BY_CANONICAL_REVISION`; candidate 8 is `PUBLISHED` for canonical 2/es.
- Candidate 8 assessment: canonical/translation `AVAILABLE`, 3/3 matched sections, coverage `10000` bps, all 7 dimensions `EQUIVALENT`, outcome `MATERIALLY_EQUIVALENT`, `REVISION_REQUIRED` list empty.
- `studio-consumer/es` binding points to candidate 8, canonical 2, state `PUBLISHED`, `is_effective=true`.
- `get_effective_locale("es")` returns candidate 8 and the exact candidate source digest/path.
- Four objections are recorded; the external-wallet objection is ID `4` against candidate `16`, with the independent observer address and reason intact. Candidate 16 has three objections in its paginated readback.
- Fresh post-upgrade candidate `18` is `REVISION_REQUIRED` with assessment `AVAILABLE/AVAILABLE`, 3/3 sections, 10000 bps, exact changed dimensions `deadlines, thresholds`, outcome `SCOPE_OR_THRESHOLD_DRIFT`, and source-grounded deterministic reason.
- `get_upgrader()` returns the locked account.

## Live transaction evidence

The complete case-by-case matrix and all full transaction hashes are maintained in [STUDIO-LIVE-MATRIX.md](STUDIO-LIVE-MATRIX.md). The decisive rows are summarized here.

| Proof | Transaction(s) | Authoritative result |
|---|---|---|
| Equivalent candidate consensus | `0x37191953fe567d6e017c29bd097efb9aa033688b6b8ebbda15e28074b7c0a17a` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 1 accepted, 17 fields, 3 sections, 10000 bps |
| Independent objection | `0xe42348136c15bb4b47a8055ad7793c7362c196fdabe5b5d5d5902c08c2be04a2` | `FINALIZED / SUCCESS`; objection 1 retained on candidate 2 |
| Corrected obligation drift | `0xc811aace94aa1786495e01054e28455e0415968252819c8a78f48a0fc75a5163` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; outcome `OBLIGATION_DRIFT`, changed `deadlines, obligations`, candidate 2 revision required |
| Bounded right-loss recovery | `0xe9ce6150c7c756f54e2e34067999dd04dc0040314de237fb9e92dc8dfcc3da32` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; outcome `RIGHT_OR_EXCEPTION_LOSS`, candidate 3 revision required |
| Exact-source upgrade | `0x5f5579eabab78edee329a9cdcb7f4cbbd7ac3c9d7cb11ffade526d26b7538100` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; source readback exactly `B678...` and populated state preserved |
| Pre-upgrade corrected threshold/deadline proof | `0x4dd7d69da71528ede89a644262d109ceb423bc69960824a00a7b5e456ea8df17` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; `AVAILABLE/AVAILABLE`, 3/3, 10000 bps, exactly `deadlines, thresholds`, outcome `SCOPE_OR_THRESHOLD_DRIFT`, candidate 16 revision required |
| Prior-release external-wallet objection | [`0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001`](https://explorer-studio.genlayer.com/tx/0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001) | `FINALIZED / SUCCESS / MAJORITY_AGREE`; return `2`; objection ID `2` for candidate 16; executed before the final provider-identity frontend repair |
| Current exact-release external-wallet objection | [`0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b`](https://explorer-studio.genlayer.com/tx/0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b) | `FINALIZED / SUCCESS / MAJORITY_AGREE`; return `4`; objection ID `4` for candidate 16; submitted after exact package deployment `dpl_AcLC5FenPms81vhyZwh1eJTdG9Dh`; authoritative UI readback passed |
| Fresh candidate 18 registration | `0xfcd08c100bb435f5b26ce3c1b7f420bdccc89e480708ef87eb014047f3d95200` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; returned candidate 18 |
| Fresh candidate 18 freeze | `0xe5b7e1f9fcd3eae9b674c989f84249a3c4d48d6b64357327faf6f88708944f70` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 18 frozen |
| Fresh threshold/deadline proof | `0x8ca4c78a0168658d49f1544dbb9a3d833809c32645c67a6b40db07af4446770e` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 18 `REVISION_REQUIRED`, `AVAILABLE/AVAILABLE`, 3/3, 10000 bps, exactly `deadlines, thresholds`, `SCOPE_OR_THRESHOLD_DRIFT` |
| Missing evidence | `0xed692396eb786a085665702f9990251a5ad5e9aac361ee17e22c37602882903d` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; translation `MISSING`, outcome `NOT_COMPARABLE`, coverage 0 |
| Canonical supersession | `0x80d26af1f626784e858277ee2b03e0fdb4816ad5ede1186ee791764bdcc0498a`, `0x645cb057cccfe5d38b5b3085a3620851bc8a012e8205418cd10a4ea964a493a0` | canonical 1 superseded; canonical 2 active; old candidate/binding ineffective |
| Successor publish and rebind | `0x377623858e6401e4758b3aa17b3b84957bd2509a65941351d56640e32f12637f`, `0x12b68bb763bf716076442353257fbfa4cbc4e23b7d79a2032ca0fd41e5650bf4`, `0x75bc1518001692b1f642709a09396afa034033cf179bc7ba7e0c12cc9b2c3b7e` | candidate 8 published and independently rebound/effective |
| Negative validation controls | `0xf9cb...`, `0x33e5...`, `0x7344...`, `0x3dee...`, `0xb549...`, `0xd43a...` | full hashes and unchanged-state readbacks are in the matrix and raw evidence |

## Source restoration incident and exact parity

The first populated-state top-button upgrade, `0x1e484b14483fdfbf7b8df0a283572201dfaa3d092f697064d01b22ea71969169`, finalized with `MAJORITY_AGREE` but came from a stale Studio editor buffer. Read-only source observation identified deployed SHA `322F3278B95CADCD68427DB16E4405D947F22577844D654ACFA32BD743A78F34`; state remained populated, but this was a material source mismatch and is not hidden or treated as release evidence.

The exact local source was then loaded into the visible Studio editor and restored. Public `upgrade(bytes)` transaction `0xe676236385c4d3eefd5739acb2fce782c839c79e596cbf85b140b689e91a65d0` finalized `SUCCESS / MAJORITY_AGREE`; its raw calldata source body hashes exactly to `92A777...`. Studio code-upgrade transactions `0xef831609be9fb78aa866e94c69c665aabe02698bcab659f9cc3be9ce6522cd99`, `0xb5a5b98820b1aa876d0513df51bbe230d61275a9b6ef18484a412e77081f7eac`, and `0x067cf62b52aadae5750461dba29113e8f4e83969cf76cbb06db0806fd08afd4a` also finalized with exact 63,417-byte source payloads. The final observer readback proves source parity and preserved canonical/candidate/binding state.

Project source is public at `https://github.com/ldkfj/policy-translation-release-gate`. The base evidence package is `404a7ccf8b0b828c6be7b98cc1567e0e380c85c1`; the current public evidence package HEAD is `1c1902a08380ca5456637c0fc11c1cb247391ff0`. The refreshed production frontend is deployment `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi` at `https://policy-translation-release-gate.vercel.app`. Primary browser smoke, external-wallet objection/readback, and user reload/disconnect passed within the unchanged frontend scope; POST_GITHUB_VERCEL_FINAL, DUAL_APPROVED, submission, and experience-ledger update remain.
