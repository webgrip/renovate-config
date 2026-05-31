# webgrip/renovate-config

Webgrip shared Renovate preset and CI — strict, validated org defaults

Usage

Add a repository-level config (either `.github/renovate.json` or `renovate.json`) with the following to inherit the org preset:

```json
{
  "extends": ["github>webgrip/renovate-config"]
}
```

Notes
- This repo contains `default.json` (the preset). Repos should extend `github>webgrip/renovate-config`.
- Changes to this preset must go through PR and are validated by CI.
- For sensitive/security updates, Renovate will still surface vulnerabilities as labeled PRs.
