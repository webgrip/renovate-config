# AGENTS.md — webgrip/renovate-config

The preset table and the consumer `extends` snippets are in [`README.md`](README.md). This file
carries the things a JSON preset cannot tell you.

## Shape

Six presets, each a single JSON file at the repo root: `default.json` (strict base) plus the
opt-in overlays `grouped.json`, `safe-automerge.json`, `gitops.json`, `golang.json`, and
`forgejo.json`. `package.json` is `private: true` and exists only to pin the Renovate CLI for
validation and to drive semantic-release — **nothing here is published to a registry**.

## Consumers resolve presets over GitHub, but Forgejo cuts the releases

Consumers extend `github>webgrip/renovate-config#vX.Y.Z`. Renovate reads that ref from the
**GitHub mirror**, while Forgejo is the release authority that creates the tag. A preset change
is therefore not live for consumers until the tag exists *and* the mirror has it. Adding a new
preset file means the consumers' `extends` line has to name it — a file that nobody extends is
dead weight.

Pin releases; do not tell a consumer to extend `#main`.

## Validation is the gate

`npm run validate` runs `renovate-config-validator --strict` over all six files, and
`.forgejo/workflows/validate.yml` runs one matrix job per preset on every pull request. A new
preset must be added to **both** the `validate` script and that matrix, or it ships unvalidated.
`--strict` rejects unknown and deprecated fields, so a config option that Renovate has since
renamed fails here rather than silently doing nothing in a consumer.

## Per-preset notes worth knowing

- **`default.json` is deliberately strict**: dashboard approval, pinned ranges, low concurrency,
  delayed releases, no automerge. Loosening it changes every consuming repo at once; loosen in
  an overlay instead.
- **`forgejo.json` uses `force:`, which is admin-level, and that is intentional.** Forgejo
  Actions do not populate the commit-status API that Renovate's `prCreation: not-pending` reads
  (`GET /commits/{sha}/status` comes back empty even on green CI), so `not-pending` never
  resolves and PRs hang for the full `prNotPendingHours`. Consumers extend `:default` at repo
  level, which only a `force` override beats.
- **`golang.json`** exists because Renovate leaves indirect Go modules unmanaged by default; it
  also tidies `go.mod`/`go.sum` in-branch and rewrites `/vN` import paths.
- `safe-automerge.json` automerges digest updates and low-risk Actions updates only. Widening
  what it automerges is a decision, not a tweak.

## Release traps

- `chore(deps)` / `build(deps)` cut a patch; a dependency **major** is not a product-breaking
  change and must not cut a major here.
- Releases and promotion PRs run as the `webgrip-ci` bot, with `WEBGRIP_CI_TOKEN` — never
  `secrets.FORGEJO_TOKEN`, which resolves to the built-in per-job token.
- `open_promotion_pr.yml` is inert until a `next` branch exists; it talks to the Forgejo REST
  API because `gh` is GitHub-only.
- **`actions/checkout@v5`, never `@v6`** — v6 is broken on non-GitHub runners.

## Repo rules

- **Comments are NOT allowed.** Always communicate intent with code: a precise name, a type, a
  smaller function, a test that states the case. A comment is a failure. This holds for every
  language in the repo, prose in YAML and TOML included. Machine-read directives stay, because the
  toolchain acts on them as syntax: `// @ts-check`, `eslint-disable`, `<!-- prettier-ignore -->`,
  `# syntax=`, `# renovate:`, `# yaml-language-server:`, and shebangs. Doc-comment forms the
  toolchain itself reads are not comments either and stay: godoc directly above an exported
  identifier, rustdoc `///` and `//!`, and PHPDoc blocks carrying type tags. Anything that outlives
  a single expression belongs in `docs/` or an ADR, where it gets reviewed, linked and kept
  current. The estate decision is
  [ADR 0006](https://forgejo.webgrip.dev/webgrip/workflows/src/branch/main/docs/adrs/0006-no-comments-in-code.md).

Renovate presets are JSON, which has no comment syntax; the `description` field is the
documented place for intent and every preset here already uses it.
