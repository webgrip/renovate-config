import { readFileSync, writeFileSync } from 'node:fs';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';

const strict = ['parts/base.json', 'parts/approval.json'];
const reviewed = [...strict, 'apm.json', 'parts/non-major.json', 'parts/digests-and-actions.json', 'security-automerge.json', 'parts/first-party.json'];
const unattended = [...strict, 'apm.json', 'parts/non-major.json', 'parts/automerge.json', 'security-automerge.json', 'parts/first-party.json'];

const appPolicy =
  'Minor, patch and pin updates arrive together in one pull request a person merges; digests, CI action updates, Webgrip’s own non-major updates and security fixes merge themselves on green in branches of their own; majors wait for a dashboard tick.';

export const generated = {
  default: {
    description:
      'Webgrip org default Renovate preset — strict, conservative defaults for all repositories. Every update waits for a dashboard tick and the tick is the only gate, so there is no release-age soak to double-gate it. Per-type semantic commits and labels, OSV vulnerability alerts, and Merge Confidence badges included. Schedule is \'at any time\' since 2026-09-18: with every update behind a tick, nothing opens unattended anyway, so a window only delayed work a human had already asked for, and Renovate does not persist an approval it cannot act on, so a tick made outside the window could be silently discarded. A repo that wants quiet hours can set its own schedule.',
    parts: strict,
  },
  'review-non-major': {
    description:
      'Opt-in overlay for repositories where a person reviews dependency updates but should not tick them one by one: minor, patch and pin updates share one pull request that opens without a dashboard tick and waits for a human merge, after a release-age soak. Digests are left to safe-automerge, majors keep the tick. Extend after the default preset.',
    parts: ['parts/non-major.json'],
  },
  'automerge-non-major': {
    description:
      'Opt-in overlay for repositories whose CI is the gate: minor, patch, digest and pin updates skip the dashboard tick, share one branch and merge themselves once the pull request checks are green, after a release-age soak. Majors and Go toolchain minors keep the tick. Extend after the default preset and after golang when the repository has one.',
    parts: ['parts/non-major.json', 'parts/automerge.json'],
  },
  grouped: {
    description:
      'Opt-in overlay for repositories that want to group non-major dependency updates into fewer pull requests. Extend after the default preset.',
    parts: ['parts/grouped.json'],
  },
  'first-party': {
    description:
      'Opt-in overlay for Webgrip’s own packages: minor, patch, digest and pin updates of anything Webgrip publishes share one branch of their own that opens without a tick, skips the release-age soak and merges itself on green. Every profile includes it. Extend after the default preset and the non-major overlay.',
    parts: ['parts/first-party.json'],
  },
  'profile-app': { description: `Profile for a deployed service or product. ${appPolicy}`, parts: reviewed },
  'profile-site': { description: `Profile for a static site deployed from its releases. ${appPolicy}`, parts: reviewed },
  'profile-library': {
    description:
      'Profile for a package, preset, reusable workflow or action whose CI is the gate and whose consumers take each release through their own pull request. Non-major updates share one branch that merges itself on green after a soak; Webgrip’s own non-major updates merge themselves in a branch of their own without one; security fixes merge themselves; majors wait for a dashboard tick.',
    parts: unattended,
  },
  'profile-image-set': {
    description:
      'Profile for a repository of container images. Like profile-library, plus base and tool images pinned in Dockerfile ARG lines under a renovate directive.',
    parts: [...unattended, 'docker-arg-pins.json'],
  },
};

const schema = 'https://docs.renovatebot.com/renovate-schema.json';
const lastPart = 'parts/preset-bump.json';

function readPart(file) {
  const { $schema, description, ...config } = JSON.parse(readFileSync(file, 'utf8'));
  return config;
}

export function build(name) {
  const { description, parts } = generated[name];
  const merged = [...parts, lastPart].map(readPart).reduce((parent, child) => mergeChildConfig(parent, child), {});
  return `${JSON.stringify({ $schema: schema, description, ...merged }, null, 2)}\n`;
}

export function fileOf(name) {
  return `${name}.json`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const name of Object.keys(generated)) {
    const expected = build(name);
    if (check) {
      let actual = '';
      try {
        actual = readFileSync(fileOf(name), 'utf8');
      } catch {}
      if (actual !== expected) stale.push(fileOf(name));
    } else {
      writeFileSync(fileOf(name), expected);
    }
  }
  const { policyFile, render } = await import('./policy.mjs');
  const policy = await render();
  if (check) {
    let actual = '';
    try {
      actual = readFileSync(policyFile, 'utf8');
    } catch {}
    if (actual !== policy) stale.push(policyFile);
  } else {
    writeFileSync(policyFile, policy);
  }
  if (stale.length > 0) {
    console.error(`Out of date, run \`npm run generate\`: ${stale.join(', ')}`);
    process.exit(1);
  }
}
