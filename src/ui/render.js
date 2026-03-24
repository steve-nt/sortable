// src/ui/render.js - Pure UI rendering functions

const SVG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23ccc%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E';
const SVG_ERROR = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23666%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E';

/**
 * Renders heroes array into HTML table rows
 * @param {Object[]} heroes - Normalized hero objects to display
 * @param {Function} onRowClick - Callback when row is clicked
 * @returns {DocumentFragment} Fragment of table rows
 */
export function createTableRows(heroes, onRowClick) {
  const fragment = document.createDocumentFragment();

  if (!heroes || heroes.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="15" style="text-align: center; padding: 40px; color: #a0aec0;">
        No heroes found. Try adjusting your search or filters.
      </td>
    `;
    fragment.appendChild(emptyRow);
    return fragment;
  }

  heroes.forEach((hero) => {
    const row = document.createElement('tr');
    row.dataset.heroId = hero.id;

    row.innerHTML = `
      <td>
        <img 
          src="${hero.icon || SVG_PLACEHOLDER}" 
          alt="${hero.name}"
          loading="lazy"
          onerror="this.src='${SVG_ERROR}'"
        />
      </td>
      <td class="hero-name-cell">${hero.name}</td>
      <td>${hero.fullName}</td>
      <td>${hero.powerstats.intelligence ?? '-'}</td>
      <td>${hero.powerstats.strength ?? '-'}</td>
      <td>${hero.powerstats.speed ?? '-'}</td>
      <td>${hero.powerstats.durability ?? '-'}</td>
      <td>${hero.powerstats.power ?? '-'}</td>
      <td>${hero.powerstats.combat ?? '-'}</td>
      <td>${hero.race ?? '-'}</td>
      <td>${hero.gender ?? '-'}</td>
      <td>${hero.height ?? '-'}</td>
      <td>${hero.weight ?? '-'}</td>
      <td>${hero.placeOfBirth ?? '-'}</td>
      <td>${hero.alignment ?? '-'}</td>
    `;

    row.addEventListener('click', () => onRowClick(hero));
    fragment.appendChild(row);
  });

  return fragment;
}

/**
 * Render heroes into the table body
 * @param {HTMLElement} tableBody - The tbody element
 * @param {Object[]} heroes - Heroes to display
 * @param {Function} onRowClick - Callback for row clicks
 */
export function renderTable(tableBody, heroes, onRowClick) {
  tableBody.innerHTML = '';
  const fragment = createTableRows(heroes, onRowClick);
  tableBody.appendChild(fragment);
}

/**
 * Update pagination UI (buttons and page info)
 * @param {Object} ui - UI element references
 * @param {number} currentPage - Current page (1-indexed)
 * @param {number} totalPages - Total number of pages
 */
export function updatePaginationUI(ui, currentPage, totalPages) {
  ui.pageInfo.textContent = `Page ${currentPage}`;
  ui.maxPageInfo.textContent = `/ ${totalPages}`;
  ui.prevBtn.disabled = currentPage <= 1;
  ui.nextBtn.disabled = currentPage >= totalPages;
}

/**
 * Show hero detail modal
 * @param {HTMLElement} modal - The modal element
 * @param {Object} hero - Hero object with normalized data
 */
export function showHeroModal(modal, hero) {
  document.getElementById('heroImage').src = hero.images?.lg || hero.icon || '';
  document.getElementById('heroImage').alt = hero.name;

  document.getElementById('heroName').textContent = hero.name;
  document.getElementById('heroFullName').textContent = hero.fullName;

  document.getElementById('modalIntelligence').textContent = hero.powerstats?.intelligence ?? '-';
  document.getElementById('modalStrength').textContent = hero.powerstats?.strength ?? '-';
  document.getElementById('modalSpeed').textContent = hero.powerstats?.speed ?? '-';
  document.getElementById('modalDurability').textContent = hero.powerstats?.durability ?? '-';
  document.getElementById('modalPower').textContent = hero.powerstats?.power ?? '-';
  document.getElementById('modalCombat').textContent = hero.powerstats?.combat ?? '-';

  document.getElementById('modalRace').textContent = hero.race ?? 'Unknown';
  document.getElementById('modalGender').textContent = hero.gender ?? 'Unknown';
  document.getElementById('modalHeight').textContent = hero.height ?? 'Unknown';
  document.getElementById('modalWeight').textContent = hero.weight ?? 'Unknown';
  document.getElementById('modalBirth').textContent = hero.placeOfBirth ?? 'Unknown';
  document.getElementById('modalAlignment').textContent = hero.alignment ?? 'Unknown';

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/**
 * Close hero detail modal
 * @param {HTMLElement} modal - The modal element
 */
export function closeHeroModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = 'auto';
}
