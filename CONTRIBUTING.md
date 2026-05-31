# Contributing

## Principles

- Keep the default preset stable and conservative
- Prefer additive, opt-in overlays over making the default broader
- Document all behavior changes in `README.md`, `docs/renovate.md`, and `examples/` when relevant
- Release changes with a new SemVer tag so consumers can opt in deliberately

## Validation

Before proposing a change, run:

```bash
npx --yes --package renovate renovate-config-validator --strict default.json grouped.json safe-automerge.json
```

## Review expectations

- All changes go through pull request review
- `@webgrip/infrastructure` owns approvals for this repository
- Changes that alter `default.json` should include a note about consumer impact and migration guidance
