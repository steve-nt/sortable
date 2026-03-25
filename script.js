// script.js

import {
  getState,
  updateState,
  toggleSort,
  onStateChange,
} from './src/core/state.js';

import { fetchHeroes } from './src/core/api.js';
import { sortHeroes } from './src/core/sorting.js';
import { filterHeroes, getPaginatedData } from './src/core/filtering.js';

import {
  renderTable,
  updatePaginationUI,
  updateSortIndicators,
  showHeroModal,
  closeHeroModal,
} from './src/ui/render.js';

/**
 * @typedef {Object} UIRefs
 * @property {HTMLInputElement|null} searchInput
 * @property {HTMLSelectElement|null} searchFieldSelect
 * @property {HTMLSelectElement|null} searchOperatorSelect
 * @property {HTMLButtonElement|null} resetBtn
 * @property {HTMLSelectElement|null} pageSizeSelect
 * @property {HTMLTableElement|null} heroesTable
 * @property {HTMLElement|null} tableBody
 * @property {HTMLButtonElement|null} prevBtn
 * @property {HTMLButtonElement|null} nextBtn
 * @property {HTMLElement|null} pageInfo
 * @property {HTMLElement|null} maxPageInfo
 * @property {HTMLElement|null} heroModal
 * @property {HTMLElement|null} modalBackdrop
 * @property {HTMLElement|null} modalCloseBtn
 */

/** @type {UIRefs} */
const ui = {
  searchInput: document.getElementById('searchInput'),
  searchFieldSelect: document.getElementById('searchFieldSelect'),
  searchOperatorSelect: document.getElementById('searchOperatorSelect'),
  resetBtn: document.getElementById('resetBtn'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
  heroesTable: document.getElementById('heroesTable'),
  tableBody: document.getElementById('tableBody'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  pageInfo: document.getElementById('pageInfo'),
  maxPageInfo: document.getElementById('maxPageInfo'),
  heroModal: document.getElementById('heroModal'),
  modalBackdrop: document.querySelector('.modal-backdrop'),
  modalCloseBtn: document.querySelector('.modal-close'),
};

/**
 * Default controls and URL-neutral app state.
 */
const DEFAULT_VIEW_STATE = {
  searchStr: '',
  searchField: 'name',
  searchOperator: 'include',
  page: 1,
  pageSize: '20',
  sort: { key: 'name', order: 'asc' },
  activeHeroId: null,
};

const NUMERIC_SEARCH_FIELDS = new Set(['height', 'weight']);
const TEXT_OPERATORS = ['include', 'exclude', 'fuzzy'];
const NUMERIC_OPERATORS = [
  'include',
  'exclude',
  'fuzzy',
  'equal',
  'not equal',
  'greater than',
  'less than',
];

const OPERATOR_LABELS = {
  include: 'Include',
  exclude: 'Exclude',
  fuzzy: 'Fuzzy',
  equal: 'Equal',
  'not equal': 'Not Equal',
  'greater than': 'Greater Than',
  'less than': 'Lesser Than',
};

const OPERATOR_ALIAS_MAP = {
  '=': 'equal',
  '==': 'equal',
  '!=': 'not equal',
  '<>': 'not equal',
  '>': 'greater than',
  '<': 'less than',
  'lesser than': 'less than',
};

/**
 * Debounces an input callback to avoid expensive per-keystroke rerenders.
 * @param {(...args: any[]) => void} fn - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {(...args: any[]) => void}
 */
const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Reads state from query params.
 * @returns {Partial<import('./src/core/state.js').AppState>|Object}
 */
const readURLState = () => {
  const params = new URLSearchParams(window.location.search);

  const searchStr = params.get('search') ?? DEFAULT_VIEW_STATE.searchStr;
  const searchField = params.get('field') ?? DEFAULT_VIEW_STATE.searchField;
  const rawOperator = params.get('operator') ?? DEFAULT_VIEW_STATE.searchOperator;
  const searchOperator =
    OPERATOR_ALIAS_MAP[rawOperator] ?? rawOperator.toLowerCase();
  const page = Number(params.get('page')) || DEFAULT_VIEW_STATE.page;
  const pageSize = params.get('pageSize') ?? DEFAULT_VIEW_STATE.pageSize;
  const activeHeroId = Number(params.get('hero')) || null;

  const sortParam = params.get('sort');
  let sort = { ...DEFAULT_VIEW_STATE.sort };

  if (sortParam) {
    const [key, order] = sortParam.split('-');
    if (key && order) {
      sort = { key, order };
    }
  }

  return {
    searchStr,
    searchField,
    searchOperator,
    page,
    pageSize,
    sort,
    activeHeroId,
  };
};

/**
 * Serializes the current state into query params.
 * @param {ReturnType<typeof getState>} state - Current app state.
 * @returns {void}
 */
const updateURL = (state) => {
  const params = new URLSearchParams();

  if (state.searchStr) params.set('search', state.searchStr);
  if (state.searchField !== DEFAULT_VIEW_STATE.searchField) {
    params.set('field', state.searchField);
  }
  if (state.searchOperator !== DEFAULT_VIEW_STATE.searchOperator) {
    params.set('operator', state.searchOperator);
  }
  if (state.page > 1) params.set('page', String(state.page));

  if (
    state.sort?.key !== DEFAULT_VIEW_STATE.sort.key ||
    state.sort?.order !== DEFAULT_VIEW_STATE.sort.order
  ) {
    params.set('sort', `${state.sort.key}-${state.sort.order}`);
  }

  if (state.pageSize !== DEFAULT_VIEW_STATE.pageSize) {
    params.set('pageSize', state.pageSize);
  }

  if (state.activeHeroId) {
    params.set('hero', String(state.activeHeroId));
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  history.replaceState(null, '', nextUrl);
};

/**
 * Calculates total number of pages for a page size.
 * @param {Object[]} data - Filtered/sorted dataset.
 * @param {string} pageSize - Page size token.
 * @returns {number}
 */
function getTotalPages(data, pageSize) {
  if (pageSize === 'all') return 1;
  const size = parseInt(pageSize, 10) || 20;
  return Math.ceil(data.length / size) || 1;
}

/**
 * Returns operator list allowed for current search field.
 * @param {string} field - Selected search field.
 * @returns {string[]}
 */
function getAllowedOperators(field) {
  return NUMERIC_SEARCH_FIELDS.has(field) ? NUMERIC_OPERATORS : TEXT_OPERATORS;
}

/**
 * Rebuilds the operator select options for the selected field.
 * @param {string} field - Current search field.
 * @param {string} preferred - Preferred selected operator.
 * @returns {string}
 */
function refreshSearchOperatorOptions(field, preferred) {
  if (!ui.searchOperatorSelect) return preferred;

  const allowed = getAllowedOperators(field);
  const resolved = allowed.includes(preferred)
    ? preferred
    : DEFAULT_VIEW_STATE.searchOperator;

  ui.searchOperatorSelect.replaceChildren();

  for (const operator of allowed) {
    const option = document.createElement('option');
    option.value = operator;
    option.textContent = OPERATOR_LABELS[operator];
    if (operator === resolved) {
      option.selected = true;
    }
    ui.searchOperatorSelect.appendChild(option);
  }

  return resolved;
}

/**
 * Builds parser-compatible search query from selected controls.
 * @param {ReturnType<typeof getState>} state - Current state.
 * @returns {string}
 */
function buildSearchQuery(state) {
  const rawSearch = state.searchStr.trim();
  if (!rawSearch) return '';

  const operatorTokenMap = {
    'not equal': '!=',
    'greater than': '>',
    'less than': '<',
    equal: '=',
  };
  const normalizedOperator =
    operatorTokenMap[state.searchOperator] ?? state.searchOperator;

  if (
    state.searchField === DEFAULT_VIEW_STATE.searchField &&
    state.searchOperator === DEFAULT_VIEW_STATE.searchOperator
  ) {
    return rawSearch;
  }

  return `${state.searchField}:${normalizedOperator}:${rawSearch}`;
}

/**
 * Processes heroes by applying filter then sorting.
 * @param {ReturnType<typeof getState>} state - Current state.
 * @returns {Object[]}
 */
function getProcessedData(state) {
  let data = state.heroes;
  const searchQuery = buildSearchQuery(state);

  if (searchQuery) {
    data = filterHeroes(data, searchQuery, state.searchField);
  }

  return sortHeroes(data, state.sort.key, state.sort.order);
}

/**
 * Keeps form controls in sync with current state.
 * @param {ReturnType<typeof getState>} state - Current state.
 * @returns {void}
 */
function syncControls(state) {
  if (ui.searchInput && ui.searchInput.value !== state.searchStr) {
    ui.searchInput.value = state.searchStr;
  }
  if (ui.searchFieldSelect && ui.searchFieldSelect.value !== state.searchField) {
    ui.searchFieldSelect.value = state.searchField;
  }

  const validOperator = refreshSearchOperatorOptions(
    state.searchField,
    state.searchOperator
  );
  if (validOperator !== state.searchOperator) {
    updateState({ searchOperator: validOperator });
    return;
  }

  if (ui.pageSizeSelect && ui.pageSizeSelect.value !== state.pageSize) {
    ui.pageSizeSelect.value = state.pageSize;
  }
}

/**
 * Main render pipeline triggered by state updates.
 * @returns {void}
 */
function renderPage() {
  const state = getState();

  syncControls(state);

  const data = getProcessedData(state);
  const paginated = getPaginatedData(data, state.page, state.pageSize);
  const totalPages = getTotalPages(data, state.pageSize);

  renderTable(ui.tableBody, paginated, (hero) => {
    updateState({ activeHeroId: hero.id });
    showHeroModal(ui.heroModal, hero);
  });

  updatePaginationUI(ui, state.page, totalPages);
  updateSortIndicators(ui.heroesTable, state.sort);

  if (!state.activeHeroId && ui.heroModal && !ui.heroModal.hidden) {
    closeHeroModal(ui.heroModal);
  }

  updateURL(state);
}

/**
 * Auto render
 */
onStateChange(renderPage);

/**
 * Search
 */
ui.searchInput?.addEventListener(
  'input',
  debounce((e) => {
    updateState({
      searchStr: e.target.value,
      page: 1,
    });
  }, 300)
);

ui.searchFieldSelect?.addEventListener('change', (e) => {
  const nextField = e.target.value;
  const nextOperator = refreshSearchOperatorOptions(
    nextField,
    getState().searchOperator
  );

  updateState({
    searchField: nextField,
    searchOperator: nextOperator,
    page: 1,
  });
});

ui.searchOperatorSelect?.addEventListener('change', (e) => {
  updateState({
    searchOperator: OPERATOR_ALIAS_MAP[e.target.value] ?? e.target.value,
    page: 1,
  });
});

ui.resetBtn?.addEventListener('click', () => {
  updateState({ ...DEFAULT_VIEW_STATE });
});

/**
 * Page size
 */
ui.pageSizeSelect?.addEventListener('change', (e) => {
  updateState({
    pageSize: e.target.value,
    page: 1,
  });
});

/**
 * Pagination
 */
ui.prevBtn?.addEventListener('click', () => {
  const { page } = getState();
  if (page > 1) updateState({ page: page - 1 });
});

ui.nextBtn?.addEventListener('click', () => {
  const state = getState();
  const data = getProcessedData(state);
  const totalPages = getTotalPages(data, state.pageSize);

  updateState({
    page: state.page >= totalPages ? 1 : state.page + 1,
  });
});

/**
 * Sorting
 */
document.querySelector('#heroesTable')?.addEventListener('click', (e) => {
  const th = e.target.closest('th[data-field]');
  if (!th) return;

  toggleSort(th.dataset.field);
});

/**
 * Modal
 */
ui.modalCloseBtn?.addEventListener('click', () => {
  updateState({ activeHeroId: null });
  closeHeroModal(ui.heroModal);
});

ui.modalBackdrop?.addEventListener('click', () => {
  updateState({ activeHeroId: null });
  closeHeroModal(ui.heroModal);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !ui.heroModal?.hidden) {
    updateState({ activeHeroId: null });
    closeHeroModal(ui.heroModal);
  }
});

/**
 * Init
 */
async function initializeApp() {
  try {
    const result = await fetchHeroes();

    if (!result.ok) {
      throw new Error(result.error);
    }

    const urlState = readURLState();
    const nextState = {
      heroes: result.data,
      ...DEFAULT_VIEW_STATE,
      ...urlState,
    };

    updateState(nextState);

    if (nextState.activeHeroId) {
      const activeHero = result.data.find((hero) => hero.id === nextState.activeHeroId);
      if (activeHero && ui.heroModal) {
        showHeroModal(ui.heroModal, activeHero);
      }
    }

  } catch (error) {
    console.error(error);

    if (ui.tableBody) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');

      cell.colSpan = 15;
      cell.style.textAlign = 'center';
      cell.style.padding = '40px';
      cell.textContent = 'Failed to load superhero data.';

      row.appendChild(cell);
      ui.tableBody.replaceChildren(row);
    }
  }
}

// Start app
document.addEventListener('DOMContentLoaded', initializeApp);