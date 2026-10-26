import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const marker = '<!-- webgrip:policy-diff -->';

const absent = '_absent_';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function cellsOf(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
}

export function parseTable(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex(line => line.startsWith('| Update |'));
  if (start === -1) return { presets: [], updates: new Map() };
  const presets = cellsOf(lines[start]).slice(1);
  const updates = new Map();
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const [update, ...cells] = cellsOf(line);
    updates.set(update, new Map(presets.map((preset, column) => [preset, cells[column]])));
  }
  return { presets, updates };
}

const union = (after, before) => [...after, ...before.filter(item => !after.includes(item))];

export function diffTables(beforeMarkdown, afterMarkdown) {
  const before = parseTable(beforeMarkdown);
  const after = parseTable(afterMarkdown);
  const presets = union(after.presets, before.presets);
  const updates = union([...after.updates.keys()], [...before.updates.keys()]);
  const changes = [];
  for (const update of updates) {
    for (const preset of presets) {
      const was = before.updates.get(update)?.get(preset) ?? null;
      const is = after.updates.get(update)?.get(preset) ?? null;
      if (was !== is) changes.push({ update, preset, before: was, after: is });
    }
  }
  return changes;
}

const shown = value => value ?? absent;

export function formatComment(changes, { base, head }) {
  const heading = `${marker}\n### Policy diff\n\n`;
  const range = `\`${base.slice(0, 8)}\` → \`${head.slice(0, 8)}\``;
  if (changes.length === 0) return `${heading}No behaviour change: \`docs/policy.md\` renders the same for ${range}.\n`;
  const presets = [...new Set(changes.map(change => change.preset))];
  const updates = [...new Set(changes.map(change => change.update))];
  const cell = (update, preset) => {
    const change = changes.find(candidate => candidate.update === update && candidate.preset === preset);
    return change ? `${shown(change.before)} → ${shown(change.after)}` : '';
  };
  const cellCount = changes.length === 1 ? '1 cell changes' : `${changes.length} cells change`;
  return [
    `${heading}${cellCount} in \`docs/policy.md\` for ${range}; unchanged rows and presets are left out, and a blank cell did not change.`,
    '',
    `| Update | ${presets.join(' | ')} |`,
    `| --- | ${presets.map(() => '---').join(' | ')} |`,
    ...updates.map(update => `| ${update} | ${presets.map(preset => cell(update, preset)).join(' | ')} |`),
    '',
  ].join('\n');
}

export async function upsertComment({ api, token, issue, body, fetch: request = fetch }) {
  const headers = { authorization: `token ${token}`, 'content-type': 'application/json', accept: 'application/json' };
  const call = async (method, url, payload) => {
    const response = await request(url, { method, headers, body: payload && JSON.stringify(payload) });
    if (!response.ok) throw new Error(`${method} ${url}: HTTP ${response.status}`);
    return response.json();
  };
  const comments = await call('GET', `${api}/issues/${issue}/comments`);
  const existing = comments.find(comment => comment.body?.startsWith(marker));
  if (existing) return { action: 'edited', comment: await call('PATCH', `${api}/issues/comments/${existing.id}`, { body }) };
  return { action: 'created', comment: await call('POST', `${api}/issues/${issue}/comments`, { body }) };
}

function extract(ref) {
  const tree = mkdtempSync(join(tmpdir(), 'policy-diff-'));
  execFileSync('sh', ['-c', 'git archive "$1" | tar -x -C "$2"', 'sh', ref, tree], { cwd: repoRoot, stdio: ['ignore', 'ignore', 'inherit'] });
  symlinkSync(join(repoRoot, 'node_modules'), join(tree, 'node_modules'), 'dir');
  return tree;
}

function render(tree) {
  const own = join(tree, 'scripts', 'policy.mjs');
  const script = existsSync(own) ? own : join(repoRoot, 'scripts', 'policy.mjs');
  const program = 'const { render } = await import(process.argv[1]); process.stdout.write(await render());';
  return execFileSync(process.execPath, ['--input-type=module', '-e', program, pathToFileURL(script).href], { cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function renderRef(ref) {
  const tree = extract(ref);
  try {
    return render(tree);
  } finally {
    rmSync(tree, { recursive: true, force: true });
  }
}

const commitOf = ref => execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd: repoRoot, encoding: 'utf8' }).trim();

async function main([baseRef, headRef = 'HEAD']) {
  if (!baseRef) {
    console.error('Usage: node scripts/policy-diff.mjs <base-ref> [<head-ref>]');
    process.exit(2);
  }
  const base = commitOf(baseRef);
  const head = commitOf(headRef);
  const body = formatComment(diffTables(renderRef(base), renderRef(head)), { base, head });
  console.log(body);
  const { POLICY_DIFF_TOKEN: token, PR_NUMBER: issue, GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repository } = process.env;
  if (!issue) return;
  if (!token) {
    console.log('::warning::No POLICY_DIFF_TOKEN in this job, so the diff stays in this log instead of a pull request comment.');
    return;
  }
  try {
    const { action, comment } = await upsertComment({ api: `${server}/api/v1/repos/${repository}`, token, issue, body });
    console.log(`Policy diff comment ${action}: ${comment.html_url ?? comment.id}`);
  } catch (error) {
    console.log(`::warning::Could not post the policy diff comment, so it stays in this log: ${error.message}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
