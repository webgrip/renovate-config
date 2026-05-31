# webgrip/renovate-config

Shared, versionable Renovate presets for Webgrip repositories.

## Quick start

Prefer pinning to a release tag in consuming repositories:

```json
{
  "extends": ["github>webgrip/renovate-config#v1.0.0"]
}
```

Add opt-in overlays when a repository needs them:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.0.0",
    "github>webgrip/renovate-config:grouped#v1.0.0",
    "github>webgrip/renovate-config:safe-automerge#v1.0.0"
  ]
}
```

## Available presets

| Preset | Purpose |
| --- | --- |
| `github>webgrip/renovate-config` | Strict default: dashboard approval, pinned ranges, low concurrency, delayed releases, no automerge |
| `github>webgrip/renovate-config:grouped` | Opt-in overlay to group non-major updates into fewer PRs |
| `github>webgrip/renovate-config:safe-automerge` | Opt-in overlay to automerge only digest updates and low-risk GitHub Actions updates after checks pass |

## Repo standards

- `CODEOWNERS` routes reviews to `@webgrip/infrastructure`
- CI validates every shared preset on every PR and push to `main`
- Example consumer configs live in `examples/`
- This repo dogfoods its own preset via `renovate.json`

Detailed guidance lives in [`docs/renovate.md`](docs/renovate.md).
