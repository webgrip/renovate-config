import { readFileSync, writeFileSync } from 'node:fs';
import { mergeChildConfig } from 'renovate/dist/config/utils.js';

export const profiles = {
  'profile-app': {
    description:
      'Profile for a deployed service or product. Minor, patch and pin updates arrive together in one pull request a person merges; digest and CI action updates and security fixes merge themselves on green; majors wait for a dashboard tick.',
    parts: ['default.json', 'apm.json', 'review-non-major.json', 'safe-automerge.json', 'security-automerge.json'],
  },
  'profile-site': {
    description:
      'Profile for a static site deployed from its releases. Same policy as profile-app: one reviewed pull request for minor, patch and pin updates, automerge for digests, CI actions and security fixes, majors behind a dashboard tick.',
    parts: ['default.json', 'apm.json', 'review-non-major.json', 'safe-automerge.json', 'security-automerge.json'],
  },
  'profile-library': {
    description:
      'Profile for a package, preset, reusable workflow or action whose CI is the gate and whose consumers take each release through their own pull request. Non-major updates share one branch that merges itself on green after a soak; security fixes merge themselves; majors wait for a dashboard tick.',
    parts: ['default.json', 'apm.json', 'automerge-non-major.json', 'security-automerge.json'],
  },
  'profile-image-set': {
    description:
      'Profile for a repository of container images. Like profile-library, plus base and tool images pinned in Dockerfile ARG lines under a renovate directive.',
    parts: ['default.json', 'apm.json', 'automerge-non-major.json', 'security-automerge.json', 'docker-arg-pins.json'],
  },
};

const schema = 'https://docs.renovatebot.com/renovate-schema.json';

function readPart(file) {
  const { $schema, description, ...config } = JSON.parse(readFileSync(file, 'utf8'));
  return config;
}

export function build(name) {
  const { description, parts } = profiles[name];
  const merged = parts.map(readPart).reduce((parent, child) => mergeChildConfig(parent, child), {});
  return `${JSON.stringify({ $schema: schema, description, ...merged }, null, 2)}\n`;
}

export function fileOf(name) {
  return `${name}.json`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const name of Object.keys(profiles)) {
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
  if (stale.length > 0) {
    console.error(`Out of date, run \`npm run profiles\`: ${stale.join(', ')}`);
    process.exit(1);
  }
}
