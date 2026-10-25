import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveConfigPresets } from 'renovate/dist/config/presets/index.js';
import { applyPackageRules } from 'renovate/dist/util/package-rules/index.js';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';
import { build, fileOf, profiles } from './profiles.mjs';

async function effective(profile, update) {
  const { config } = await resolveConfigPresets(JSON.parse(readFileSync(fileOf(profile), 'utf8')));
  const { packageRules, vulnerabilityAlerts, ...repo } = config;
  let upgrade = await applyPackageRules({ ...repo, packageRules, ...update });
  if (update.isVulnerabilityAlert) upgrade = mergeChildConfig(upgrade, vulnerabilityAlerts);
  return {
    group: upgrade.groupName ?? null,
    automerge: upgrade.automerge === true,
    approval: upgrade.dependencyDashboardApproval === true,
  };
}

const npm = { manager: 'npm', datasource: 'npm', depName: 'left-pad', packageName: 'left-pad', depType: 'dependencies' };
const action = { manager: 'github-actions', datasource: 'github-tags', depName: 'actions/checkout', packageName: 'actions/checkout', depType: 'action' };

for (const profile of Object.keys(profiles)) {
  test(`${fileOf(profile)} is what scripts/profiles.mjs generates`, () => {
    assert.equal(readFileSync(fileOf(profile), 'utf8'), build(profile));
  });

  test(`${profile}: a major waits for a dashboard tick and does not merge itself`, async () => {
    assert.deepEqual(await effective(profile, { ...npm, updateType: 'major' }), { group: null, automerge: false, approval: true });
  });

  test(`${profile}: a security fix opens without a tick and merges itself`, async () => {
    const result = await effective(profile, { ...npm, updateType: 'minor', isVulnerabilityAlert: true });
    assert.equal(result.approval, false);
    assert.equal(result.automerge, true);
  });

  test(`${profile}: minor and patch updates share one branch and open without a tick`, async () => {
    const minor = await effective(profile, { ...npm, updateType: 'minor' });
    const patch = await effective(profile, { ...npm, updateType: 'patch' });
    assert.equal(minor.group, 'all non-major dependencies');
    assert.equal(patch.group, minor.group);
    assert.equal(minor.approval, false);
    assert.equal(patch.approval, false);
  });
}

for (const profile of ['profile-app', 'profile-site']) {
  test(`${profile}: the grouped non-major pull request waits for a person`, async () => {
    assert.equal((await effective(profile, { ...npm, updateType: 'minor' })).automerge, false);
  });

  test(`${profile}: digest and CI action updates merge themselves`, async () => {
    assert.equal((await effective(profile, { ...npm, updateType: 'digest' })).automerge, true);
    assert.equal((await effective(profile, { ...action, updateType: 'minor' })).automerge, true);
  });
}

for (const profile of ['profile-library', 'profile-image-set']) {
  test(`${profile}: the grouped non-major branch merges itself`, async () => {
    assert.equal((await effective(profile, { ...npm, updateType: 'minor' })).automerge, true);
  });
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
