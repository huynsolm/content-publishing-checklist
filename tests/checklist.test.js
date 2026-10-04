import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKLIST_ITEMS,
  createRelease,
  getProgress,
  isReady,
  filterReleases,
  toggleChecklistItem,
  deleteRelease,
  validateReleaseInput,
  createBackup,
  parseBackup,
  sortReleasesByDeadline,
  getDeadlineStatus,
} from '../src/checklist.js';

test('defines the eight required publishing checks in a stable order', () => {
  assert.deepEqual(CHECKLIST_ITEMS.map((item) => item.id), [
    'metadata', 'canonical', 'openGraph', 'altText',
    'sameOriginLinks', 'responsive', 'keyboard', 'approval',
  ]);
});

test('creates a release with required fields and every check pending', () => {
  const release = createRelease({ name: '홈', url: 'https://publisher.example/home', id: 'release-1' });
  assert.equal(release.name, '홈');
  assert.equal(release.url, 'https://publisher.example/home');
  assert.equal(release.checks.length, 8);
  assert.ok(release.checks.every((check) => check.done === false));
});

test('rejects blank names and non-http URLs', () => {
  assert.equal(validateReleaseInput({ name: '', url: 'https://publisher.example' }).valid, false);
  assert.equal(validateReleaseInput({ name: '소개', url: '/about' }).valid, false);
  assert.equal(validateReleaseInput({ name: '소개', url: 'mailto:team@example.com' }).valid, false);
  assert.equal(validateReleaseInput({ name: '소개', url: 'https://publisher.example', deadline: '2026-02-30' }).valid, false);
  assert.throws(() => createRelease({ name: '소개', url: 'https://publisher.example', deadline: '2026-02-30' }), /발행 마감일/);
});

test('calculates progress and only calls a fully checked release ready', () => {
  const release = createRelease({ name: '소개', url: 'https://publisher.example/about', id: 'release-2' });
  const partial = toggleChecklistItem(release, 'metadata');
  assert.deepEqual(getProgress(partial), { completed: 1, total: 8, percentage: 13 });
  assert.equal(isReady(partial), false);
  const complete = partial.checks.reduce((item, check) => check.done ? item : toggleChecklistItem(item, check.id), partial);
  assert.deepEqual(getProgress(complete), { completed: 8, total: 8, percentage: 100 });
  assert.equal(isReady(complete), true);
});

test('filters releases by ready and pending status', () => {
  const pending = createRelease({ name: '뉴스', url: 'https://publisher.example/news', id: 'pending' });
  const ready = pending.checks.reduce((item, check) => toggleChecklistItem(item, check.id), { ...pending, id: 'ready' });
  assert.deepEqual(filterReleases([pending, ready], 'pending').map((item) => item.id), ['pending']);
  assert.deepEqual(filterReleases([pending, ready], 'complete').map((item) => item.id), ['ready']);
  assert.equal(filterReleases([pending, ready], 'all').length, 2);
});

test('toggles a check immutably and deletes only the selected release', () => {
  const first = createRelease({ name: 'A', url: 'https://publisher.example/a', id: 'a' });
  const second = createRelease({ name: 'B', url: 'https://publisher.example/b', id: 'b' });
  const updated = toggleChecklistItem(first, 'keyboard');
  assert.equal(first.checks.find((check) => check.id === 'keyboard').done, false);
  assert.equal(updated.checks.find((check) => check.id === 'keyboard').done, true);
  assert.deepEqual(deleteRelease([updated, second], 'a').map((item) => item.id), ['b']);
});

test('creates a release with a valid deadline, owner, and notes', () => {
  const release = createRelease({
    name: '봄 캠페인',
    url: 'https://publisher.example/spring',
    deadline: '2026-10-10',
    owner: '민지',
    notes: '승인 전 문구를 다시 확인',
    id: 'spring',
  });
  assert.deepEqual(
    { deadline: release.deadline, owner: release.owner, notes: release.notes },
    { deadline: '2026-10-10', owner: '민지', notes: '승인 전 문구를 다시 확인' },
  );
});

test('round-trips releases through a versioned JSON backup', () => {
  const releases = [createRelease({ name: '홈', url: 'https://publisher.example', id: 'home', owner: '지수' })];
  const restored = parseBackup(JSON.stringify(createBackup(releases)));
  assert.equal(restored.valid, true);
  assert.deepEqual(restored.releases, releases);
});

test('rejects malformed backup schemas with a Korean error', () => {
  const malformed = JSON.stringify({ version: 1, releases: [{ id: 'bad', name: '잘못된 항목' }] });
  const result = parseBackup(malformed);
  assert.deepEqual(result, { valid: false, message: '백업 파일의 발행 항목 형식이 올바르지 않습니다.' });
  const unexpected = createBackup([createRelease({ name: '홈', url: 'https://publisher.example', id: 'home' })]);
  unexpected.releases[0].unexpected = true;
  assert.equal(parseBackup(JSON.stringify(unexpected)).valid, false);
});

test('sorts dated releases before undated releases and labels deadline urgency', () => {
  const releases = [
    createRelease({ name: '미정', url: 'https://publisher.example/later', id: 'none' }),
    createRelease({ name: '내일', url: 'https://publisher.example/soon', id: 'soon', deadline: '2026-10-05' }),
    createRelease({ name: '오늘', url: 'https://publisher.example/today', id: 'today', deadline: '2026-10-04' }),
    createRelease({ name: '마감', url: 'https://publisher.example/late', id: 'late', deadline: '2026-10-03' }),
  ];
  assert.deepEqual(sortReleasesByDeadline(releases).map((release) => release.id), ['late', 'today', 'soon', 'none']);
  assert.deepEqual(getDeadlineStatus('2026-10-03', '2026-10-04'), { kind: 'overdue', label: '마감 지남' });
  assert.deepEqual(getDeadlineStatus('2026-10-04', '2026-10-04'), { kind: 'today', label: '오늘 마감' });
  assert.deepEqual(getDeadlineStatus('2026-10-10', '2026-10-04'), { kind: 'upcoming', label: '6일 이내 마감' });
});
