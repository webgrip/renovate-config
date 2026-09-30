# Renovate preset guide

This repository contains the organization-wide Renovate presets used across Webgrip repositories.

## Design goals

- Keep dependency change velocity intentionally low
- Make every normal update visible and reviewable
- Allow urgent security fixes to move immediately
- Offer small, explicit opt-in overlays instead of one oversized default
- Keep GitOps extraction reusable without forcing Kubernetes-specific behavior into every repository

## Default behavior

The default preset enforces the following:

- Dependency Dashboard enabled and approval required for normal updates
- No automerge and no platform automerge
- Pinned version ranges and digest pinning for Docker and GitHub Actions
- Major, minor, and patch updates separated for easier review
- Graduated release soak times to avoid day-zero regressions
- Low PR concurrency to reduce operational noise
- Lock file maintenance and rollback PR support enabled
- CODEOWNERS-driven assignees and reviewers

## Available presets

### Default

Use for most repositories:

```json
{
  "extends": ["github>webgrip/renovate-config#v1.2.1"]
}
```

### Grouped overlay

Use when a repository wants fewer PRs for routine updates:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.2.1",
    "github>webgrip/renovate-config:grouped#v1.2.1"
  ]
}
```

### Safe automerge overlay

Use when a repository has mature CI and wants the lowest-risk updates merged automatically:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.2.1",
    "github>webgrip/renovate-config:safe-automerge#v1.2.1"
  ]
}
```

### Automerge non-major overlay

Use when a repository's CI is the gate and the dashboard should hold only the decisions:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.12.0",
    "github>webgrip/renovate-config:automerge-non-major#v1.12.0"
  ]
}
```

- Minor, patch, digest and pin updates skip the dashboard tick and land in one
  `all non-major dependencies` branch, which Renovate merges once its pull request checks are
  green. Lock-file maintenance and vulnerability fixes merge themselves too.
- The default preset's approval-means-no-soak rule is undone for these: three days for a minor,
  one for a patch. `internalChecksFilter: strict` leaves an unsoaked update out of the group so
  it cannot hold the rest.
- `rebaseWhen: conflicted`. With `behind-base-branch`, every push to the base branch rebases every
  open branch and each rebase starts a CI run.
- Majors, Go toolchain minors and preset bumps keep the dashboard tick.
- One red dependency holds the group. Exclude it with a repo-level rule, or fix it, and the rest
  merges on the next run.

### GitOps overlay

Use for Kubernetes, Flux, or homelab-style GitOps repositories. Extend it after the default preset so repo-local rules can still override operational choices:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.2.1",
    "github>webgrip/renovate-config:gitops#v1.2.1"
  ]
}
```

### Go overlay

Use for any repository with a `go.mod`. Extend it after the default preset:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.6.0",
    "github>webgrip/renovate-config:golang#v1.6.0"
  ]
}
```

The overlay exists because Renovate's out-of-the-box `gomod` behavior leaves a Go repository
partly unmanaged:

- **Indirect modules are disabled by default.** In Go that default is unsafe in a way it is not
  for lockfile ecosystems: minimal version selection makes the version written in `go.mod` the
  exact source that links into the binary, and a dependency Renovate never looks up gets no
  `osvVulnerabilityAlerts` and no `vulnerabilityAlerts` either. `webgrip/ploeg` shipped
  `golang.org/x/text` v0.29.0 (CVE-2026-56852, High) in `ploegd` 0.2.0-rc.10 on that default —
  Trivy found it in the image, Renovate had never had it in scope. The overlay enables
  `matchDepTypes: ["indirect"]` and groups those bumps into one reviewable PR.
- **`go.mod` and `go.sum` drift inside the branch** without `postUpdateOptions: ["gomodTidy"]`,
  and a `/vN` major lands uncompilable without `gomodUpdateImportPaths`. Both are set here.
- **A Go security fix must not sit behind a group.** Vulnerability updates are explicitly
  ungrouped (`groupName: null`) so one soaking or red sibling cannot hold the fix.
- **`golang.org/x/*` is grouped** — those modules release in lockstep and share `go.sum` entries.
- **Toolchain moves are labelled as such.** The `go` directive keeps Renovate's default (no
  proposals — it is a minimum-compatibility floor, and raising it is a human decision); the
  `toolchain` directive and the `golang` Docker builder image land as `chore(go)` with a
  `go-toolchain` label.

Three things the overlay cannot do for you, because they live in the Renovate runtime config
rather than in a preset:

- `gomod` must be present in `enabledManagers` for the runner that scans the repository. On the
  Forgejo path that is `renovate-config-forgejo` in `webgrip/homelab-cluster`. Without it none
  of the above is reachable — Renovate never opens `go.mod` at all.
- `gomodTidy` and `gomodUpdateImportPaths` need a Go toolchain in the Renovate image. The
  `renovate/renovate:*-full` images used by the RenovateJobs have one.
- `constraintsFiltering` must be `none` for `gomod`. `default.json` sets it to `strict`, which
  compares each release's `go` directive against the repository's as an exact version, filters
  out every release that declares one, and proposes a rollback to the last release that did not
  (`lib/pq` v1.10.9 to v1.5.2 on Glide). `renovate-config-forgejo` carries that rule for `gomod`
  and `pep621` on the Forgejo path.

The GitOps overlay intentionally extends specific upstream home-operations presets instead of the entire `github>home-operations/renovate-presets` default, so Webgrip keeps its own dashboard, scheduling, approval, concurrency, and automerge policy from the default preset.

The GitOps overlay adds:

- Upstream home-operations manager file patterns, `mirror.gcr.io` registry aliasing, custom managers, package overrides, semantic commit polish, and versioning rules that are useful for homelab/GitOps repositories
- Webgrip-specific regex handling for Flux `OCIRepository` tags where `spec.ref.digest` is owned by a repo-local post-upgrade task
- GitOps package rules for Flux OCI chart grouping, disabling duplicate digest handling where repo-local digest refresh tasks own the digest field, Helmfile OCI digest safety, and GitOps container image digest pinning
- PR polish from both upstream home-operations presets and Webgrip labels/scoping

This preset deliberately does **not** configure credentials, `enabledManagers`, host throttling, `allowedCommands`, or post-upgrade scripts. Those belong in the Renovate runtime config or in the consuming repository.

## Recommended homelab-cluster rollout

Use `webgrip/homelab-cluster` as the repo-local policy layer, not as the place to copy shared extraction logic:

1. Replace shared Renovate rules in `webgrip/homelab-cluster` with pinned Webgrip presets:

   ```json
   {
     "extends": [
       "github>webgrip/renovate-config#v1.2.1",
       "github>webgrip/renovate-config:gitops#v1.2.1"
     ]
   }
   ```

2. Keep cluster-only settings in `webgrip/homelab-cluster`, for example credentials/runtime config, `enabledManagers`, `hostRules`, `allowedCommands`, post-upgrade tasks, and package rules that name cluster-specific apps, paths, labels, assignees, or maintenance windows.
3. Prefer adding reusable homelab/GitOps extraction fixes here in `webgrip/renovate-config:gitops`; prefer adding one-off operational exceptions in `webgrip/homelab-cluster`.
4. Pin to a released Webgrip tag first, then update the tag deliberately after validating the Dependency Dashboard output in the cluster repository.

## Release and change management

- Prefer consumers pinning to a SemVer tag instead of following `main`
- Treat changes to `default.json` as high-impact changes for the whole organization
- Keep overlays narrow and composable
- Update examples and documentation whenever preset behavior changes
- Cut a new tag after merging changes that affect consumers

## Local validation

Run the same command used by CI:

```bash
npm ci
npm run validate
```

Renovate is pinned as a local devDependency; do not use `npx` for validator runs.
