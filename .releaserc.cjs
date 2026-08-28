'use strict';

// Org Renovate preset: v* tags on main (consumers pin github>webgrip/renovate-config#vX.Y.Z),
// presets validated before the tag is cut, and the preset JSON files uploaded as release assets.
// The emoji section names are kept via extraNotesTypes (prepended, so they win over defaults).
const { makeConfig } = require('@webgrip/semantic-release-config');

// No verifyReleaseCmd: preset validation is the validate/validate-all jobs, which gate the
// release job via `needs` — the same command ran there moments earlier. Running it again here
// required the renovate devDependency tree inside the release container, and installing that
// tree is what broke the release job on the hardened toolchain image (2026-08-28).
module.exports = makeConfig({
  releaseAssets: ['default.json', 'grouped.json', 'safe-automerge.json', 'gitops.json'],
  extraNotesTypes: [
    { type: 'feat', section: '🚀 New Preset Rules & Features' },
    { type: 'fix', section: '🐛 Rule Corrections & Fixes' },
    { type: 'chore', section: '🔧 Maintenance' },
    { type: 'docs', section: '📚 Documentation' },
    { type: 'ci', section: '⚙️ CI / CD' },
    { type: 'refactor', section: '♻️ Refactoring' },
    { type: 'perf', section: '⚡ Performance' },
    { type: 'revert', section: '⏪ Reverts' },
  ],
});
