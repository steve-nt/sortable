// Application orchestrator - wires Track A core with Track B UI

import { State } from './src/core/state.js';
import { fetchHeroes } from './src/core/api.js';
import { sortHeroes } from './src/core/sorting.js';
import { filterHeroes, getPaginatedData } from './src/core/filtering.js';
import { renderTable, updatePaginationUI, showHeroModal as showModal, closeHeroModal } from './src/ui/render.js';

// UI element references
const ui = {
  searchInput: document.getElementById('searchInput'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
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
 * Calculate total pages for current dataset
 */
function getTotalPages(heroes, pageSize) {
  if (pageSize === 'all') return 1;
  const numPageSize = parseInt(pageSize, 10) || 20;
  return Math.ceil(heroes.length / numPageSize) || 1;
}

/**
 * Main render pipeline: filter → sort → paginate → render
 */
function renderPage() {
  const { heroes, searchStr, searchField, page, pageSize, sort } = State.state;

  let processed = heroes;

  // Apply search filter
  if (searchStr) {
    processed = filterHeroes(processed, searchStr, searchField);
  }

  // Apply sort
  processed = sortHeroes(processed, sort.key, sort.order);

  // Get paginated slice
  const paginatedHeroes = getPaginatedData(processed, page, pageSize);
  const totalPages = getTotalPages(processed, pageSize);

  // Render table and pagination UI
  renderTable(ui.tableBody, paginatedHeroes, (hero) => {
    showModal(ui.heroModal, hero);
  });

  updatePaginationUI(ui, page, totalPages);
}

/**
 * Handle search input with debouncing
 */
let searchTimeout;
ui.searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    State.update({ searchStr: e.target.value, page: 1 });
    renderPage();
  }, 300);
});

/**
 * Handle page size change
 */
ui.pageSizeSelect.addEventListener('change', (e) => {
  State.update({ pageSize: e.target.value, page: 1 });
  renderPage();
});

/**
 * Handle pagination
 */
ui.prevBtn.addEventListener('click', () => {
  const { page } = State.state;
  if (page > 1) {
    State.update({ page: page - 1 });
    renderPage();
  }
});

ui.nextBtn.addEventListener('click', () => {
  const { heroes, searchStr, pageSize, sort, page } = State.state;

  let processed = heroes;
  if (searchStr) processed = filterHeroes(processed, searchStr);
  processed = sortHeroes(processed, sort.key, sort.order);

  const totalPages = getTotalPages(processed, pageSize);

  // Loop back to first page when clicking next on last page
  if (page >= totalPages) {
    State.update({ page: 1 });
  } else {
    State.update({ page: page + 1 });
  }
  renderPage();
});

/**
 * Handle sorting by column header click
 */
document.querySelector('#heroesTable').addEventListener('click', (e) => {
  const th = e.target.closest('th[data-field]');
  if (!th) return;

  const field = th.dataset.field;
  State.toggleSortDirection(field);
  renderPage();
});

/**
 * Handle modal close
 */
ui.modalCloseBtn.addEventListener('click', () => {
  closeHeroModal(ui.heroModal);
});

ui.modalBackdrop.addEventListener('click', () => {
  closeHeroModal(ui.heroModal);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !ui.heroModal.hidden) {
    closeHeroModal(ui.heroModal);
  }
});

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    console.log('🦸 Initializing Superhero Database Application...');

    const result = await fetchHeroes();
    if (!result.ok) {
      throw new Error(result.error);
    }

    State.update({ heroes: result.data });
    renderPage();
    console.log('Application ready!');
  } catch (error) {
    console.error('Error initializing application:', error);
    ui.tableBody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align: center; padding: 40px; color: #ff6b6b;">
          Failed to load superhero data. Please refresh the page.
        </td>
      </tr>
    `;
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
