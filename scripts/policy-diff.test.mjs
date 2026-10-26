import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffTables, formatComment, marker, upsertComment } from './policy-diff.mjs';

const table = (presets, updates) =>
  [
    '# Policy table',
    '',
    'Prose above the table.',
    '',
    `| Update | ${presets.join(' | ')} |`,
    `| --- | ${presets.map(() => '---').join(' | ')} |`,
    ...Object.entries(updates).map(([update, cells]) => `| ${update} | ${cells.join(' | ')} |`),
    '',
  ].join('\n');

const presets = ['`profile-app`', '`default`'];
const baseline = table(presets, {
  'npm major': ['own branch: tick, then a person merges · `feat(deps)`', 'own branch: tick, then a person merges · `feat(deps)`'],
  'npm minor': ['`all non-major dependencies`: a person merges · `fix(deps)`', 'own branch: tick, then a person merges · `fix(deps)`'],
});
const commits = { base: 'aaaaaaaa11111111', head: 'bbbbbbbb22222222' };

test('unchanged tables report no change', () => {
  assert.deepEqual(diffTables(baseline, baseline), []);
  const comment = formatComment([], commits);
  assert.ok(comment.startsWith(marker));
  assert.match(comment, /No behaviour change/);
  assert.doesNotMatch(comment, /\| Update \|/);
});

test('one changed cell yields exactly that row and preset', () => {
  const changed = table(presets, {
    'npm major': ['own branch: tick, then a person merges · `feat(deps)`', 'own branch: tick, then a person merges · `feat(deps)`'],
    'npm minor': ['`all non-major dependencies`: merges itself · `fix(deps)`', 'own branch: tick, then a person merges · `fix(deps)`'],
  });
  const changes = diffTables(baseline, changed);
  assert.deepEqual(changes, [
    { update: 'npm minor', preset: '`profile-app`', before: '`all non-major dependencies`: a person merges · `fix(deps)`', after: '`all non-major dependencies`: merges itself · `fix(deps)`' },
  ]);
  const rows = formatComment(changes, commits).split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| ---'));
  assert.deepEqual(rows, [
    '| Update | `profile-app` |',
    '| npm minor | `all non-major dependencies`: a person merges · `fix(deps)` → `all non-major dependencies`: merges itself · `fix(deps)` |',
  ]);
});

test('an added row and a removed row show as absent on the other side', () => {
  const changed = table(presets, {
    'npm major': ['own branch: tick, then a person merges · `feat(deps)`', 'own branch: tick, then a person merges · `feat(deps)`'],
    'npm patch': ['ignored', 'ignored'],
  });
  const changes = diffTables(baseline, changed);
  assert.deepEqual(
    changes.map(({ update, preset, before, after }) => [update, preset, before === null, after === null]),
    [
      ['npm patch', '`profile-app`', true, false],
      ['npm patch', '`default`', true, false],
      ['npm minor', '`profile-app`', false, true],
      ['npm minor', '`default`', false, true],
    ],
  );
  assert.match(formatComment(changes, commits), /\| npm patch \| _absent_ → ignored \| _absent_ → ignored \|/);
});

test('an added column and a removed column show as absent on the other side', () => {
  const changed = table(['`profile-app`', '`profile-library`'], {
    'npm major': ['own branch: tick, then a person merges · `feat(deps)`', 'own branch: tick, then a person merges · `feat(deps)`'],
    'npm minor': ['`all non-major dependencies`: a person merges · `fix(deps)`', 'ignored'],
  });
  const changes = diffTables(baseline, changed);
  assert.deepEqual(
    changes.map(({ update, preset, before, after }) => [update, preset, before, after]),
    [
      ['npm major', '`profile-library`', null, 'own branch: tick, then a person merges · `feat(deps)`'],
      ['npm major', '`default`', 'own branch: tick, then a person merges · `feat(deps)`', null],
      ['npm minor', '`profile-library`', null, 'ignored'],
      ['npm minor', '`default`', 'own branch: tick, then a person merges · `fix(deps)`', null],
    ],
  );
  const header = formatComment(changes, commits).split('\n').find(line => line.startsWith('| Update'));
  assert.equal(header, '| Update | `profile-library` | `default` |');
});

const reply = (status, payload) => ({ ok: status < 400, status, json: async () => payload });

function recorder(existing) {
  const calls = [];
  const fetch = async (url, { method, body }) => {
    calls.push({ method, url, body: body && JSON.parse(body) });
    if (method === 'GET') return reply(200, existing);
    return reply(method === 'POST' ? 201 : 200, { id: 7, html_url: 'https://forge/pr#7' });
  };
  return { calls, fetch };
}

const target = { api: 'https://forge/api/v1/repos/o/r', token: 't', issue: '9', body: `${marker}\nnew` };

test('the first run creates the comment', async () => {
  const { calls, fetch } = recorder([{ id: 3, body: 'a person said something' }]);
  const { action } = await upsertComment({ ...target, fetch });
  assert.equal(action, 'created');
  assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ['GET https://forge/api/v1/repos/o/r/issues/9/comments', 'POST https://forge/api/v1/repos/o/r/issues/9/comments']);
  assert.equal(calls[1].body.body, target.body);
});

test('a later run edits the comment that carries the marker', async () => {
  const { calls, fetch } = recorder([{ id: 3, body: 'a person said something' }, { id: 5, body: `${marker}\nold` }]);
  const { action } = await upsertComment({ ...target, fetch });
  assert.equal(action, 'edited');
  assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ['GET https://forge/api/v1/repos/o/r/issues/9/comments', 'PATCH https://forge/api/v1/repos/o/r/issues/comments/5']);
});

test('an API refusal surfaces as an error the caller can log', async () => {
  const fetch = async () => reply(403, {});
  await assert.rejects(upsertComment({ ...target, fetch }), /HTTP 403/);
});
