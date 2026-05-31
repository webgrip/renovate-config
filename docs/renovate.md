# Renovate preset (webgrip/renovate-config)

This repository contains the organization-wide Renovate preset used across Webgrip repositories.

Policy summary:

- Conservative defaults: no automerge by default, rangeStrategy: pin, separateMajorMinor/separateMinorPatch enabled.
- Dependency Dashboard approval is required for regular updates.
- Docker and GitHub Actions updates are pinned by digest.
- Security/vulnerability PRs are labeled `security` and do not require dashboard approval.

How to use

- Extend this preset from any repo via:

```
{
  "extends": ["github>webgrip/renovate-config"]
}
```

Validation

A GitHub Actions workflow runs renovate-config-validator on PRs to this repo. Repos that want extra safety can run the same validator in their CI.
