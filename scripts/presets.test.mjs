import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveConfigPresets } from 'renovate/dist/config/presets/index.js';
import { applyPackageRules } from 'renovate/dist/util/package-rules/index.js';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';
import { build, fileOf, generated } from './presets.mjs';

async function effective(preset, update) {
  const { config } = await resolveConfigPresets(JSON.parse(readFileSync(fileOf(preset), 'utf8')));
  const { packageRules, vulnerabilityAlerts, ...repo } = config;
  let upgrade = await applyPackageRules({ ...repo, packageRules, ...update });
  if (update.isVulnerabilityAlert) upgrade = mergeChildConfig(upgrade, vulnerabilityAlerts);
  return {
    group: upgrade.groupName ?? null,
    automerge: upgrade.automerge === true,
    approval: upgrade.dependencyDashboardApproval === true,
    soak: upgrade.minimumReleaseAge ?? null,
    commitType: upgrade.semanticCommitType,
  };
}

const dep = (manager, datasource, packageName, depType, depName = packageName) => ({ manager, datasource, depName, packageName, depType });
const npm = dep('npm', 'npm', 'left-pad', 'dependencies');
const action = dep('github-actions', 'github-tags', 'actions/checkout', 'action');
const proxiedImage = dep('dockerfile', 'docker', 'harbor.webgrip.dev/dockerhub/library/node', 'stage');
const webgrip = {
  image: dep('dockerfile', 'docker', 'harbor.webgrip.dev/webgrip/semantic-release', 'stage'),
  action: dep('github-actions', 'gitea-tags', 'webgrip/workflows', 'action'),
  gitTag: dep('mise', 'git-tags', 'https://forgejo.webgrip.dev/webgrip/agent-standards.git', 'tools', 'webgrip/agent-standards'),
  npm: dep('npm', 'npm', '@webgrip/ui', 'dependencies'),
};
const presetBump = dep('renovate-config-presets', 'gitea-tags', 'webgrip/renovate-config', undefined);

const tick = { group: null, automerge: false, approval: true };
const nonMajor = 'all non-major dependencies';
const ownBranch = { group: 'webgrip dependencies', automerge: true, approval: false, soak: '0 days' };

const policy = [
  ['a major', { ...npm, updateType: 'major' }, { default: tick, reviewed: tick, unattended: tick }],
  ['a minor', { ...npm, updateType: 'minor' }, { default: tick, reviewed: { group: nonMajor, automerge: false, approval: false, soak: '3 days', commitType: 'fix' }, unattended: { group: nonMajor, automerge: true, approval: false, soak: '3 days', commitType: 'fix' } }],
  ['a patch', { ...npm, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor, automerge: false, approval: false, soak: '1 day', commitType: 'fix' }, unattended: { group: nonMajor, automerge: true, approval: false, soak: '1 day', commitType: 'fix' } }],
  ['a digest', { ...npm, updateType: 'digest' }, { default: tick, reviewed: { automerge: true }, unattended: { group: nonMajor, automerge: true } }],
  ['a Docker digest', { ...proxiedImage, updateType: 'digest' }, { default: tick, reviewed: { automerge: true, approval: true }, unattended: { group: nonMajor, automerge: true, approval: false } }],
  ['a CI action minor', { ...action, updateType: 'minor' }, { default: tick, reviewed: { automerge: true }, unattended: { automerge: true } }],
  ['a security fix', { ...npm, updateType: 'minor', isVulnerabilityAlert: true }, { default: { approval: false, automerge: false }, reviewed: { approval: false, automerge: true }, unattended: { approval: false, automerge: true } }],
  ['a patch from a Harbor proxy project', { ...proxiedImage, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor }, unattended: { group: nonMajor } }],
  ...Object.entries(webgrip).flatMap(([kind, update]) => [
    [`a Webgrip ${kind} patch`, { ...update, updateType: 'patch' }, { default: tick, reviewed: ownBranch, unattended: ownBranch }],
    [`a Webgrip ${kind} minor`, { ...update, updateType: 'minor' }, { default: tick, reviewed: { group: nonMajor }, unattended: { group: nonMajor } }],
  ]),
  ['a Webgrip major', { ...webgrip.image, updateType: 'major' }, { default: tick, reviewed: tick, unattended: tick }],
  ['the preset bump', { ...presetBump, updateType: 'minor' }, Object.fromEntries(['default', 'reviewed', 'unattended'].map(kind => [kind, { group: null, automerge: true, approval: false, soak: '0 days', commitType: 'chore' }]))],
];

const presetsByPolicy = {
  default: ['default'],
  reviewed: ['profile-app', 'profile-site'],
  unattended: ['profile-library', 'profile-image-set'],
};

for (const name of Object.keys(generated)) {
  test(`${fileOf(name)} is what scripts/presets.mjs generates`, () => {
    assert.equal(readFileSync(fileOf(name), 'utf8'), build(name));
  });
}

for (const [kind, presets] of Object.entries(presetsByPolicy)) {
  for (const preset of presets) {
    for (const [what, update, expected] of policy) {
      test(`${preset}: ${what}`, async () => {
        const actual = await effective(preset, update);
        const want = expected[kind];
        assert.deepEqual(Object.fromEntries(Object.keys(want).map(key => [key, actual[key]])), want);
      });
    }
  }
}

test('profile-image-set reads Dockerfile ARG pins under a renovate directive', () => {
  const managers = JSON.parse(readFileSync('profile-image-set.json', 'utf8')).customManagers;
  const dockerfile = [
    '# renovate: datasource=docker depName=docker.io/library/node versioning=docker',
    `ARG NODE_IMAGE=harbor.example/dockerhub/library/node:24-alpine@sha256:${'a'.repeat(64)}`,
    '',
  ].join('\n');
  const found = managers
    .filter(manager => manager.managerFilePatterns.some(pattern => new RegExp(pattern.slice(1, -1)).test('ops/docker/x/Dockerfile')))
    .flatMap(manager => manager.matchStrings.flatMap(pattern => [...dockerfile.matchAll(new RegExp(pattern, 'g'))]));
  assert.equal(found[0]?.groups.currentValue, '24-alpine');
  assert.equal(found[0]?.groups.currentDigest, `sha256:${'a'.repeat(64)}`);
});
