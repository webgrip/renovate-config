# Contributing

## Principles

1. **Conservative by default.** The `default.json` preset is intentionally strict. Opt-in overlays loosen constraints; the default should never surprise a consumer.
2. **One concern per PR.** Don't bundle unrelated rule changes. Each PR should be reviewable in isolation.
3. **Always validate.** Run the validator before opening a PR:

```sh
npx --yes --package renovate renovate-config-validator --strict default.json grouped.json safe-automerge.json
```

Or install devDependencies and use the npm script:

```sh
npm install
npm run validate
```

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

Releases are **fully automated**. Push (or merge a PR) to `main` and semantic-release will:

1. Analyse commits since the last tag
2. Validate all presets (`renovate-config-validator --strict`)
3. Determine the next SemVer version
4. Generate / prepend to `CHANGELOG.md`
5. Push a `chore(release): vX.Y.Z [skip ci]` commit
6. Create a `vX.Y.Z` Git tag
7. Publish a GitHub Release with the three preset files attached as assets
8. Comment on any issue/PR that ships in the release

### Pre-release channels

| Branch | Channel | Tag example |
|---|---|---|
| `main` | stable | `v1.2.0` |
| `beta` | beta | `v1.2.0-beta.1` |
| `alpha` | alpha | `v1.2.0-alpha.1` |

### Required secret

`RELEASE_TOKEN` must be set in the repo (or org) secrets: a fine-grained GitHub PAT with **Contents read/write**, **Issues read/write**, **Pull requests read/write**, and permission to bypass branch protection on `main`. Without it the workflow falls back to `GITHUB_TOKEN`, which cannot push the changelog commit through branch protection.

## Code Owners

All changes require a review from `@webgrip/infrastructure`.
