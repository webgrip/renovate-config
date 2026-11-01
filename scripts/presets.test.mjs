import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';
import { aliases, build, capabilities, fileOf, generated, policyKeys } from './presets.mjs';
import { deps, effective as resolveUpdate } from './policy.mjs';

const effective = (preset, update) => resolveUpdate([fileOf(preset)], update);
const { npm, action, go, image: proxiedImage, presetBump } = deps;
const webgrip = { image: deps.webgripImage, action: deps.webgripAction, gitTag: deps.webgripGitTag, npm: deps.webgripNpm };

const tick = { group: null, automerge: false, approval: true };
const nonMajor = 'all non-major dependencies';
const safeBranch = 'digests and CI actions';
const ownBranch = { group: 'webgrip dependencies', automerge: true, approval: false, soak: '0 days' };
const neverShips = soak => ({ group: 'development dependencies', automerge: true, approval: false, soak });
const alwaysReview = { group: null, automerge: false, approval: true, soak: '0 days' };
const everyGate = expected => ({ reviewed: expected, unattended: expected });
const ownMajor = { group: null, automerge: false, approval: false, soak: '0 days' };
const agentPackage = '{{depName}} agent package';
const agentBranch = (group, install) => ({ ...ownBranch, group, commitType: 'chore', commitScope: 'agents', install });
const installNew = 'uv tool run --from git+https://forgejo.webgrip.dev/webgrip/agent-standards.git@{{{newValue}}}#subdirectory=cli agentstd install';
const ciTooling = { commitType: 'ci', commitScope: 'tooling' };
const ciBranch = { group: 'webgrip CI dependencies', automerge: true, approval: false, soak: '0 days', ...ciTooling };
const ciMajor = { ...ownMajor, ...ciTooling };
const ciOnly = { workflowRef: deps.webgripCiWorkflow, compositeRef: deps.webgripCiComposite, container: deps.webgripCiContainer, toolchainInput: deps.webgripCiToolchainInput, githubAction: deps.webgripGithubCiAction };
const ships = { npm: deps.webgripNpm, releaseConfig: deps.webgripReleaseConfig, image: deps.webgripImage, gitTag: deps.webgripGitTag, workflowsDefault: deps.workflowsToolchainDefault };
const installPinned = /^uv tool run --from git\+https:\/\/forgejo\.webgrip\.dev\/webgrip\/agent-standards\.git@v\d+\.\d+\.\d+#subdirectory=cli agentstd install$/;

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
  ['a devDependency minor', { ...deps.devDependency, updateType: 'minor' }, { default: tick, ...everyGate(neverShips('3 days')) }],
  ['a devDependency major', { ...deps.devDependency, updateType: 'major' }, { default: tick, ...everyGate(tick) }],
  ['a Composer require-dev patch', { ...deps.composerDev, updateType: 'patch' }, { default: tick, ...everyGate(neverShips('1 day')) }],
  ['an @types patch outside devDependencies', { ...deps.types, updateType: 'patch' }, { default: tick, ...everyGate(neverShips('1 day')) }],
  ['an always-review npm minor', { ...deps.tokenLibrary, updateType: 'minor' }, { default: tick, ...everyGate(alwaysReview) }],
  ['an always-review Go patch', { ...deps.databaseDriver, updateType: 'patch' }, { default: tick, ...everyGate(alwaysReview) }],
  ['an always-review major', { ...deps.tokenLibrary, updateType: 'major' }, { default: tick, ...everyGate(tick) }],
  ['an always-review security fix', { ...deps.tokenLibrary, updateType: 'patch', isVulnerabilityAlert: true }, { default: { approval: false, automerge: false }, ...everyGate({ approval: false, automerge: true }) }],
  ['an always-review library used only by tests', { ...deps.testDatabaseDriver, updateType: 'minor' }, { default: tick, ...everyGate(neverShips('3 days')) }],
  ['a Webgrip devDependency patch', { ...deps.webgripDevDependency, updateType: 'patch' }, { default: tick, ...everyGate(ownBranch) }],
  ['a golang.org/x minor', { ...deps.goX, updateType: 'minor' }, { default: { group: 'golang.org/x modules', approval: true }, reviewed: { group: 'golang.org/x modules', automerge: false, approval: false }, unattended: { group: 'golang.org/x modules', automerge: true, approval: false } }],
  ['a patch from a Harbor proxy project', { ...proxiedImage, updateType: 'patch' }, { default: tick, reviewed: { group: nonMajor }, unattended: { group: nonMajor } }],
  ...Object.entries(webgrip).flatMap(([kind, update]) => [
    [`a Webgrip ${kind} patch`, { ...update, updateType: 'patch' }, { default: tick, reviewed: ownBranch, unattended: ownBranch }],
    [`a Webgrip ${kind} minor`, { ...update, updateType: 'minor' }, { default: tick, reviewed: ownBranch, unattended: ownBranch }],
  ]),
  ['a Webgrip major', { ...webgrip.image, updateType: 'major' }, { default: tick, reviewed: ownMajor, unattended: ownMajor }],
  ['a Webgrip agent package major', { ...deps.agentPackage, updateType: 'major' }, { default: { ...tick, group: agentPackage }, reviewed: { ...ownMajor, group: agentPackage, install: installNew }, unattended: { ...ownMajor, group: agentPackage, install: installNew } }],
  ...[['agent package', deps.agentPackage], ['agentstd pin', deps.agentCli]].map(([what, update]) => [`a Webgrip ${what} minor`, { ...update, updateType: 'minor' }, { default: { ...tick, group: agentPackage }, reviewed: agentBranch(agentPackage, installNew), unattended: agentBranch(agentPackage, installNew) }]),
  ['a Webgrip skill patch', { ...deps.agentSkill, updateType: 'patch' }, { default: { ...tick, group: 'webgrip/ai-skills skills' }, reviewed: agentBranch('webgrip/ai-skills skills', installPinned), unattended: agentBranch('webgrip/ai-skills skills', installPinned) }],
  ...Object.entries(ciOnly).flatMap(([kind, update]) => [
    [`a Webgrip ${kind} in CI files, patch`, { ...update, updateType: 'patch' }, { default: { ...tick, ...ciTooling }, ...everyGate(ciBranch) }],
    [`a Webgrip ${kind} in CI files, minor`, { ...update, updateType: 'minor' }, { default: { ...tick, ...ciTooling }, ...everyGate(ciBranch) }],
    [`a Webgrip ${kind} in CI files, major`, { ...update, updateType: 'major' }, { default: { ...tick, ...ciTooling }, ...everyGate(ciMajor) }],
  ]),
  ['a Webgrip toolchain image digest in a CI container:', { ...deps.webgripCiContainer, updateType: 'digest' }, { default: { ...tick, ...ciTooling }, ...everyGate(ciBranch) }],
  ['@webgrip/semantic-release-config in package.json, minor', { ...deps.webgripReleaseConfig, updateType: 'minor' }, { default: { ...tick, commitType: 'fix', commitScope: 'deps' }, ...everyGate({ ...ownBranch, commitType: 'fix', commitScope: 'deps' }) }],
  ['webgrip/workflows: the toolchain input default it ships, minor', { ...deps.workflowsToolchainDefault, updateType: 'minor' }, { default: { ...tick, commitType: 'fix', commitScope: 'deps' }, ...everyGate({ ...ownBranch, commitType: 'fix', commitScope: 'deps' }) }],
  ['webgrip/workflows: the image its own CI job runs in keeps the CI action rule, patch', { ...deps.workflowsOwnCiContainer, updateType: 'patch' }, { default: { ...tick, commitType: 'ci', commitScope: 'actions' }, ...everyGate({ ...ownBranch, commitType: 'ci', commitScope: 'actions' }) }],
  ['the preset bump', { ...presetBump, updateType: 'minor' }, Object.fromEntries(['default', 'reviewed', 'unattended'].map(kind => [kind, { group: null, automerge: true, approval: false, soak: '0 days', commitType: 'chore' }]))],
];

const presetsByPolicy = {
  default: ['default'],
  reviewed: ['reviewed', 'profile-app', 'profile-site'],
  unattended: ['unattended', 'profile-library', 'profile-image-set'],
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
        const { install, ...rest } = want;
        assert.deepEqual(Object.fromEntries(Object.keys(rest).map(key => [key, actual[key]])), rest);
        if (install instanceof RegExp) assert.match(actual.install, install);
        else if (install !== undefined) assert.equal(actual.install, install);
      });
    }
  }
}

async function branchesOf(preset, updates) {
  const branches = new Map();
  for (const update of updates) {
    const { group, commitType } = await effective(preset, update);
    branches.set(group, [...(branches.get(group) ?? []), commitType]);
  }
  return branches;
}

for (const preset of [...presetsByPolicy.reviewed, ...presetsByPolicy.unattended]) {
  test(`${preset}: Webgrip non-major updates land in one CI branch that commits as ci and one shipping branch that commits as fix`, async () => {
    const nonMajors = ['patch', 'minor', 'digest'];
    const ci = await branchesOf(preset, Object.values(ciOnly).flatMap(update => nonMajors.map(updateType => ({ ...update, updateType }))));
    assert.deepEqual([...ci.keys()], ['webgrip CI dependencies']);
    assert.deepEqual(new Set(ci.get('webgrip CI dependencies')), new Set(['ci']));
    const shipping = await branchesOf(preset, Object.values(ships).flatMap(update => ['patch', 'minor'].map(updateType => ({ ...update, updateType }))));
    assert.deepEqual([...shipping.keys()], ['webgrip dependencies']);
    assert.deepEqual(new Set(shipping.get('webgrip dependencies')), new Set(['fix']));
  });

  test(`${preset}: a Webgrip major stays out of both shared branches`, async () => {
    const majors = await branchesOf(preset, [...Object.values(ciOnly), ...Object.values(ships), deps.workflowsOwnCiContainer].map(update => ({ ...update, updateType: 'major' })));
    assert.deepEqual([...majors.keys()], [null]);
  });
}

const composedStacks = [
  ['default.json', 'automerge-non-major.json'],
  ['default.json', 'review-non-major.json', 'safe-automerge.json'],
  ['default.json', 'grouped.json'],
  ['default.json', 'review-non-major.json', 'first-party.json'],
];

for (const stack of composedStacks) {
  test(`${stack.join(' + ')}: no group mixes a Webgrip CI-only pin with an update that ships`, async () => {
    for (const update of Object.values(ciOnly)) {
      for (const updateType of ['patch', 'minor']) {
        const { group, commitType } = await resolveUpdate(stack, { ...update, updateType });
        assert.deepEqual({ group, commitType }, { group: 'webgrip CI dependencies', commitType: 'ci' });
      }
    }
  });
}

const withoutDescription = file => {
  const { description, ...config } = JSON.parse(readFileSync(file, 'utf8'));
  return config;
};

for (const [name, { gate, capabilities: extra = [] }] of Object.entries(aliases)) {
  test(`${fileOf(name)} is the ${gate} gate${extra.map(file => ` plus ${file}`).join('')}`, () => {
    const expected = [fileOf(gate), ...extra].map(withoutDescription).reduce((parent, child) => mergeChildConfig(parent, child));
    assert.deepEqual(withoutDescription(fileOf(name)), expected);
  });
}

function policyKeysIn(value, path = '') {
  if (Array.isArray(value)) return value.flatMap((item, index) => policyKeysIn(item, `${path}[${index}]`));
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [...(policyKeys.includes(key) ? [`${path}.${key}`] : []), ...policyKeysIn(child, `${path}.${key}`)]);
}

for (const capability of capabilities) {
  test(`${capability} teaches detection and decides no policy`, () => {
    assert.deepEqual(policyKeysIn(JSON.parse(readFileSync(capability, 'utf8'))), []);
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

test('platform-automerge hands the merge to the platform and decides nothing else', () => {
  const overlay = JSON.parse(readFileSync('platform-automerge.json', 'utf8'));
  const { $schema, description, ...settings } = overlay;
  assert.deepEqual(settings, { platformAutomerge: true });
  const resolved = mergeChildConfig(mergeChildConfig(JSON.parse(readFileSync('default.json', 'utf8')), JSON.parse(readFileSync('automerge-non-major.json', 'utf8'))), overlay);
  assert.equal(resolved.platformAutomerge, true, 'extended after the automerge overlay, it wins over the default');
});
