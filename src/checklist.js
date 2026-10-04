export const CHECKLIST_ITEMS = [
  { id: 'metadata', label: '제목과 설명을 확인했어요' },
  { id: 'canonical', label: '캐노니컬 URL을 확인했어요' },
  { id: 'openGraph', label: 'Open Graph 제목·설명·이미지를 확인했어요' },
  { id: 'altText', label: '이미지 대체 텍스트를 확인했어요' },
  { id: 'sameOriginLinks', label: '동일 출처 링크를 확인했어요' },
  { id: 'responsive', label: '데스크톱·태블릿·모바일을 확인했어요' },
  { id: 'keyboard', label: '키보드 조작을 확인했어요' },
  { id: 'approval', label: '최종 승인을 받았어요' },
];

export function validateReleaseInput({ name, url }) {
  if (!name?.trim()) return { valid: false, message: '페이지 이름을 입력해 주세요.' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol');
  } catch {
    return { valid: false, message: 'http 또는 https로 시작하는 올바른 URL을 입력해 주세요.' };
  }
  return { valid: true };
}

export function createRelease({ name, url, id = crypto.randomUUID() }) {
  const validation = validateReleaseInput({ name, url });
  if (!validation.valid) throw new Error(validation.message);
  return {
    id,
    name: name.trim(),
    url: url.trim(),
    checks: CHECKLIST_ITEMS.map(({ id: checkId }) => ({ id: checkId, done: false })),
  };
}

export function getProgress(release) {
  const total = CHECKLIST_ITEMS.length;
  const completed = release.checks.filter((check) => check.done).length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

export function isReady(release) {
  return getProgress(release).completed === CHECKLIST_ITEMS.length;
}

export function filterReleases(releases, filter) {
  if (filter === 'pending') return releases.filter((release) => !isReady(release));
  if (filter === 'complete') return releases.filter(isReady);
  return releases;
}

export function toggleChecklistItem(release, checkId) {
  return {
    ...release,
    checks: release.checks.map((check) => check.id === checkId ? { ...check, done: !check.done } : check),
  };
}

export function deleteRelease(releases, releaseId) {
  return releases.filter((release) => release.id !== releaseId);
}

export function normalizeRelease(release) {
  const doneById = new Map((release?.checks || []).map((check) => [check.id, Boolean(check.done)]));
  return {
    id: String(release?.id || crypto.randomUUID()),
    name: String(release?.name || ''),
    url: String(release?.url || ''),
    checks: CHECKLIST_ITEMS.map((item) => ({ id: item.id, done: doneById.get(item.id) || false })),
  };
}
