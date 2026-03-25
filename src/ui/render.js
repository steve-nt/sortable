// src/ui/render.js - Pure UI rendering helpers

const SVG_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23ccc%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E';
const SVG_ERROR =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23666%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E';

/**
 * @typedef {Object} Hero
 * @property {number} id
 * @property {string|null} icon
 * @property {Object} images
 * @property {string|null} name
 * @property {string|null} fullName
 * @property {{ intelligence: number|null, strength: number|null, speed: number|null, durability: number|null, power: number|null, combat: number|null }} powerstats
 * @property {string|null} race
 * @property {string|null} gender
 * @property {number|null} height
 * @property {number|null} weight
 * @property {string|null} placeOfBirth
 * @property {string|null} alignment
 */

/**
 * Creates a table data cell with text content.
 * @param {string} text - Cell text content.
 * @param {string} [className] - Optional CSS class.
 * @returns {HTMLTableCellElement}
 */
const makeTextCell = (text, className = '') => {
  const td = document.createElement('td');
  td.textContent = text;

  if (className) {
    td.className = className;
  }

  return td;
};

/**
 * Renders heroes array into HTML table rows
 * @param {Hero[]} heroes - Normalized hero objects to display.
 * @param {(hero: Hero) => void} onRowClick - Callback when row is clicked.
 * @returns {DocumentFragment}
 */
export function createTableRows(heroes, onRowClick) {
  const fragment = document.createDocumentFragment();

  if (!heroes || heroes.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 15;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '40px';
    emptyCell.style.color = '#a0aec0';
    emptyCell.textContent = 'No heroes found. Try adjusting your search or filters.';

    emptyRow.appendChild(emptyCell);
    fragment.appendChild(emptyRow);
    return fragment;
  }

  heroes.forEach((hero) => {
    const row = document.createElement('tr');
    row.dataset.heroId = String(hero.id);

    const iconCell = document.createElement('td');
    const img = document.createElement('img');
    img.src = hero.icon || SVG_PLACEHOLDER;
    img.alt = hero.name ?? 'Unknown';
    img.loading = 'lazy';

    img.addEventListener('error', () => {
      img.src = SVG_ERROR;
    });

    iconCell.appendChild(img);

    row.appendChild(iconCell);
    row.appendChild(makeTextCell(hero.name ?? 'Unknown', 'hero-name-cell'));
    row.appendChild(makeTextCell(hero.fullName ?? '-'));
    row.appendChild(makeTextCell(String(hero.powerstats?.intelligence ?? '-')));
    row.appendChild(makeTextCell(String(hero.powerstats?.strength ?? '-')));
    row.appendChild(makeTextCell(String(hero.powerstats?.speed ?? '-')));
    row.appendChild(makeTextCell(String(hero.powerstats?.durability ?? '-')));
    row.appendChild(makeTextCell(String(hero.powerstats?.power ?? '-')));
    row.appendChild(makeTextCell(String(hero.powerstats?.combat ?? '-')));
    row.appendChild(makeTextCell(hero.race ?? '-'));
    row.appendChild(makeTextCell(hero.gender ?? '-'));
    row.appendChild(makeTextCell(String(hero.height ?? '-')));
    row.appendChild(makeTextCell(String(hero.weight ?? '-')));
    row.appendChild(makeTextCell(hero.placeOfBirth ?? '-'));
    row.appendChild(makeTextCell(hero.alignment ?? '-'));

    row.addEventListener('click', () => onRowClick(hero));
    fragment.appendChild(row);
  });

  return fragment;
}

/**
 * Render heroes into the table body
 * @param {HTMLElement|null} tableBody - The tbody element.
 * @param {Hero[]} heroes - Heroes to display.
 * @param {(hero: Hero) => void} onRowClick - Callback for row clicks.
 * @returns {void}
 */
export function renderTable(tableBody, heroes, onRowClick) {
  if (!tableBody) return;

  tableBody.innerHTML = '';
  const fragment = createTableRows(heroes, onRowClick);
  tableBody.appendChild(fragment);
}

/**
 * Updates visible sorting state on table headers.
 * @param {HTMLTableElement|null} table - Target heroes table.
 * @param {{ key: string, order: 'asc'|'desc' }} sort - Current sort state.
 * @returns {void}
 */
export function updateSortIndicators(table, sort) {
  if (!table) return;

  table.querySelectorAll('th[data-field]').forEach((th) => {
    const isActive = th.dataset.field === sort.key;
    th.classList.toggle('sort-active', isActive);
    th.classList.toggle('sort-asc', isActive && sort.order === 'asc');
    th.classList.toggle('sort-desc', isActive && sort.order === 'desc');
    th.setAttribute(
      'aria-sort',
      isActive ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'
    );
  });
}

/**
 * Updates pagination controls and labels.
 * @param {Object} ui - UI element references.
 * @param {number} currentPage - Current page (1-indexed).
 * @param {number} totalPages - Total number of pages.
 * @returns {void}
 */
export function updatePaginationUI(ui, currentPage, totalPages) {
  if (!ui.pageInfo || !ui.maxPageInfo || !ui.prevBtn || !ui.nextBtn) return;

  ui.pageInfo.textContent = String(currentPage);
  ui.maxPageInfo.textContent = String(totalPages);
  ui.prevBtn.disabled = currentPage <= 1;
  ui.nextBtn.disabled = currentPage >= totalPages;
}

/**
 * Show hero detail modal
 * @param {HTMLElement|null} modal - The modal element.
 * @param {Hero} hero - Hero object with normalized data.
 * @returns {void}
 */
const el = (id) => document.getElementById(id);

export function showHeroModal(modal, hero) {
  if (!modal) return;

  const name = hero.name ?? 'Unknown';

  const heroImage = el('heroImage');
  heroImage.src = hero.images?.lg || hero.icon || '';
  heroImage.alt = name;

  el('heroName').textContent = name;
  el('heroFullName').textContent = hero.fullName ?? '-';

  el('modalIntelligence').textContent = hero.powerstats?.intelligence ?? '-';
  el('modalStrength').textContent = hero.powerstats?.strength ?? '-';
  el('modalSpeed').textContent = hero.powerstats?.speed ?? '-';
  el('modalDurability').textContent = hero.powerstats?.durability ?? '-';
  el('modalPower').textContent = hero.powerstats?.power ?? '-';
  el('modalCombat').textContent = hero.powerstats?.combat ?? '-';

  el('modalRace').textContent = hero.race ?? 'Unknown';
  el('modalGender').textContent = hero.gender ?? 'Unknown';
  el('modalHeight').textContent = hero.height ?? 'Unknown';
  el('modalWeight').textContent = hero.weight ?? 'Unknown';
  el('modalBirth').textContent = hero.placeOfBirth ?? 'Unknown';
  el('modalAlignment').textContent = hero.alignment ?? 'Unknown';

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the hero detail modal.
 * @param {HTMLElement|null} modal - The modal element.
 * @returns {void}
 */
export function closeHeroModal(modal) {
  if (!modal) return;

  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
}