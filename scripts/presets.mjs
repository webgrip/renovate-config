import { readFileSync, writeFileSync } from 'node:fs';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';

export const capabilities = ['apm.json', 'docker-arg-pins.json', 'golang.json'];
export const policyKeys = ['groupName', 'groupSlug', 'automerge', 'dependencyDashboardApproval', 'minimumReleaseAge', 'rebaseWhen'];

const strict = ['parts/base.json', 'parts/approval.json'];
const groups = ['parts/agent-package-group.json', 'parts/go-module-groups.json'];
const gated = gate => [...strict, 'apm.json', 'parts/agent-package-group.json', 'parts/non-major.json', gate, 'parts/go-module-groups.json', 'security-automerge.json', 'parts/first-party.json'];

const gates = {
  reviewed: {
    description:
      'Gate for a repository that ships what merges, such as a service, a product or a site: a person merges third-party minor, patch and pin updates, which arrive together in one pull request after a release-age soak. Digests, CI action updates, Webgrip’s own non-major updates and security fixes merge themselves on green in branches of their own; majors wait for a dashboard tick.',
    parts: gated('parts/digests-and-actions.json'),
  },
  unattended: {
    description:
      'Gate for a repository whose CI is a sufficient gate because its consumers take each release through their own pull request, such as a package, a preset, a reusable workflow, an action or a set of images: third-party minor, patch, digest and pin updates share one branch that merges itself on green after a release-age soak. Webgrip’s own non-major updates merge themselves in a branch of their own without one; security fixes merge themselves; majors and Go toolchain minors wait for a dashboard tick.',
    parts: gated('parts/automerge.json'),
  },
};

export const aliases = {
  'profile-app': { gate: 'reviewed', for: 'a deployed service or product' },
  'profile-site': { gate: 'reviewed', for: 'a static site deployed from its releases' },
  'profile-library': { gate: 'unattended', for: 'a package, preset, reusable workflow or action' },
  'profile-image-set': { gate: 'unattended', for: 'a repository of container images', capabilities: ['docker-arg-pins.json'], adds: ', plus base and tool images pinned in Dockerfile ARG lines under a renovate directive' },
};

function alias({ gate, for: what, capabilities: extra = [], adds = '' }) {
  return {
    description: `Profile for ${what}, kept as a name for the ${gate} gate${adds}. ${gates[gate].description}`,
    parts: [...gates[gate].parts, ...extra],
  };
}

export const generated = {
  default: {
    description:
      'Webgrip org default Renovate preset — strict, conservative defaults for all repositories. Every update waits for a dashboard tick and the tick is the only gate, so there is no release-age soak to double-gate it. Per-type semantic commits and labels, OSV vulnerability alerts, and Merge Confidence badges included. Schedule is \'at any time\' since 2026-09-18: with every update behind a tick, nothing opens unattended anyway, so a window only delayed work a human had already asked for, and Renovate does not persist an approval it cannot act on, so a tick made outside the window could be silently discarded. A repo that wants quiet hours can set its own schedule.',
    parts: [...strict, ...groups],
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
  ...gates,
  ...Object.fromEntries(Object.entries(aliases).map(([name, definition]) => [name, alias(definition)])),
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
