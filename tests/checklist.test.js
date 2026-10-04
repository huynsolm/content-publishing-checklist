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
