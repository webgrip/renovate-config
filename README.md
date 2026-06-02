# webgrip/renovate-config

Shared, versionable Renovate presets for Webgrip repositories.

## Quick start

Prefer pinning to a release tag in consuming repositories:

```json
{
  "extends": ["github>webgrip/renovate-config#v1.2.1"]
}
```

Add opt-in overlays when a repository needs them:

```json
{
  "extends": [
    "github>webgrip/renovate-config#v1.2.1",
    "github>webgrip/renovate-config:grouped#v1.2.1",
    "github>webgrip/renovate-config:safe-automerge#v1.2.1",
    "github>webgrip/renovate-config:gitops#v1.2.1"
  ]
}
```

## Available presets

| Preset | Purpose |
| --- | --- |
| `github>webgrip/renovate-config` | Strict default: dashboard approval, pinned ranges, low concurrency, delayed releases, no automerge |
| `github>webgrip/renovate-config:grouped` | Opt-in overlay to group non-major updates into fewer PRs |
| `github>webgrip/renovate-config:safe-automerge` | Opt-in overlay to automerge only digest updates and low-risk GitHub Actions updates after checks pass |
| `github>webgrip/renovate-config:gitops` | Opt-in GitOps overlay that composes selected `home-operations/renovate-presets` for Kubernetes/Flux/OCI/Talos/CNPG/Grafana extraction plus Webgrip-specific GitOps PR polish |

## Repo standards

- `CODEOWNERS` routes reviews to `@webgrip/infrastructure`
- CI validates every shared preset on every PR and push to `main`
- Example consumer configs live in `examples/`
- This repo dogfoods its own preset via `renovate.json`

The GitOps overlay extends selected presets from [`home-operations/renovate-presets`](https://github.com/home-operations/renovate-presets), which is Apache-2.0 licensed. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Detailed guidance lives in [`docs/renovate.md`](docs/renovate.md).
