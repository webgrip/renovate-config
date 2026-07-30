'use strict';

// Org Renovate preset: v* tags on main (consumers pin github>webgrip/renovate-config#vX.Y.Z),
// presets validated before the tag is cut, and the preset JSON files uploaded as release assets.
// The emoji section names are kept via extraNotesTypes (prepended, so they win over defaults).
const { makeConfig } = require('@webgrip/semantic-release-config');

module.exports = makeConfig({
  verifyReleaseCmd: "npm run validate && echo 'presets validated'",
  releaseAssets: [
    'default.json',
    'grouped.json',
    'safe-automerge.json',
    'gitops.json',
    'golang.json',
    'forgejo.json',
  ],
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
