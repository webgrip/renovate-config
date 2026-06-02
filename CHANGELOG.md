# Changelog

All notable changes to the **Webgrip shared Renovate preset** are documented here.
This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

Consumers should **always pin to a release tag**:
```json
{ "extends": ["github>webgrip/renovate-config#vX.Y.Z"] }
```

> **Breaking changes** (`feat!`) bump the major version and include migration notes in the release body.
> Subscribers to this repo's releases will be notified automatically.

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
