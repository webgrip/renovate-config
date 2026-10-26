import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, fileOf, generated } from './presets.mjs';
import { deps, effective as resolveUpdate } from './policy.mjs';

const effective = (preset, update) => resolveUpdate([fileOf(preset)], update);
const { npm, action, go, image: proxiedImage, presetBump } = deps;
const webgrip = { image: deps.webgripImage, action: deps.webgripAction, gitTag: deps.webgripGitTag, npm: deps.webgripNpm };

const tick = { group: null, automerge: false, approval: true };
const nonMajor = 'all non-major dependencies';
const safeBranch = 'digests and CI actions';
const ownBranch = { group: 'webgrip dependencies', automerge: true, approval: false, soak: '0 days' };

const policy = [
  ['a major', { ...npm, updateType: 'major' }, { default: tick, reviewed: tick, unattended: tick }],
  ['a minor', { ...npm, updateType: 'minor' }, { default: tick, reviewed: { group: nonMajor, automerge: false, approval: false, soak: '3 days', commitType: 'fix' }, unattended: { group: nonMajor, automerge: true, approval: false, soak: '3 days', commitType: 'fix' } }],
  ['a patch', { ...npm, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor, automerge: false, approval: false, soak: '1 day', commitType: 'fix' }, unattended: { group: nonMajor, automerge: true, approval: false, soak: '1 day', commitType: 'fix' } }],
  ['a digest', { ...npm, updateType: 'digest' }, { default: tick, reviewed: { group: safeBranch, automerge: true, approval: false }, unattended: { group: nonMajor, automerge: true } }],
  ['a Docker digest', { ...proxiedImage, updateType: 'digest' }, { default: tick, reviewed: { group: safeBranch, automerge: true, approval: false, soak: '0 days' }, unattended: { group: nonMajor, automerge: true, approval: false } }],
  ['a Docker digest pin', { ...proxiedImage, updateType: 'pinDigest' }, { default: tick, reviewed: { group: safeBranch, automerge: true, approval: false }, unattended: { group: nonMajor, automerge: true, approval: false } }],
  ['a CI action minor', { ...action, updateType: 'minor' }, { default: tick, reviewed: { group: safeBranch, automerge: true, approval: false, soak: '3 days', commitType: 'ci' }, unattended: { group: nonMajor, automerge: true, commitType: 'ci' } }],
  ['a CI action digest', { ...action, updateType: 'digest' }, { default: tick, reviewed: { group: safeBranch, automerge: true, approval: false }, unattended: { group: nonMajor, automerge: true } }],
  ['a CI action major', { ...action, updateType: 'major' }, { default: tick, reviewed: tick, unattended: tick }],
  ['a Go toolchain minor', { ...go, updateType: 'minor' }, { default: tick, reviewed: { group: nonMajor, automerge: false }, unattended: { group: null, automerge: false, approval: true, soak: '0 days' } }],
  ['a Go toolchain patch', { ...go, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor, automerge: false }, unattended: { group: 'Go toolchain patches', automerge: true, approval: false } }],
  ['a security fix', { ...npm, updateType: 'minor', isVulnerabilityAlert: true }, { default: { approval: false, automerge: false }, reviewed: { approval: false, automerge: true }, unattended: { approval: false, automerge: true } }],
  ['a patch from a Harbor proxy project', { ...proxiedImage, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor }, unattended: { group: nonMajor } }],
  ...Object.entries(webgrip).flatMap(([kind, update]) => [
    [`a Webgrip ${kind} patch`, { ...update, updateType: 'patch' }, { default: tick, reviewed: ownBranch, unattended: ownBranch }],
    [`a Webgrip ${kind} minor`, { ...update, updateType: 'minor' }, { default: tick, reviewed: ownBranch, unattended: ownBranch }],
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
