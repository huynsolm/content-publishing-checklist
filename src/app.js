import {
  CHECKLIST_ITEMS,
  createRelease,
  deleteRelease,
  filterReleases,
  getProgress,
  isReady,
  normalizeRelease,
  toggleChecklistItem,
  validateReleaseInput,
} from './checklist.js';

const STORAGE_KEY = 'content-publishing-checklist.releases.v1';
const form = document.querySelector('#release-form');
const error = document.querySelector('#form-error');
const list = document.querySelector('#release-list');
const emptyState = document.querySelector('#empty-state');
const filters = document.querySelector('.filters');
let activeFilter = 'all';
let releases = loadReleases();

function loadReleases() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeRelease) : [];
  } catch {
    return [];
  }
}

function saveReleases() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
}

function render() {
  const visibleReleases = filterReleases(releases, activeFilter);
  list.replaceChildren();
  if (!visibleReleases.length) {
    list.append(emptyState.content.cloneNode(true));
    return;
  }
  visibleReleases.forEach((release) => list.append(createReleaseCard(release)));
}

function createReleaseCard(release) {
  const progress = getProgress(release);
  const ready = isReady(release);
  const card = document.createElement('article');
  card.className = 'release-card';
  card.dataset.id = release.id;
  card.innerHTML = `
    <div class="card-topline"><span class="status ${ready ? 'status-ready' : 'status-pending'}">${ready ? '발행 가능' : '준비 중'}</span><button class="delete" type="button" aria-label="${escapeHtml(release.name)} 삭제">삭제</button></div>
    <h3>${escapeHtml(release.name)}</h3>
    <a class="release-url" href="${escapeAttribute(release.url)}" target="_blank" rel="noreferrer">${escapeHtml(release.url)} <span aria-hidden="true">↗</span></a>
    <div class="progress-line"><span>${progress.completed}/${progress.total} 완료</span><strong>${progress.percentage}%</strong></div>
    <progress value="${progress.completed}" max="${progress.total}">${progress.percentage}%</progress>
    <ul class="check-list"></ul>`;
  const checkList = card.querySelector('.check-list');
  CHECKLIST_ITEMS.forEach((item) => {
    const check = release.checks.find((entry) => entry.id === item.id);
    const row = document.createElement('li');
    row.innerHTML = `<label><input type="checkbox" data-check-id="${item.id}" ${check?.done ? 'checked' : ''}><span>${item.label}</span></label>`;
    checkList.append(row);
  });
  return card;
}

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  const validation = validateReleaseInput(values);
  if (!validation.valid) {
    error.textContent = validation.message;
    error.hidden = false;
    return;
  }
  releases = [createRelease(values), ...releases];
  saveReleases();
  form.reset();
  error.hidden = true;
  render();
});

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  filters.querySelectorAll('.filter').forEach((filter) => {
    const selected = filter === button;
    filter.classList.toggle('is-active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  render();
});

list.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-check-id]');
  if (!checkbox) return;
  const card = checkbox.closest('.release-card');
  releases = releases.map((release) => release.id === card.dataset.id ? toggleChecklistItem(release, checkbox.dataset.checkId) : release);
  saveReleases();
  render();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('.delete');
  if (!button) return;
  const card = button.closest('.release-card');
  const release = releases.find((item) => item.id === card.dataset.id);
  if (release && window.confirm(`“${release.name}” 체크리스트를 삭제할까요?`)) {
    releases = deleteRelease(releases, release.id);
    saveReleases();
    render();
  }
});

render();
