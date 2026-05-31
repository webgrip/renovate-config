# Renovate preset guide

This repository contains the organization-wide Renovate presets used across Webgrip repositories.

## Design goals

- Keep dependency change velocity intentionally low
- Make every normal update visible and reviewable
- Allow urgent security fixes to move immediately
- Offer small, explicit opt-in overlays instead of one oversized default

## Default behavior

The default preset enforces the following:

- Dependency Dashboard enabled and approval required for normal updates
- No automerge and no platform automerge
- Pinned version ranges and digest pinning for Docker and GitHub Actions
- Major, minor, and patch updates separated for easier review
- Minimum release age of 7 days to avoid day-zero regressions
- Low PR concurrency to reduce operational noise
- Lock file maintenance and rollback PR support enabled
- CODEOWNERS-driven assignees and reviewers

## Available presets

### Default

Use for most repositories:

```json
{
  "extends": ["github>webgrip/renovate-config#v1.0.0"]
}
```

### Grouped overlay

Use when a repository wants fewer PRs for routine updates:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.0.0",
    "github>webgrip/renovate-config:grouped#v1.0.0"
  ]
}
```

### Safe automerge overlay

Use when a repository has mature CI and wants the lowest-risk updates merged automatically:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.0.0",
    "github>webgrip/renovate-config:safe-automerge#v1.0.0"
  ]
}
```

## Release and change management

- Prefer consumers pinning to a SemVer tag instead of following `main`
- Treat changes to `default.json` as high-impact changes for the whole organization
- Keep overlays narrow and composable
- Update examples and documentation whenever preset behavior changes
- Cut a new tag after merging changes that affect consumers

## Local validation

Run the same command used by CI:

```bash
npx --yes --package renovate renovate-config-validator --strict default.json grouped.json safe-automerge.json
```
