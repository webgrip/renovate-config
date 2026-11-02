# What each gate does, and why

A gate is the whole Renovate policy of a repository in one `extends` line: `reviewed` when a person
merges third-party non-major updates, `unattended` when green CI does. The profile names are
generated from the gates (`profile-app` and `profile-site` are `reviewed`, `profile-library` is
`unattended`, `profile-image-set` is `unattended` plus `docker-arg-pins`). This page lists every
decision a gate makes, the reason for it, and where the reasons are weak. Each row names the part
that makes the decision, so a change starts in the right file. [ADR 0001](adr/0001-gates-risk-tiers-and-capabilities.md)
records why gate, risk tier and capability are separate questions.

## How a gate is built

`scripts/presets.mjs` merges parts in order with Renovate's own `mergeChildConfig`. Later
`packageRules` win, so order is policy.

| Order | Part | Role |
| --- | --- | --- |
| 1 | `parts/base.json` | Settings every preset shares: pinning, commit types, labels, PR body, manager quirks |
| 2 | `parts/approval.json` | Every update waits for a dashboard tick, and a ticked update has no soak |
| 3 | `apm.json` | Capability: agent packages in `apm.yml` and the `agentstd` pin in `mise.toml`, the lockfile in the same pull request |
| 4 | `parts/non-major.json` | Lifts the tick for minor, patch and pin, groups them, restores the soak |
| 5 | `parts/digests-and-actions.json` (`reviewed`) or `parts/automerge.json` (`unattended`) | The gate: who merges what |
| 6 | `parts/go-module-groups.json` | `golang.org/x` modules and indirect Go modules get a branch each |
| 7 | `parts/risk-tiers.json` | Never-ships dependencies merge themselves; the always-review list keeps the tick |
| 8 | `security-automerge.json` | Security fixes merge themselves |
| 9 | `parts/first-party.json` | Webgrip's own non-major updates get their own branch, no soak, automerge; their majors open without a tick |
| 10 | `parts/ci-tooling-group.json` | Webgrip's pins in CI files get a branch of their own, so it commits as `ci` |
| 11 | `parts/agent-package-group.json` | A branch per agent package, and one for all `webgrip/ai-skills` skills |
| 12 | `docker-arg-pins.json` (`profile-image-set` only) | Capability: Dockerfile `ARG` pins under a `# renovate:` line |
| last | `parts/preset-bump.json` | The `webgrip/renovate-config` bump, appended to every generated preset |

`default.json`, `grouped.json`, `review-non-major.json`, `automerge-non-major.json` and
`first-party.json` are generated from the same parts, for repositories that still compose overlays
by hand; `default` carries parts 1, 2, 6 and 11, `review-non-major`, `automerge-non-major` and
`first-party` end with parts 10 and 11, and `grouped` ends with part 10.

**Capability overlays decide no policy.** `apm.json`, `golang.json` and `docker-arg-pins.json`
set none of `groupName`, `groupSlug`, `automerge`, `dependencyDashboardApproval`,
`minimumReleaseAge` or `rebaseWhen`, and `npm test` fails when one does. That is what lets a
repository put them anywhere in its `extends` list. `gitops.json` is not one of them yet: it sets
its own groups and extends external presets (see the ADR).

## The policy, update by update

[The policy table](policy.md) is generated from the presets themselves: every update type, for every
gate and for the overlay stacks repositories still compose by hand. A pull request that changes
behaviour changes that file, so its diff is the behaviour change.

Branches a person merges rebase only on a conflict; branches that merge themselves rebase when
they fall behind. An update still inside its soak stays out of a group instead of holding it.

## Why

**The tick is the strictest gate, and it carries no soak.** Renovate does not persist an approval.
A tick on an update that is still inside its soak is consumed and silently discarded, so a soak on
a ticked update only eats clicks. Where a part lifts the tick, it brings the soak back.

**Non-major work travels in one branch.** Every open branch costs a CI run each time it is rebased,
and the runner pool is small. One grouped branch per run instead of one per dependency.

**`reviewed` waits for a person, `unattended` does not.** A library's consumers take each release
through their own pull request, so the library's CI is a sufficient gate. An app ships what merges.

**Risk belongs to the dependency, not the repository.** npm `devDependencies`, Composer
`require-dev` and `@types/*` are not installed in what a repository deploys, so a green CI run is
the whole question: under either gate they share a `development dependencies` branch that merges
itself after the soak of their update type, apart from the branch a person merges. The
always-review list (token and OIDC libraries, database drivers) waits for a tick in a branch of its
own under either gate, unless the package is only a dev dependency. Majors, security fixes,
Webgrip's own packages and the preset bump keep their rules, which come later.

**Under `reviewed`, only code a person would read waits for a person.** A digest moves a tag already pinned
to the same version, and a CI action changes how CI runs, not what ships. They share a branch that
merges itself, apart from the person-merged branch: Renovate merges a group only when every update
in it merges itself, so a single update that waits for a person holds the whole branch.

**A branch that waits for a person rebases only on a conflict.** Rebasing it on every push to the
base branch reruns its CI for a merge nobody is ready to make. A branch that merges itself rebases
when it falls behind, because a red result from an old base, say a test fixed on the base since,
would otherwise keep it from ever merging. That costs at most one rebase per Renovate run.

**Webgrip's own packages skip the soak and the group.** Their release pipeline already gated them,
and we keep their semantic versioning ourselves, so a soak only delays them. A branch of their own
keeps a red third-party update from holding them back, and under `reviewed` they no longer wait
for a person. Their majors open a pull request without a tick and wait for a person to merge them: a
major of our own is a break we chose to make, so nobody should have to ask Renovate for it, and
nobody should find it merged unread. Harbor's proxy projects (`harbor.webgrip.dev/dockerhub/...`)
are third-party.

**Webgrip's pins in files that never ship commit as `ci` and release nothing.** The four shared tooling
repositories (workflows, semantic-release-config, agent-standards, renovate-config) pin each other,
mostly in CI files, and a release of one asks Renovate to update its consumers. When those bumps
landed as `fix(deps)`, a release of A merged a bump into B that released B, whose bump merged into A
and released A again, and each round opened a pull request in every consuming repository. A pin
in `.forgejo/**`, `.github/**` or `mise.toml` changes how a repository is built, not what it ships,
so a Webgrip package found there (a reusable workflow or composite action ref, the
`harbor.webgrip.dev/webgrip/semantic-release` toolchain image in `container:`, `toolchain-image:` or
a mise task that runs it) lands as `ci(tooling)` for every update type, majors included, and `semantic-release-config` cuts
no release for `ci`. The rule sits in `parts/base.json`, after the per-update-type commit rules, so
every preset carries it, `default` included.

The same pins get a branch of their own, `webgrip CI dependencies`, next to `webgrip dependencies`.
Renovate gives a branch the highest commit type among its updates (`chore` < `ci` < `build` < `fix`
< `feat`), so one shared branch would commit every CI pin as `fix(deps)` whenever an update that
ships sat in it, which is how `fix(actions): Update webgrip dependencies` kept releasing. Every
stack that groups updates carries `parts/ci-tooling-group.json` after its grouping parts. The rule
changes the branch and the major split: in a gate it opens without a tick, skips the soak and
merges itself like the rest of Webgrip's packages; in a hand-composed stack it keeps the tick, soak
and merge of the branch it replaces. Majors of these pins join the branch, and `separateMajorMinor`
is off for them, so every pin moves straight to the newest release. Two pins of `webgrip/workflows`
on different majors in one file used to split into a minor in the shared branch and a major of
their own, and whichever merged second conflicted. A Webgrip major never merges itself, so a branch
that holds one waits for a person. Majors of Webgrip packages that ship stay out of both branches,
one pull request each that a person merges. A repository gets at most two Webgrip branches per
round: one `ci`, one `fix`, plus one per agent package, whose post-upgrade install needs its own
branch.

A pin of the same image in `mise.toml` was left out at first: Unfold runs the toolchain image in
a `release-check` task, and that pin opened a `fix(deps)` branch of its own next to the `ci(tooling)`
one, so one toolchain release opened two pull requests and cut an Unfold release. A Webgrip package
in a Dockerfile or `package.json` still ships and keeps its `fix`.

`webgrip/workflows` is excluded by name. Its `.forgejo/workflows` and `.forgejo/composite-actions`
are what it ships: a caller receives the toolchain image pinned as an input default in a reusable
workflow, so that bump must release. Pins there keep the commit type they had: input defaults
(its own `custom.regex` manager) land as `fix(deps)`, and the image its own CI jobs run in keeps the
CI action rule, `ci(actions)`, which in its shared toolchain branch is outranked by the `fix`.
Its self-references are `@main` and not managed. Any other repository whose `.forgejo` or `.github`
holds what it ships needs the same exclusion here.

| Repository | Webgrip pins that commit as `ci(tooling)` | Webgrip pins that keep releasing |
| --- | --- | --- |
| `webgrip/renovate-config` | workflows refs and the toolchain `container:` image in `.forgejo/workflows` | the agent-standards tag inside the presets (`fix(deps)`) |
| `webgrip/semantic-release-config` | workflows refs and the toolchain `container:` image in `.forgejo/workflows` | none today; a `@webgrip/*` package in `package.json` would stay `fix(deps)` |
| `webgrip/agent-standards` | workflows refs, `toolchain-image:` and the toolchain `container:` image in `.forgejo/workflows` | none today; its release config comes from the toolchain image |
| `webgrip/workflows` | none | input defaults in `.forgejo/workflows` and `.forgejo/composite-actions` (`fix(deps)`) |
| any other consumer | the same CI pins | `@webgrip/*` npm packages, Webgrip images in a Dockerfile or chart, tools in `mise.toml` (`fix(deps)`) |

Agent packages in `apm.yml` and `mise.toml` stay `chore(agents)` and the preset bump `chore(renovate)`,
each in its own branch, for the reasons below and in `parts/preset-bump.json`.

**Agent packages get a branch per package, and the lockfile comes with the bump.**
`parts/agent-package-group.json` comes after the first-party part, so an agent package leaves the
shared Webgrip branch for a branch of its own: every pin of `webgrip/agent-standards` in one, every
`webgrip/ai-skills` skill in another. Two reasons. Renovate takes a branch's post-upgrade task from the first update in the
branch, sorted by name, so in the shared branch `agentstd install` ran only when agent-standards
sorted first, and a skill that sorted first gave the command its own version as the tag. And
every bump rewrites `apm.lock.yaml`, which `apm audit` in `agentstd check` compares with the
deployed files, so a bump without the install fails CI. A bump of agent-standards installs with
the CLI from its new tag; any other agent package installs with the agent-standards release named
in `apm.json`, which this repository's own Renovate keeps current. Agent-package bumps land as
`chore(agents)` and cut no release: they change what agents read, not what ships.

**Security fixes merge themselves everywhere,** at the lowest version that closes the advisory: the
smallest change that removes the exposure.

**Commit types decide releases.** A dependency minor or patch lands as `fix(deps)` and cuts a patch
release; a major lands as `feat(deps)` and cuts a minor, because a dependency's major is not the
product's major. Digests and pins land as `chore(deps)`, which `semantic-release-config` also
releases as a patch. CI actions land as `ci(actions)`, Webgrip pins in CI files as `ci(tooling)` and the preset bump as
`chore(renovate)`; none of them releases anything.

**Digests are pinned everywhere except where they cannot be written.** `mise` cannot write a digest
into its tool entries, an action's `with: version:` input cannot take one, and the preset
reference is already a protected tag. Each of these used to abort a whole grouped branch.

**Docker images outside Docker Hub have no release timestamp.** Renovate's default
`timestamp-required` would keep them out of every branch for as long as a soak applies, so they
are `timestamp-optional`. The cost: the soak never holds a ghcr.io, quay.io or Harbor proxy image.

**Renovate merges, not Forgejo, unless a repository opts in.** Every preset sets
`platformAutomerge: false`, because Forgejo's merge-when-checks-succeed merges at once on a
branch without required checks. A repository whose protected branches require its `gate` check
extends `platform-automerge` after its gate, and Forgejo merges as soon as that check is green
instead of at Renovate's next run, up to an hour later. homelab-cluster's repo-config validator
refuses the overlay on a repository whose branches do not require the gate
([homelab-cluster ADR-0084](https://forgejo.webgrip.dev/webgrip/homelab-cluster/src/branch/main/docs/techdocs/docs/adr/adr-0084-a-branch-rule-requires-one-gate-and-forgejo-merges-renovate-on-it.md)).

## Decisions that stay open

The always-review list, the npm soak, build tools in `devDependencies`, the commit type of
never-ships updates, Unfold's gate and a GitOps gate are open questions in
[ADR 0001](adr/0001-gates-risk-tiers-and-capabilities.md). The older ones:

1. **Majors never soak.** The tick is their gate, and a soak on a ticked update discards the tick.
   A ticked major can therefore merge the hour it is released. A soak for majors would need a gate
   other than the tick, such as an automerging major branch, which this repository does not want.
2. **A skill bump installs with the agent-standards release this preset names, not the one the
   repository pins.** Renovate cannot read a pin that is not part of the bump. The two differ only
   while this repository has not yet taken a new agent-standards release, or while a repository
   is behind on its own agent-standards bump, which then opens at the same time. When the two
   releases write a different lockfile, CI fails and the skill branch waits for a person.
3. **Images outside Docker Hub do not soak.** See the timestamp note above. A datasource that reads
   Harbor's push time would close the gap.
