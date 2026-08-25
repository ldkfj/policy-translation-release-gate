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
