# Contributing

## Principles

1. **Conservative by default.** The `default.json` preset is intentionally strict. Opt-in overlays loosen constraints; the default should never surprise a consumer.
2. **One concern per PR.** Don't bundle unrelated rule changes. Each PR should be reviewable in isolation.
3. **Always validate.** Run the validator before opening a PR:

```sh
npm ci
npm run validate
```

CI uses the same npm script with the pinned local Renovate devDependency, so avoid `npx` for validation.

4. **Conventional commits required.** This repo uses [Conventional Commits](https://www.conventionalcommits.org/) — semantic-release derives the next version and CHANGELOG automatically from commit messages.

| Prefix | When to use | Version bump |
|---|---|---|
| `feat: …` | New rule, new preset, extended coverage | minor |
| `feat!: …` | Rule change that breaks existing consumer behaviour | **major** |
| `fix: …` | Correcting a rule that was wrong or overly broad | patch |
| `chore(deps): …` | Dependency update (Renovate or semantic-release plugins) | patch |
| `chore: …` | Internal maintenance with no consumer impact | no release |
| `docs: …` | Documentation-only change | no release |
| `ci: …` | Workflow changes | no release |
| `refactor: …` | Restructure without behaviour change | patch |

5. **Breaking changes need migration notes.** If a `feat!` commit changes behaviour that consumers rely on, describe the migration path in the PR body and commit footer:

```
BREAKING CHANGE: <what changed and how to migrate>
```

## Release Process

Releases are **fully automated**. Push (or merge a PR) to `main` for a stable release, or to `next` for an RC release, and semantic-release will:

1. Analyse commits since the last tag
2. Validate all presets (`renovate-config-validator --strict`)
3. Determine the next SemVer version
4. Generate / prepend to `CHANGELOG.md`
5. Push a `chore(release): vX.Y.Z [skip ci]` commit
6. Create a `vX.Y.Z` Git tag
7. Publish a GitHub Release with the preset files attached as assets
8. Comment on any issue/PR that ships in the release

### Pre-release channels

| Branch | Channel | Tag example |
|---|---|---|
| `main` | stable | `v1.2.0` |
| `next` | rc | `v1.2.0-rc.1` |

This repository's Renovate configuration targets `next`, so dependency updates publish RC tags for downstream testing before being promoted to `main`.

### Release train

1. Renovate opens dependency update PRs against `next`.
2. Merging a dependency PR into `next` publishes an RC tag such as `v1.2.0-rc.1`.
3. Test the RC tag in downstream repositories.
4. When satisfied, open a `next` → `main` promotion PR manually.
5. Merge it with a **merge commit** or **rebase merge** — do not squash, because semantic-release needs the original semantic commits to determine the stable version.
6. `main` publishes the stable release. Renovate will keep targeting `next`, which stays ahead of `main` as new PRs land.

### Required secret

`WEBGRIP_CI_APP_ID` and `WEBGRIP_CI_APP_PRIVATE_KEY` must be set in the repo (or org) secrets. The shared semantic-release workflow uses the GitHub App token to push release commits/tags and publish GitHub Releases.

## Code Owners

All changes require a review from `@webgrip/infrastructure`.
