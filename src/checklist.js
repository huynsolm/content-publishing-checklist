export const BACKUP_VERSION = 1;

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

function isDateString(value) {
  if (value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function hasExactKeys(value, keys) {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function hasValidChecks(checks) {
  return Array.isArray(checks)
    && checks.length === CHECKLIST_ITEMS.length
    && checks.every((check, index) => check && typeof check === 'object'
      && hasExactKeys(check, ['id', 'done'])
      && check.id === CHECKLIST_ITEMS[index].id && typeof check.done === 'boolean');
}

function isValidBackupRelease(release) {
  return release && typeof release === 'object'
    && hasExactKeys(release, ['id', 'name', 'url', 'deadline', 'owner', 'notes', 'checks'])
    && typeof release.id === 'string' && release.id.trim()
    && typeof release.name === 'string' && release.name.trim()
    && typeof release.url === 'string' && validateReleaseInput(release).valid
    && isDateString(release.deadline)
    && typeof release.owner === 'string'
    && typeof release.notes === 'string'
    && hasValidChecks(release.checks);
}

export function createBackup(releases) {
  return { version: BACKUP_VERSION, releases };
}

export function parseBackup(json) {
  let backup;
  try {
    backup = JSON.parse(json);
  } catch {
    return { valid: false, message: '백업 파일의 JSON 형식이 올바르지 않습니다.' };
  }
  if (!backup || typeof backup !== 'object' || !hasExactKeys(backup, ['version', 'releases']) || backup.version !== BACKUP_VERSION) {
    return { valid: false, message: '지원하지 않는 백업 버전입니다.' };
  }
  if (!Array.isArray(backup.releases) || !backup.releases.every(isValidBackupRelease)) {
    return { valid: false, message: '백업 파일의 발행 항목 형식이 올바르지 않습니다.' };
  }
  return { valid: true, releases: backup.releases };
}

export function validateReleaseInput({ name, url, deadline = '' }) {
  if (!name?.trim()) return { valid: false, message: '페이지 이름을 입력해 주세요.' };
  if (!isDateString(deadline)) return { valid: false, message: '올바른 발행 마감일을 입력해 주세요.' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol');
  } catch {
    return { valid: false, message: 'http 또는 https로 시작하는 올바른 URL을 입력해 주세요.' };
  }
  return { valid: true };
}

export function createRelease({ name, url, deadline, owner, notes, id = crypto.randomUUID() }) {
  const validation = validateReleaseInput({ name, url, deadline });
  if (!validation.valid) throw new Error(validation.message);
  return {
    id,
    name: name.trim(),
    url: url.trim(),
    deadline: deadline?.trim() || '',
    owner: owner?.trim() || '',
    notes: notes?.trim() || '',
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

export function sortReleasesByDeadline(releases) {
  return [...releases].sort((first, second) => {
    if (!first.deadline) return second.deadline ? 1 : 0;
    if (!second.deadline) return -1;
    return first.deadline.localeCompare(second.deadline);
  });
}

function todayAsDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function getDeadlineStatus(deadline, today = todayAsDateString()) {
  if (!deadline) return null;
  const toUtc = (value) => Date.UTC(...value.split('-').map((part, index) => index === 1 ? Number(part) - 1 : Number(part)));
  const daysUntil = Math.round((toUtc(deadline) - toUtc(today)) / 86_400_000);
  if (daysUntil < 0) return { kind: 'overdue', label: '마감 지남' };
  if (daysUntil === 0) return { kind: 'today', label: '오늘 마감' };
  if (daysUntil <= 6) return { kind: 'upcoming', label: '6일 이내 마감' };
  return null;
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
    deadline: isDateString(release?.deadline) ? release.deadline : '',
    owner: String(release?.owner || ''),
    notes: String(release?.notes || ''),
    checks: CHECKLIST_ITEMS.map((item) => ({ id: item.id, done: doneById.get(item.id) || false })),
  };
}
