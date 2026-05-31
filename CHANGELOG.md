# Changelog

All notable changes to the **Webgrip shared Renovate preset** are documented here.
This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

Consumers should **always pin to a release tag**:
```json
{ "extends": ["github>webgrip/renovate-config#vX.Y.Z"] }
```

> **Breaking changes** (`feat!`) bump the major version and include migration notes in the release body.
> Subscribers to this repo's releases will be notified automatically.

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
