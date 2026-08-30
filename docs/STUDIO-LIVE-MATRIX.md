# Studio Live Matrix

Status: exact-source upgrade, required Studionet matrix, and POST_DEPLOY_TEST approval are complete. Existing GitHub/Vercel/browser evidence remains available; refreshed POST_GITHUB_VERCEL_FINAL review remains pending.

Date: `2026-08-30`
Network: GenLayer Studionet, chain `61999`, full-consensus mode.
Contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`
Explorer: https://explorer-studio.genlayer.com/address/0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75

## Live executable binding

- Git revision: `06d067ca97db7086643a678c02986169cc391e6e`
- Metadata follow-up: `5d413a886f44f1a363d3bc561b815bff845c00`
- Contract source: `contracts/policy_translation_release_gate.py`
- Exact UTF-8 source length: `74,639` bytes
- Exact source SHA-256: `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`
- Final observer code readback: `b6784931eed81b7ee33e48814cf53dabf6bae2fa21b57eb914cce7415c60eba1`
- Locked Studio publisher/upgrader: `0x34b92E6553eaCA11A00A9d86d75d8a7881779D78`
- Independent localizer: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`
- Independent consumer/auditor: `0x22A2906BB59A1DFaEEAD6148eba7dB24d6F22FB1`

## Review and upgrade binding

- Executable source commit: `06d067ca97db7086643a678c02986169cc391e6e`
- Source: `74,639` UTF-8 bytes; SHA-256 `B6784931EED81B7EE33E48814CF53DABF6BAE2FA21B57EB914CCE7415C60EBA1`
- Specification snapshot SHA-256: `6C4A036CE4248BD967071AA52A9CEC87336DBE23CEF96A49D36A9B56563ED8EF`
- Fresh PRE_DEPLOY status: `APPROVED`; exact-source upgrade `0x5f5579eabab78edee329a9cdcb7f4cbbd7ac3c9d7cb11ffade526d26b7538100` finalized `SUCCESS / MAJORITY_AGREE`; POST_DEPLOY_TEST `APPROVED`.
- Final application/test package: `2c07257acd2e3299adc5bff20a3aee7dfd108455`.

The current live evidence is bound to source `06d...`/`B678...`. Local regression is contract `73/73`, frontend `103/103`, lint/schema/typecheck/validate/compile/build pass.

## Immutable fixture manifest

The public fixture repository is fixture-only: [pcong5239/policy-translation-release-gate-fixtures](https://github.com/pcong5239/policy-translation-release-gate-fixtures). The corrected threshold fixture is immutable at commit `957a4521f155d24cfc8291a98782314c78239f8b`; this does not authorize project-source release.

| Fixture path | SHA-256 | Live purpose |
|---|---|---|
| `canonical-v1.md` | `054A2E6A4365D31430CE53770B4FCE9F98CDC1D49C0E5AD3FDA47971BEC90186` | canonical v1 |
| `es-equivalent-v1.md` | `24B16304995EBBA7BA1009190FE81B83C0A6779ACB36C636243CDF0878197828` | equivalent v1 |
| `fr-obligation-drift-v1.md` | `7F9DC3EFA2E39775DECD22CE98AAC214E3717C7E985ABD716C4C6072B6818928` | obligation drift |
| `de-right-loss-v1.md` | `5563239C1A723AFF01536424DB91B7864B62D9FEA39BB8758687A98B0C32472F` | right/exception loss |
| `es-scope-threshold-drift-v1.md` | `65425EFFEC8CBB5E84444FEC6355FBC84E323C8E476AA7F46463CD44BB409494` | scope fixture; also changes rights, so retained as a disagreement case |
| `canonical-v2.md` | `5F18FA0632DCE5765BC4241676C80D45D9B72F7E18B123AC99456C169C8E71EB` | successor canonical |
| `es-equivalent-v2.md` | `50FD2C1E2A8B2F963CFC6FEC76AEF0DCF846E026A5B735E98D1E2875D29585E4` | successor equivalent |
| `es-threshold-drift-v1.md` | `44901DF08E1C3F8F6597E230B1E4B5F6B7C6BCF305B1BE1E19FD02D2C48DFB03` | validator/environment invalidity control |
| `es-threshold-drift-v2.md` | `44901DF08E1C3F8F6597E230B1E4B5F6B7C6BCF305B1BE1E19FD02D2C48DFB03` | successor threshold invalidity control |
| `es-threshold-drift-v3.md` | `A00C15AB7A6296BC58C13F6AD264DE6F2BA40206689C35FDCF4A8B1B1D2906EA` | corrected threshold/deadline-only live PASS fixture |
| `missing-evidence-v1.md` | all-zero declared digest | missing-evidence control; intentionally unavailable |

## Executed matrix

Every row below was sent through Studio UI and independently checked with read-only SDK RPC observation. Full hashes and raw/readback JSON are retained under `.task/live-evidence/`.

### Base lifecycle and authorization

| Case | Transaction | Result |
|---|---|---|
| Initialize publisher | `0xe6abbfe2434862cf113cc891658deea37f8414de921aa670b0ff0b3c95f5cacd` | `FINALIZED / SUCCESS`; owner `pcong5239`, fixture repo bound |
| Register canonical v1 | `0x50e8c9ee21c902a1d4701fed2cc12e1d8ca09ff899fcc478d0683be1b1f62259` | `FINALIZED / SUCCESS`; id 1 |
| Activate canonical v1 | `0x3a4d9fc47c97f715352232ff64709a72149dd0343bdb2e11db9b33e7be01d7f8` | canonical 1 `ACTIVE` |
| Register/update/freeze equivalent v1 | `0xf98359e50921679c9227b46abdf40895ad9a529ffe774fa9370a41982a563772`, `0x829e82002e5988fe8f6581eb2badcca41df426372ba7484e26e7c4101cf936b2`, `0x42be4da5ed277642684e6924b0e768988501e6b80668fc869a358c42c2686ccd` | candidate 1 `FROZEN`; digest readback exact |
| Assess equivalent | `0x37191953fe567d6e017c29bd097efb9aa033688b6b8ebbda15e28074b7c0a17a` | `FINALIZED / SUCCESS / MAJORITY_AGREE`; `MATERIALLY_EQUIVALENT`, 17 fields, 3/3 sections, 10000 bps |
| Unauthorized publish | `0xa07f05390187534b54806091db4f3077923a56d164d14adf793a7d9d799c1f82` | expected rollback `UNAUTHORIZED_PUBLISHER` |
| Publish and bind equivalent v1 | `0x34db1697769392ce97923e3dd8b1951493836e44476661e910ffe641d7508499`, `0xb2c07aafe04ac2564c0fe54c9b432232b9cd480fa5f10487880e80b4257f4fc8` | candidate 1 published; independent namespace binding effective |

### Drift, objections and fail-closed evidence

| Case | Transaction(s) | Result |
|---|---|---|
| Obligation drift candidate | `0x7f148ff22696e43cf3d751c50049543c0e1ed9ef7712ad96e0482224af19f50b`, `0xe42348136c15bb4b47a8055ad7793c7362c196fdabe5b5d5d5902c08c2be04a2`, `0xa398ce2afb121d0ea5abdb202c1b6a01e5691731cb117422f96a23b5da569384` | candidate 2 registered, objected to by independent observer, frozen |
| Historical disagreement retained | `0x0819097c27405f2ec6218d5803bf26d2051073ed077abea5ee0f76b954b28609` | `FINALIZED / MAJORITY_DISAGREE`; no state mutation, no duplicate submitted |
| Corrected obligation drift | `0xc811aace94aa1786495e01054e28455e0415968252819c8a78f48a0fc75a5163` | `SUCCESS / MAJORITY_AGREE`; `OBLIGATION_DRIFT`, changed `deadlines, obligations`, candidate 2 `REVISION_REQUIRED` |
| Publication guard | `0x7312c0c8e13b93ecd1957149147df0fe1bd517bd28734ccd67cdcfb03b58f735` | expected rollback `CANDIDATE_NOT_ACCEPTED` |
| Right/exception loss | `0x80decddfd7579a5da4c878317c8b05207a59a2f40e1fd3d7e50cf86dbc854784`, `0xc75f55664620d6a3eff392db1774e81e5de79cdd5334cc43519a039130e04c2e`, `0xac8926b4f20f5fda392a0035c41be3a14bcbbe982967986371f8b5edddb4a0fc`, `0xe9ce6150c7c756f54e2e34067999dd04dc0040314de237fb9e92dc8dfcc3da32` | first assessment disagreed; bounded recovery finalized `RIGHT_OR_EXCEPTION_LOSS`, changed `deadlines, exceptions, obligations, rights, scope`, candidate 3 `REVISION_REQUIRED` |
| Scope fixture | `0x90dd5c6a9558f3f6d969f8ed84b3c22e65d8369186672931073d7c48b25361d4`, `0xbf163009d584bf14e7789daac195334e55f12a101ba44de07006f6d166184f56`, `0x557618e0a797f469030207f1fca9738eb4a0660055b278b9650e92966edc17f0` | `FINALIZED / MAJORITY_DISAGREE`; retained because fixture also alters rights |
| Missing evidence | `0xd6866d54c71c6643d1a6ece9f5836a20cbeac376fe592628d3b30028b102b088`, `0x7ae0daeb04cfedd8abd0a7beb744742626f2ae1801db92d3b63e309151162445`, `0xed692396eb786a085665702f9990251a5ad5e9aac361ee17e22c37602882903d` | register/freeze `SUCCESS`; assessment `NOT_COMPARABLE`, translation `MISSING`, coverage 0, candidate 6 `REVISION_REQUIRED` |
| Threshold v1/v2 environment control | `0x8dcad0cd96318aa7cc3ca0f5fed0d5ce5aa9cf549919d8b56a1625758659da27`, `0xd8864f938f15662df0bf9577a2f7bb7404914221e51d9c1095b6a5d6a744643e`, `0x7d8cfd5e78aa906882e4620fa1ae58ce2dea9448cc651aa0bbd5ff4917943459`, `0x6051ce81e83633b863ccbf4911d860cf203c948b1c840ec7957a4f3b80e4a9dd`, `0xd9f3ae2ad5623e7fb04d10b4bf1e17af2f25b6aa3059b965b2d423ab0799a74a`, `0x1426e3a01d29e4d855453d3014c7a7bd8bbda92edc5a3945889bd32e4540ff6d` | both assess transactions `NOT_COMPARABLE`, canonical/translation `INVALID`, coverage 0; retained as validator external-fetch/environment evidence, not a threshold PASS claim |
| Corrected threshold/deadline proof | register `0x75fcd92fb919e9eeb2844b197fe34fc8af575f0777baa22956c012a03c8c9148`; idempotent duplicate no-op `0xea257a86ff1b908b12bba82359916c6f991b3da64068854ae88eb1a35e9beadc`; freeze `0xc0232192b8b8ff48183519c4b488455e152d776a311864b557bc408474da8508`; assess `0x4dd7d69da71528ede89a644262d109ceb423bc69960824a00a7b5e456ea8df17` | assess `FINALIZED / SUCCESS / MAJORITY_AGREE`; `AVAILABLE/AVAILABLE`, 3/3, 10000 bps, changed exactly `deadlines, thresholds`; `SCOPE_OR_THRESHOLD_DRIFT`; candidate 16 `REVISION_REQUIRED` |
| Post-upgrade unresolved control | register `0x1ad33440fad343da3b0f4b171db0eccd7db53a94b2eceb5049a4cd13a279dfd5`; freeze `0x76586596838c15d504401e0f73dd44c7fb3fd133d358c1c9be0ab9773ce09e5b`; assess `0x51d3e42899f2f3d4cb80e456d1be76f161687fcda4c0b0d14da67ed4da5a0fa9` | all finalized; assessment `UNRESOLVED` due evidence unavailable; candidate 17 `HOLD_UNRESOLVED`; retained as bounded infrastructure control |
| Fresh post-upgrade threshold/deadline proof | register `0xfcd08c100bb435f5b26ce3c1b7f420bdccc89e480708ef87eb014047f3d95200`; freeze `0xe5b7e1f9fcd3eae9b674c989f84249a3c4d48d6b64357327faf6f88708944f70`; assess `0x8ca4c78a0168658d49f1544dbb9a3d833809c32645c67a6b40db07af4446770e` | all `FINALIZED / SUCCESS / MAJORITY_AGREE`; candidate 18 `REVISION_REQUIRED`; `AVAILABLE/AVAILABLE`, 3/3, 10000 bps, changed exactly `deadlines, thresholds`; `SCOPE_OR_THRESHOLD_DRIFT` |

### Negative controls and canonical supersession

| Case | Transaction | Result |
|---|---|---|
| Unauthorized canonical register | `0xf9cb3734dd618b7dd4a99a4b2cb6cd922156c8503d66d19874b75748cfa36b41` | expected `UNAUTHORIZED_PUBLISHER`; profile unchanged |
| Unsafe path | `0x33e5b16cb3d9f9e13beb89e5a8384e355a74366ed290ccfee99c3589d6288d41` | expected `INVALID_PATH`; readback unchanged |
| Invalid digest | `0x7344a4b1434f8b5db689ff7f24d3a70711ff699d951f25da1c375fe844597c51` | expected `INVALID_DIGEST`; readback unchanged |
| Nonce collision | `0x3dee58a23cdc8fb77d6e7b0e66d6e791879234aa67629e0979a56c179b593333` | expected `NONCE_REUSED_WITH_DIFFERENT_PAYLOAD`; readback unchanged |
| Duplicate candidate | `0xb54909927a578dd411be0f255abf7ec76d8b1b26d52da8952a6027766fefb52f` | expected `DUPLICATE_CANDIDATE`; readback unchanged |
| Locale cap | `0xd43a47a5028144a6de5ce382c249a150d45e6db5de7c0c9c73f599d18cffe8e5` | expected `MAX_LOCALES_CAP_EXCEEDED`; counts unchanged |
| Register/activate canonical v2 | `0x80d26af1f626784e858277ee2b03e0fdb4816ad5ede1186ee791764bdcc0498a`, `0x645cb057cccfe5d38b5b3085a3620851bc8a012e8205418cd10a4ea964a493a0` | canonical 1 `SUPERSEDED`, canonical 2 `ACTIVE`; candidate 1 stale and old binding ineffective |
| Successor candidate 8 | `0x1f541ff5897b77db47ae82fbeb307b34d34773e1723dd5c99bff2341725e807e`, `0xb483ef46f6d07663fa70b9dea4de4b095935b41692fd1e93bbc78e259e5ceaec`, `0x377623858e6401e4758b3aa17b3b84957bd2509a65941351d56640e32f12637f`, `0x12b68bb763bf716076442353257fbfa4cbc4e23b7d79a2032ca0fd41e5650bf4` | register/freeze/assess/publish `SUCCESS`; candidate 8 `PUBLISHED`, materially equivalent |
| Successor consumer rebind | `0x75bc1518001692b1f642709a09396afa034033cf179bc7ba7e0c12cc9b2c3b7e` | independent actor; `studio-consumer/es` candidate 8, canonical 2, `is_effective=true` |

### Final GitHub/Vercel release evidence

| Case | Evidence | Result |
|---|---|---|
| Public GitHub release | https://github.com/ldkfj/policy-translation-release-gate | public repository rendering; base evidence package `404a7ccf8b0b828c6be7b98cc1567e0e380c85c1`; current public evidence package HEAD `1c1902a08380ca5456637c0fc11c1cb247391ff0`; application baseline `2c07257acd2e3299adc5bff20a3aee7dfd108455` verified |
| Refreshed Vercel production | `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi`; https://policy-translation-release-gate.vercel.app | `READY`; configured contract; six journeys load; frontend scope unchanged by current contract/evidence delta |
| Prior-release external-wallet objection | [`0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001`](https://explorer-studio.genlayer.com/tx/0x4db8f73dca4e2d1852a8522b9d138c46e2855e079583be2e26b8323ac552a001) | `FINALIZED / SUCCESS / MAJORITY_AGREE`; objection ID `2`; candidate 16 page total `1`; executed before the final provider-identity repair |
| Prior application-package external-wallet objection | [`0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b`](https://explorer-studio.genlayer.com/tx/0xe1b67acf6607c50fd9301d56ebb9bca25c799d2d7562cf9f694449e8d5dc1e7b) | `FINALIZED / SUCCESS / MAJORITY_AGREE`; objection ID `4`; candidate 16 page total `3`; historical deployment `dpl_AcLC5FenPms81vhyZwh1eJTdG9Dh` |
| Current exact Vercel user objection E2E | [`0xcd1a63d8696dfa7b26330b3787234d4bf57032bfd0e706e483e25670869c5a01`](https://explorer-studio.genlayer.com/tx/0xcd1a63d8696dfa7b26330b3787234d4bf57032bfd0e706e483e25670869c5a01) | `FINALIZED / SUCCESS / MAJORITY_AGREE`; objection ID `5`; candidate 16 page total `4`; deployment `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi`; UI readback, reload/disconnect and reconnect `PASS` |
| Primary browser smoke | current Vercel release `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi` | `PASS`; all six read journeys load; current wallet objection finalized/read back; reload/disconnect and reconnect `PASS` |

## Exact-source recovery chronology

- `0x94e49246bd439f521c931fe45682fcc9f8a15b0a48b0c378d53aa46f9c6f5414` is a finalized `upgrade(bytes)` call whose raw calldata source body matches `1a26...` and `92A777...`; it preserved the populated v1 state before the later matrix.
- `0x1e484b14483fdfbf7b8df0a283572201dfaa3d092f697064d01b22ea71969169` was an accidental Studio code upgrade from a stale editor buffer. It finalized with `MAJORITY_AGREE` and temporarily installed source SHA `322F3278...`; the incident is disclosed and retained, not treated as an approved release.
- The Studio buffer was then replaced through the visible editor with the exact local source. `0xef831609be9fb78aa866e94c69c665aabe02698bcab659f9cc3be9ce6522cd99` finalized as a code upgrade with exact `92A777...` source bytes. Two queued exact-source code upgrades, `0xb5a5b98820b1aa876d0513df51bbe230d61275a9b6ef18484a412e77081f7eac` and `0x067cf62b52aadae5750461dba29113e8f4e83969cf76cbb06db0806fd08afd4a`, later also finalized with the same exact source; they do not change source parity.
- The historical Studio observer readback after the prior exact-source upgrade reported source `552627...`, active canonical 2, candidate 8 published/effective, and the locked upgrader address. The current post-upgrade observer readback reports source `B678...`, active canonical 2, candidate 8 published/effective, candidate 18 threshold proof, objection count `4`, event count `69`, and the locked upgrader address; the current transactions and readback are recorded above.

No local-state inference is used to mark a live row PASS. GitHub rendering, Vercel production, primary browser smoke, current external-wallet objection/readback, and reload/disconnect/reconnect are verified on deployment `dpl_CqGaE4eBT3qRcCvmtsGHEwYAM9Yi`. Submission and experience-ledger update remain gated on POST_GITHUB_VERCEL_FINAL, DUAL_APPROVED, and user completion confirmation.
