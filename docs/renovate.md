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
npx --yes --package renovate renovate-config-validator --strict default.json grouped.json safe-automerge.json gitops.json
```
