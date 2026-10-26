import { readFileSync } from 'node:fs';
import { resolveConfigPresets } from 'renovate/dist/config/presets/index.js';
import { applyPackageRules } from 'renovate/dist/util/package-rules/index.js';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';
import { getConfig } from 'renovate/dist/config/defaults.js';

const renovateVulnerabilityDefaults = getConfig().vulnerabilityAlerts;

export const policyFile = 'docs/policy.md';

const resolved = new Map();

function resolve(stack) {
  const key = stack.join('+');
  if (!resolved.has(key)) {
    const merged = stack.map(file => JSON.parse(readFileSync(file, 'utf8'))).reduce((parent, child) => mergeChildConfig(parent, child), {});
    resolved.set(key, resolveConfigPresets(merged));
  }
  return resolved.get(key);
}

export async function effective(stack, update) {
  const { config } = await resolve(stack);
  const { packageRules, vulnerabilityAlerts, ...repo } = config;
  let upgrade = await applyPackageRules({ ...repo, packageRules, ...update });
  if (update.isVulnerabilityAlert) upgrade = mergeChildConfig(upgrade, mergeChildConfig(renovateVulnerabilityDefaults, vulnerabilityAlerts));
  return {
    enabled: upgrade.enabled !== false,
    group: upgrade.groupName ?? null,
    automerge: upgrade.automerge === true,
    approval: upgrade.dependencyDashboardApproval === true,
    soak: upgrade.minimumReleaseAge ?? null,
    commitType: upgrade.semanticCommitType,
    commitScope: upgrade.semanticCommitScope,
  };
}

export const dep = (manager, datasource, packageName, depType, depName = packageName) => ({ manager, datasource, depName, packageName, depType });

export const deps = {
  npm: dep('npm', 'npm', 'left-pad', 'dependencies'),
  peer: dep('npm', 'npm', 'react', 'peerDependencies'),
  image: dep('dockerfile', 'docker', 'harbor.webgrip.dev/dockerhub/library/node', 'stage'),
  action: dep('github-actions', 'github-tags', 'actions/checkout', 'action'),
  go: dep('gomod', 'golang-version', 'go', 'golang'),
  webgripImage: dep('dockerfile', 'docker', 'harbor.webgrip.dev/webgrip/semantic-release', 'stage'),
  webgripAction: dep('github-actions', 'gitea-tags', 'webgrip/workflows', 'action'),
  webgripGitTag: dep('mise', 'git-tags', 'https://forgejo.webgrip.dev/webgrip/agent-standards.git', 'tools', 'webgrip/agent-standards'),
  webgripNpm: dep('npm', 'npm', '@webgrip/ui', 'dependencies'),
  presetBump: dep('renovate-config-presets', 'gitea-tags', 'webgrip/renovate-config', undefined),
};

export const columns = [
  ['`reviewed` (`profile-app`, `profile-site`)', ['reviewed.json']],
  ['`unattended` (`profile-library`, `profile-image-set`)', ['unattended.json']],
  ['`default`', ['default.json']],
  ['`default` + `automerge-non-major`', ['default.json', 'automerge-non-major.json']],
  ['`default` + `review-non-major` + `safe-automerge`', ['default.json', 'review-non-major.json', 'safe-automerge.json']],
];

export const rows = [
  ['npm major', { ...deps.npm, updateType: 'major' }],
  ['npm minor', { ...deps.npm, updateType: 'minor' }],
  ['npm patch', { ...deps.npm, updateType: 'patch' }],
  ['npm pin', { ...deps.npm, updateType: 'pin' }],
  ['npm peer dependency', { ...deps.peer, updateType: 'minor' }],
  ['image major', { ...deps.image, updateType: 'major' }],
  ['image minor', { ...deps.image, updateType: 'minor' }],
  ['image digest', { ...deps.image, updateType: 'digest' }],
  ['image digest pin', { ...deps.image, updateType: 'pinDigest' }],
  ['CI action major', { ...deps.action, updateType: 'major' }],
  ['CI action minor', { ...deps.action, updateType: 'minor' }],
  ['CI action digest', { ...deps.action, updateType: 'digest' }],
  ['Go toolchain minor', { ...deps.go, updateType: 'minor' }],
  ['Go toolchain patch', { ...deps.go, updateType: 'patch' }],
  ['security fix', { ...deps.npm, updateType: 'minor', isVulnerabilityAlert: true }],
  ['Webgrip image major', { ...deps.webgripImage, updateType: 'major' }],
  ['Webgrip image minor', { ...deps.webgripImage, updateType: 'minor' }],
  ['Webgrip image digest', { ...deps.webgripImage, updateType: 'digest' }],
  ['Webgrip action patch', { ...deps.webgripAction, updateType: 'patch' }],
  ['Webgrip agent package minor', { ...deps.webgripGitTag, updateType: 'minor' }],
  ['Webgrip npm package patch', { ...deps.webgripNpm, updateType: 'patch' }],
  ['`webgrip/renovate-config` bump', { ...deps.presetBump, updateType: 'minor' }],
];

export function describe({ enabled, group, automerge, approval, soak, commitType, commitScope }, groupMergesItself = true) {
  if (!enabled) return 'ignored';
  const where = group ? `\`${group}\`` : 'own branch';
  const wait = soak && soak !== '0 days' ? `, after ${soak}` : '';
  const who = approval ? 'tick, then ' : '';
  const merge = !automerge ? 'a person merges' : groupMergesItself ? 'merges itself' : 'a person merges the group';
  return `${where}${wait}: ${who}${merge} · \`${commitType}${commitScope ? `(${commitScope})` : ''}\``;
}

async function column(stack) {
  const outcomes = [];
  for (const [, update] of rows) outcomes.push(await effective(stack, update));
  const heldGroups = new Set(outcomes.filter(outcome => outcome.enabled && outcome.group && !outcome.automerge).map(outcome => outcome.group));
  return outcomes.map(outcome => describe(outcome, !heldGroups.has(outcome.group)));
}

export async function render() {
  const header = `| Update | ${columns.map(([name]) => name).join(' | ')} |`;
  const rule = `| --- | ${columns.map(() => '---').join(' | ')} |`;
  const cells = [];
  for (const [, stack] of columns) cells.push(await column(stack));
  const lines = rows.map(([name], row) => `| ${name} | ${cells.map(cellsOfColumn => cellsOfColumn[row]).join(' | ')} |`);
  return [
    '# Policy table',
    '',
    '`npm run generate` writes this page by resolving each preset and applying its rules with',
    'Renovate’s own code, and `npm test` fails when it is out of date. A pull request that changes',
    'what Renovate does changes this table, so the diff of this file is the behaviour change.',
    '[What each gate does, and why](profiles.md) gives the reasons.',
    '',
    'Each cell reads: the branch, the soak, who merges, and the commit type. `tick` is a dashboard',
    'approval. Renovate merges a group only when every update in it merges itself, so an update that',
    'would merge itself waits when its group also holds updates a person merges. The `profile-*`',
    'presets are generated names for the two gates, and the tests check each of them.',
    '',
    header,
    rule,
    ...lines,
    '',
  ].join('\n');
}
