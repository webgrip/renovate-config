# What each profile does, and why

A profile is the whole Renovate policy of a repository in one `extends` line. This page lists every
decision a profile makes, the reason for it, and where the reasons are weak. Each row names the
part that makes the decision, so a change starts in the right file.

## How a profile is built

`scripts/presets.mjs` merges parts in order with Renovate's own `mergeChildConfig`. Later
`packageRules` win, so order is policy.

| Order | Part | Role |
| --- | --- | --- |
| 1 | `parts/base.json` | Settings every preset shares: pinning, commit types, labels, PR body, manager quirks |
| 2 | `parts/approval.json` | Every update waits for a dashboard tick, and a ticked update has no soak |
| 3 | `apm.json` | Agent packages in `apm.yml` and the `agentstd` pin in `mise.toml` |
| 4 | `parts/non-major.json` | Lifts the tick for minor, patch and pin, groups them, restores the soak |
| 5 | `parts/digests-and-actions.json` (app, site) or `parts/automerge.json` (library, image-set) | Who merges what |
| 6 | `security-automerge.json` | Security fixes merge themselves |
| 7 | `parts/first-party.json` | Webgrip's own non-major updates get their own branch, no soak, automerge |
| 8 | `docker-arg-pins.json` (image-set only) | Dockerfile `ARG` pins under a `# renovate:` line |
| last | `parts/preset-bump.json` | The `webgrip/renovate-config` bump, appended to every generated preset |

`default.json`, `grouped.json`, `review-non-major.json`, `automerge-non-major.json` and
`first-party.json` are generated from the same parts, for repositories that still compose overlays by hand.

## The policy, update by update

| Update | `profile-app`, `profile-site` | `profile-library`, `profile-image-set` | Decided in |
| --- | --- | --- | --- |
| Major | dashboard tick, no soak | dashboard tick, no soak | approval |
| Third-party minor | `all non-major dependencies` PR after 3 days, a person merges | same branch after 3 days, merges itself | non-major, automerge |
| Third-party patch | same PR after 1 day, a person merges | same branch after 1 day, merges itself | non-major, automerge |
| Third-party pin | same PR, a person merges | same branch, merges itself | non-major, automerge |
| Third-party digest or digest pin | `digests and CI actions` branch, merges itself | the non-major branch, merges itself | digests-and-actions, automerge |
| CI action minor, patch, pin, digest | `digests and CI actions` branch after the soak of its type, merges itself | the non-major branch, merges itself | digests-and-actions, automerge |
| Webgrip minor, patch, digest, pin | `webgrip dependencies` branch, no soak, merges itself | same | first-party |
| Security fix | its own PR at once, lowest fixing version, merges itself | same | base, security-automerge |
| Lock file maintenance | monthly, dashboard tick | monthly, merges itself | base, automerge |
| Go toolchain minor | the non-major PR | dashboard tick, no soak | automerge |
| Go toolchain patch | the non-major PR | `Go toolchain patches` branch, merges itself | automerge |
| `webgrip/renovate-config` | its own branch, no soak, merges itself | same | preset-bump |
| Peer dependency | ignored | ignored | base |
| Replacement, rollback | dashboard tick | dashboard tick | approval |

Branches a person merges rebase only on a conflict; branches that merge themselves rebase when
they fall behind. An update still inside its soak stays out of a group instead of holding it.

`scripts/presets.test.mjs` holds this table as data and checks every profile against it with
Renovate's own rule matching.

## Why

**The tick is the strictest gate, and it carries no soak.** Renovate does not persist an approval.
A tick on an update that is still inside its soak is consumed and silently discarded, so a soak on
a ticked update only eats clicks. Where a part lifts the tick, it brings the soak back.

**Non-major work travels in one branch.** Every open branch costs a CI run each time it is rebased,
and the runner pool is small. One grouped branch per run instead of one per dependency.

**Apps wait for a person, libraries do not.** A library's consumers take each release through their
own pull request, so the library's CI is a sufficient gate. An app ships what merges.

**On apps, only code a person would read waits for a person.** A digest moves a tag already pinned
to the same version, and a CI action changes how CI runs, not what ships. They share a branch that
merges itself, apart from the person-merged branch: Renovate merges a group only when every update
in it merges itself, so a single update that waits for a person holds the whole branch.

**A branch that waits for a person rebases only on a conflict.** Rebasing it on every push to the
base branch reruns its CI for a merge nobody is ready to make. A branch that merges itself rebases
when it falls behind, because a red result from an old base, say a test fixed on the base since,
would otherwise keep it from ever merging. That costs at most one rebase per Renovate run.

**Webgrip's own packages skip the soak and the group.** Their release pipeline already gated them,
and we keep their semantic versioning ourselves, so a soak only delays them. A branch of their own
keeps a red third-party update from holding them back, and on apps they no longer wait for a
person. Majors still take a tick. Harbor's proxy projects (`harbor.webgrip.dev/dockerhub/...`)
are third-party.

**Security fixes merge themselves everywhere,** at the lowest version that closes the advisory: the
smallest change that removes the exposure.

**Commit types decide releases.** A dependency minor or patch lands as `fix(deps)` and cuts a patch
release; a major lands as `feat(deps)` and cuts a minor, because a dependency's major is not the
product's major. Digests and pins land as `chore(deps)`, which `semantic-release-config` also
releases as a patch. CI actions land as `ci(actions)` and the preset bump as `chore(renovate)`;
neither releases anything.

**Digests are pinned everywhere except where they cannot be written.** `mise` cannot write a digest
into its tool entries, an action's `with: version:` input cannot take one, and the preset
reference is already a protected tag. Each of these used to abort a whole grouped branch.

**Docker images outside Docker Hub have no release timestamp.** Renovate's default
`timestamp-required` would keep them out of every branch for as long as a soak applies, so they
are `timestamp-optional`. The cost: the soak never holds a ghcr.io, quay.io or Harbor proxy image.

**Renovate merges, not Forgejo.** `platformAutomerge: false`, because Forgejo's
merge-when-checks-succeed merges at once on a branch without required checks.

## Decisions that stay open

1. **Majors never soak.** The tick is their gate, and a soak on a ticked update discards the tick.
   A ticked major can therefore merge the hour it is released. A soak for majors would need a gate
   other than the tick, such as an automerging major branch, which this repository does not want.
2. **The agent-package group in `apm.json` only shapes majors.** The non-major and first-party
   groups come after it and take every non-major agent-package update. For a major, it keeps the
   `apm.yml` and `mise.toml` pins of one package in one branch.
3. **Images outside Docker Hub do not soak.** See the timestamp note above. A datasource that reads
   Harbor's push time would close the gap.
