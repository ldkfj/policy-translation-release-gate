# Policy Translation Release Gate

An enterprise-grade decentralized policy translation release gate application built on **GenLayer Studionet**. The system enforces semantic equivalence between canonical policy documents and localized translations via GenLayer intelligent validator consensus before policies can be published and consumed by client applications.

---

## 🎯 Overview & Architecture

When global organizations publish canonical policies (e.g. Terms of Service, Privacy Policies, Legal Notices), translations into regional languages often suffer from subtle legal drifts, omitted obligations, lost rights/exceptions, or altered liability thresholds.

**Policy Translation Release Gate** provides an on-chain verification pipeline:
1. **Canonical Registry**: Publishers register authoritative canonical policy revisions with cryptographic SHA-256 digests and Git commit hashes.
2. **Translation Submissions**: Localizers submit translated markdown documents anchored to canonical revisions.
3. **GenLayer Intelligent Consensus**: Multiple GenLayer validator nodes independently parse and evaluate semantic equivalence across 7 legal dimensions (Rights, Obligations, Prohibitions, Exceptions, Scope, Thresholds, Deadlines) returning a 17-field structured consensus result.
4. **Release Gate Enforcement**: Translations can only transition to `PUBLISHED` if validator consensus outcomes reach `MATERIALLY_EQUIVALENT`.
5. **Consumer Namespace Binding**: Client applications query effective translations with regional dialect fallbacks (e.g. `es-MX` -> `es`).
6. **Public Audit & Objections**: Community observers and auditors review on-chain event trails and register verifiable objections (1–500 characters) against translation candidates.

---

## 🧭 Six Release Gate Journeys

| Journey | Role | Key Functions |
|---|---|---|
| **1. Publisher** | Publisher Authority | Initialize publisher GitHub repository, register canonical revisions (`register_canonical`), and activate policies (`activate_canonical`). |
| **2. Localizer** | Localizer / Translator | Submit translation candidate drafts (`register_translation`), edit draft metadata (`update_translation_draft`), and freeze candidates for consensus (`freeze_translation`). |
| **3. Assess** | Validator Consensus | Trigger GenLayer intelligent validator consensus assessment (`assess_translation`), inspect 17-field dimensional breakdown, and retry unresolved assessments (`retry_unresolved`). |
| **4. Publish** | Release Manager | Execute release gate on accepted candidates to transition to `PUBLISHED` (`publish_translation`). |
| **5. Consumer** | Application Client | Bind application namespaces (`bind_consumer`) and query effective locale resolution with fallback paths (`get_effective_locale`). |
| **6. Public Audit** | Observer / Auditor | Inspect contract event audit logs, review community objections, and record verifiable objections (`record_objection`). |

---

## ⚡ GenLayer Studionet Configuration

| Parameter | Value |
|---|---|
| **Chain Name** | GenLayer Studionet |
| **Chain ID** | `61999` (`0xf22f`) |
| **RPC Endpoint** | `https://studio.genlayer.com/api` |
| **Block Explorer** | `https://explorer-studio.genlayer.com` |
| **Native Currency** | `GEN` (18 Decimals) |

---

## 👛 Supported EIP-6963 Wallets

The application exclusively integrates with browser wallets supporting the **EIP-6963 multi-provider discovery protocol** with strict RDNS allowlisting:
- **MetaMask**: `io.metamask`
- **OKX Wallet**: `com.okex.wallet` / `com.okx.wallet`
- **Rabby Wallet**: `io.rabby`

*Note: The frontend does not use legacy global `window.ethereum` fallbacks to ensure multi-wallet isolation and eliminate provider race conditions.*

---

## 🛠️ Development & Testing Commands

All commands should be executed from within the `frontend/` directory:

```bash
cd frontend

# Install dependencies (if setting up fresh)
npm install

# Typecheck TypeScript codebase
npm run typecheck

# Run test suite via Vitest
npm run test:run

# Build production bundle via Vite
npm run build

# Start local development server
npm run dev
```
