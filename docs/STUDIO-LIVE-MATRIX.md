# Studio Live Matrix

Contract: `0xf41A330869Cb9FDCCD8fbd7Ce7f83F5042908A75`

Deployment tx: `0xc9b344962bc468aed13375b4430ae6b434bcaebfb6af2e55fc8ec5a9a1b3f202` — `FINALIZED`, receipt `success`, exact deployed-source SHA-256 match.

## Immutable fixture manifest

The final Git commit SHA is filled after the user-selected GitHub repository is pushed. Digests below bind the exact UTF-8 bytes already prepared locally.

| File | Intended result | SHA-256 |
|---|---|---|
| `live-fixtures/canonical-v1.md` | canonical v1 | `054A2E6A4365D31430CE53770B4FCE9F98CDC1D49C0E5AD3FDA47971BEC90186` |
| `live-fixtures/es-equivalent-v1.md` | `MATERIALLY_EQUIVALENT` | `24B16304995EBBA7BA1009190FE81B83C0A6779ACB36C636243CDF0878197828` |
| `live-fixtures/fr-obligation-drift-v1.md` | `OBLIGATION_DRIFT` | `7F9DC3EFA2E39775DECD22CE98AAC214E3717C7E985ABD716C4C6072B6818928` |
| `live-fixtures/de-right-loss-v1.md` | `RIGHT_OR_EXCEPTION_LOSS` | `5563239C1A723AFF01536424DB91B7864B62D9FEA39BB8758687A98B0C32472F` |
| `live-fixtures/es-scope-threshold-drift-v1.md` | `SCOPE_OR_THRESHOLD_DRIFT` | `65425EFFEC8CBB5E84444FEC6355FBC84E323C8E476AA7F46463CD44BB409494` |
| `live-fixtures/canonical-v2.md` | successor canonical | `5F18FA0632DCE5765BC4241676C80D45D9B72F7E18B123AC99456C169C8E71EB` |
| `live-fixtures/es-equivalent-v2.md` | successor `MATERIALLY_EQUIVALENT` | `50FD2C1E2A8B2F963CFC6FEC76AEF0DCF846E026A5B735E98D1E2875D29585E4` |

## Execution order

Each consequential row requires the transaction hash, `FINALIZED`, explicit execution success or expected rollback, consensus result where applicable, and authoritative readback before the next row.

1. Initialize publisher with the selected immutable public GitHub `owner/repo`; verify profile/admin/upgrader.
2. Negative publisher checks: unauthorized initialization/register; unsafe path; invalid digest; nonce collision; canonical cap rollback.
3. Register and activate canonical v1; verify active revision and nonce result.
4. Register/freeze equivalent v1 candidate from a separate localizer account; verify authorization and frozen state.
5. Assess equivalent candidate under full consensus; require `MATERIALLY_EQUIVALENT`, all 17 fields, fingerprint, and `ACCEPTED` state.
6. Publish equivalent candidate; bind consumer namespace; verify effective locale and binding.
7. Register/freeze/assess obligation-drift, right-loss, and scope-threshold-drift candidates; verify each distinct outcome and `REVISION_REQUIRED`; publication must roll back.
8. Register/freeze an unavailable-evidence candidate; require safe `HOLD_UNRESOLVED`; verify cooldown rollback, then bounded retry and attempt cap when the live environment permits the required elapsed time.
9. Record a public objection from a non-publisher account; verify pagination/event readback.
10. Register and activate canonical v2; verify v1 is `SUPERSEDED`, the published v1 candidate becomes `STALE_BY_CANONICAL_REVISION`, and prior consumer binding is ineffective.
11. Register/freeze/assess/publish equivalent v2; rebind and verify successor effectiveness.
12. Upgrade recovery: unauthorized upgrade rollback; authorized exact-code upgrade; preserved profile/canonical/candidate/binding state and upgrader readback.

No row may be marked PASS from local mocks or a later-state inference.
