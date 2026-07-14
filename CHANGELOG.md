# Changelog

All notable changes to the **Webgrip shared Renovate preset** are documented here.
This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

Consumers should **always pin to a release tag**:
```json
{ "extends": ["github>webgrip/renovate-config#vX.Y.Z"] }
```

> **Breaking changes** (`feat!`) bump the major version and include migration notes in the release body.
> Subscribers to this repo's releases will be notified automatically.

## [1.5.3](https://forgejo.webgrip.dev/webgrip/renovate-config/compare/v1.5.2...v1.5.3) (2026-07-13)

### 🐛 Rule Corrections & Fixes

* **default:** approval-gated update types skip the release-age soak ([de5d372](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/de5d37275529b4b91423191fdeaf67a62a32a767))
* **default:** resolve conflict markers committed in de5d372 ([cfdad9e](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/cfdad9eb7df972effc8f1d0d06aa8d313692e8df))

### 🔧 Maintenance

* added .gitignore for node_modules ([eaa1026](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/eaa10264e823bc420e67d0feb611d0bfdd1e723e))

## [1.5.2](https://forgejo.webgrip.dev/webgrip/renovate-config/compare/v1.5.1...v1.5.2) (2026-07-11)

### 🐛 Rule Corrections & Fixes

* **default:** never digest-pin mise-managed tools ([5c9b218](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/5c9b21875d92a3cb4bbba263e132dca8f8d7c66a))

## [1.5.1](https://forgejo.webgrip.dev/webgrip/renovate-config/compare/v1.5.0...v1.5.1) (2026-07-11)

### 🐛 Rule Corrections & Fixes

* **default:** never digest-pin the shared preset reference ([e973e7c](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/e973e7c6ac0d7f630332cf472d12cf1950b9acd4))

## [1.5.0](https://forgejo.webgrip.dev/webgrip/renovate-config/compare/v1.4.5...v1.5.0) (2026-07-11)

### 🚀 New Preset Rules & Features

* add forgejo platform preset (force prCreation immediate) ([4d22923](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/4d22923ff0f716ad893e42840c9effdb88e06642))
* **gitops:** manage OCIRepository spec.ref.digest so tag re-pushes self-heal ([4440508](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/444050853904d3dafaab91a6cab97aabaf9687c1))

## [1.4.5](https://forgejo.webgrip.dev/webgrip/renovate-config/compare/v1.4.4...v1.4.5) (2026-06-29)

### 🐛 Rule Corrections & Fixes

* **safe-automerge:** use addLabels so automerge PRs keep inherited labels ([44fbffb](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/44fbffba5a221db3c3c6e904b6507817a17f6c77))

### ⚙️ CI / CD

* port CI to Forgejo Actions; gate releaserc on GITEA_ACTIONS ([613e5cc](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/613e5cc068edabc1bc146e3b1a5d9f1201ab9ab0))
* re-trigger after GITEA_URL fallback fix in shared action ([6c9b22f](https://forgejo.webgrip.dev/webgrip/renovate-config/commit/6c9b22f0146665869b9a8d18242d3d0048b9230b))

## [1.4.4](https://github.com/webgrip/renovate-config/compare/v1.4.3...v1.4.4) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* **config:** set internalChecksFilter to none ([#12](https://github.com/webgrip/renovate-config/issues/12)) ([668da07](https://github.com/webgrip/renovate-config/commit/668da07a59ba32ca5a608299b11a4f242d87cb90))

## [1.4.3](https://github.com/webgrip/renovate-config/compare/v1.4.2...v1.4.3) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* **config:** add prNotPendingHours and suppressNotifications ([#11](https://github.com/webgrip/renovate-config/issues/11)) ([763a322](https://github.com/webgrip/renovate-config/commit/763a32288233d724124c5f951f51ad3f5c73492d))

## [1.4.2](https://github.com/webgrip/renovate-config/compare/v1.4.1...v1.4.2) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* **renovate:** Unlimited hourly PRs, 5 concurrent, 10 branch concurrent ([80d9acd](https://github.com/webgrip/renovate-config/commit/80d9acd0aba14f3f9e5bfb652223f3a6330b70e9))

### 🔧 Maintenance

* update validate script and add validate:preset for renovate config validation ([407c47d](https://github.com/webgrip/renovate-config/commit/407c47d3825012315ce66051bf98ae8bc260d82d))

## [1.4.1](https://github.com/webgrip/renovate-config/compare/v1.4.0...v1.4.1) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* **renovate:** skip stability days for preset self-updates ([#10](https://github.com/webgrip/renovate-config/issues/10)) ([4f6e929](https://github.com/webgrip/renovate-config/commit/4f6e92900b873720c6696f36c732692d99947f1e))

## [1.4.0](https://github.com/webgrip/renovate-config/compare/v1.3.7...v1.4.0) (2026-06-03)

### 🚀 New Preset Rules & Features

* **release:** switch prerelease channel to next branch ([8ac1f5a](https://github.com/webgrip/renovate-config/commit/8ac1f5a5c5ae327d86963cd2a9be5cd642773fa5))

### 🔧 Maintenance

* **renovate:** route github-actions updates to main, others to next ([b1b1238](https://github.com/webgrip/renovate-config/commit/b1b12383d1d0144cc5f3661233e9a606a059b47a))

### ⚙️ CI / CD

* auto-open next to main promotion PR on push to next ([c790f5a](https://github.com/webgrip/renovate-config/commit/c790f5ad0e6141edd8fa5a756d7bcdaa75d76a8f))
* **workflows:** promote prereleases even when it's just workflow stuff ([c351f7a](https://github.com/webgrip/renovate-config/commit/c351f7aedc317305896c74c461b96b353522fb86))

## [1.4.0-rc.1](https://github.com/webgrip/renovate-config/compare/v1.3.7...v1.4.0-rc.1) (2026-06-03)

### 🚀 New Preset Rules & Features

* **release:** switch prerelease channel to next branch ([8ac1f5a](https://github.com/webgrip/renovate-config/commit/8ac1f5a5c5ae327d86963cd2a9be5cd642773fa5))

### ⚙️ CI / CD

* auto-open next to main promotion PR on push to next ([c790f5a](https://github.com/webgrip/renovate-config/commit/c790f5ad0e6141edd8fa5a756d7bcdaa75d76a8f))
* **actions:** Update actions/checkout action ( v4.3.1 ➔ v6.0.2 ) ([#7](https://github.com/webgrip/renovate-config/issues/7)) ([43a1783](https://github.com/webgrip/renovate-config/commit/43a178386d44a06a89d944a2d560883af3ebc4f3))
* **actions:** Update actions/setup-node action ( v4.4.0 ➔ v6.4.0 ) ([#8](https://github.com/webgrip/renovate-config/issues/8)) ([7a95701](https://github.com/webgrip/renovate-config/commit/7a957012fa116ea75fde173c034e4920e9dad10c))

## [1.3.7](https://github.com/webgrip/renovate-config/compare/v1.3.6...v1.3.7) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* update default Renovate preset configuration and schedule settings ([2466452](https://github.com/webgrip/renovate-config/commit/2466452f8275f509c6db60a52d1c1e1441fda398))
* update workflow and release configuration for 'next' branch support ([e33ee79](https://github.com/webgrip/renovate-config/commit/e33ee79a44273c14fb1a18bed60b18ae64d9ea9e))

## [1.3.6](https://github.com/webgrip/renovate-config/compare/v1.3.5...v1.3.6) (2026-06-03)

### 🐛 Rule Corrections & Fixes

* revert prCreation to not-pending (immediate was a workaround for gitAuthor mismatch) ([109d10d](https://github.com/webgrip/renovate-config/commit/109d10da418b6f26bf9c060a992fdd633e848acb))

## [1.3.5](https://github.com/webgrip/renovate-config/compare/v1.3.4...v1.3.5) (2026-06-02)

### 🐛 Rule Corrections & Fixes

* open approved renovate PRs immediately ([5a0bc22](https://github.com/webgrip/renovate-config/commit/5a0bc229e0189a22a008b5bc4beca4916e32e5c7))

## [1.3.4](https://github.com/webgrip/renovate-config/compare/v1.3.3...v1.3.4) (2026-06-02)

### 🐛 Rule Corrections & Fixes

* allow dashboard approvals to trigger outside schedule ([842b70b](https://github.com/webgrip/renovate-config/commit/842b70bfb2d030c7de4b5176cfce72e18387e47a))

## [1.3.3](https://github.com/webgrip/renovate-config/compare/v1.3.2...v1.3.3) (2026-06-02)

### 🐛 Rule Corrections & Fixes

* **ci:** update renovate validator to 43.208.0 in CI ([9d4b2c5](https://github.com/webgrip/renovate-config/commit/9d4b2c500d8719618ca596669ed01aa1e04a7110))
* **ci:** update renovate validator to 43.208.0 in package.json ([4010217](https://github.com/webgrip/renovate-config/commit/40102173f61f319e47a9877a9807d3f05d7c938f))

## [1.3.2](https://github.com/webgrip/renovate-config/compare/v1.3.1...v1.3.2) (2026-06-02)

### 🐛 Rule Corrections & Fixes

* remove discussionCategoryName — Discussions not enabled on repo ([#3](https://github.com/webgrip/renovate-config/issues/3)) ([e7960ea](https://github.com/webgrip/renovate-config/commit/e7960eafcdf2077c5a52e38604ff152c22f8d999))

## [1.3.1](https://github.com/webgrip/renovate-config/compare/v1.3.0...v1.3.1) (2026-06-02)

### 🐛 Rule Corrections & Fixes

* **renovate:** set dependencyDashboardAutoclose to false ([ef5388c](https://github.com/webgrip/renovate-config/commit/ef5388c5b4e274347beae5c2c8c1c8f5dc4ba777))

## [1.3.0](https://github.com/webgrip/renovate-config/compare/v1.2.1...v1.3.0) (2026-06-01)

### 🚀 New Preset Rules & Features

* add reusable GitOps Renovate preset ([938a175](https://github.com/webgrip/renovate-config/commit/938a175ccc659daea20922e6c19f168ad5298ef4))

### 🐛 Rule Corrections & Fixes

* include GitOps preset in release docs and assets ([d707418](https://github.com/webgrip/renovate-config/commit/d707418453635d649834c1d4a18229711ff4c7ec))
* pin Renovate validator version ([0ace8b1](https://github.com/webgrip/renovate-config/commit/0ace8b1de4efba4b05a3f31f509a4df32da3df22))
* validate GitOps preset as part of full preset suite ([285f472](https://github.com/webgrip/renovate-config/commit/285f4729c23f89b626bcaa7cdbe480a47b784ddc))
* validate GitOps preset in source-change workflow ([943dcf9](https://github.com/webgrip/renovate-config/commit/943dcf933ceae22ee5d3f354b5f4e6bdfb98e4b0))

### 🔧 Maintenance

* **workflows:** make sure releases only run when important files are changed ([93a1c3c](https://github.com/webgrip/renovate-config/commit/93a1c3c22a3f9f02835e4b8b4fc76a57105a3808))

## [1.2.1](https://github.com/webgrip/renovate-config/compare/v1.2.0...v1.2.1) (2026-05-31)

### 🐛 Rule Corrections & Fixes

* **workflows:** run on home cluster ([a34e884](https://github.com/webgrip/renovate-config/commit/a34e8841ebc505afe2e2455495bb2f642041546f))

## [1.2.0](https://github.com/webgrip/renovate-config/compare/v1.1.0...v1.2.0) (2026-05-31)

### 🚀 New Preset Rules & Features

* add semantic-release automation with multi-channel release pipeline ([4e0fdbb](https://github.com/webgrip/renovate-config/commit/4e0fdbbb924cd65d0147d625bfc81dd65cd5c065))

### ⚙️ CI / CD

* replace release.yml with on_source_change.yml using shared semantic-release workflow ([9033b07](https://github.com/webgrip/renovate-config/commit/9033b07f1eebfcbf143acc3a86cbdea85333236f))

---

<!-- releases below this line are prepended automatically by semantic-release -->

## [1.1.0] — 2025

### 🚀 New Preset Rules & Features

- Graduated soak times: major 14 d · minor 3 d · patch 1 d · digest none
- Per-update-type semantic commit types: major → `feat!`, minor → `feat`, patch → `fix`, digest → `chore`
- Commit-message change arrows: `( {{currentVersion}} ➔ {{newVersion}} )`
- `prBodyNotes` with Merge Confidence guidance, vulnerability / group / major caveats
- `abandonments:recommended` and `mergeConfidence:all-badges` added to `extends`
- OSV vulnerability scanning (`osvVulnerabilityAlerts`, `dependencyDashboardOSVVulnerabilitySummary: "unresolved"`)
- `dependencyDashboardAutoclose: true`
- Concurrency limits: `prHourlyLimit: 1`, `prConcurrentLimit: 3`, `branchConcurrentLimit: 3`
- `prCreation: "not-pending"` and `internalChecksFilter: "strict"` for stability gating
- `recreateWhen: "always"` so stale branches are never silently abandoned
- `lockFileMaintenance` monthly cadence, gated behind Dependency Dashboard approval
- Per-type labels: `type/major` + `breaking-change`, `type/minor`, `type/patch`, `type/digest`
- `peerDependencies` updates disabled by default

---

## [1.0.0] — 2025

### 🚀 New Preset Rules & Features

- Initial release of the Webgrip shared Renovate preset suite
- `default.json` — conservative org default (no automerge, all updates dashboard-gated, digests pinned)
- `grouped.json` — opt-in overlay: group non-major updates by ecosystem
- `safe-automerge.json` — opt-in overlay: automerge digest and minor/patch GitHub Actions
- `examples/` directory with ready-to-use consumer configs for all three presets

### ⚙️ CI / CD

- Matrix validation workflow (`renovate-config-validator --strict` on all three presets)
- Branch protection: required status checks, CODEOWNERS review, linear history

### 📚 Documentation

- `README.md` with preset table, quick start, and versioning guidance
- `CONTRIBUTING.md` with contribution principles and validation instructions
- `docs/renovate.md` full policy guide
- `CODEOWNERS` routing all reviews to `@webgrip/infrastructure`
- PR template and structured issue template
