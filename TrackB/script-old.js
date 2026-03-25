/* ============================================================================
   TRACK B: PRESENTATION UI & COMPONENT ARCHITECTURE - JavaScript Layer
   Table Rendering Pipeline, Form Controls, and Detail View
   ============================================================================ */

// ─────────────────────────────────────────────────────────────────────────
// B.1 & B.3: DOM ELEMENT REFERENCES & STATE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────

// DOM element references for interactive form controls (B.3)
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const tableBody = document.getElementById('tableBody');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const maxPageInfo = document.getElementById('maxPageInfo');

// Modal references for B.4 (Bonus: Detail View)
const heroModal = document.getElementById('heroModal');
const modalBackdrop = document.querySelector('.modal-backdrop');
const modalCloseBtn = document.querySelector('.modal-close');

// Application state: centralized state management for presentation layer
const appState = {
  // Raw heroes data from API (will be populated after fetch)
  heroes: [],
  // Current page number for pagination
  currentPage: 1,
  // Number of items per page (default: 20 as per B.3 requirement)
  pageSize: 20,
  // Column to sort by
  sortBy: 'name',
  // Sort direction: 'asc' or 'desc'
  sortDirection: 'asc',
};

// ─────────────────────────────────────────────────────────────────────────
// B.2: DATA NORMALIZATION & EXTRACTION UTILITIES
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.2: Safely extract nested object values with fallback to default
 * @param {Object} obj - The object to extract from
 * @param {String} path - Dot-notation path (e.g., "biography.fullName")
 * @param {*} defaultValue - Fallback value if path not found
 * @returns {*} The extracted value or default
 */
const getNestedValue = (obj, path, defaultValue = 'Unknown') => {
  // Split path by dots and traverse object safely
  const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
  // Return value if truthy, otherwise return default
  return value || defaultValue;
};

/**
 * B.2: Extract numeric value from dimension strings (e.g., "180 cm" -> 180)
 * @param {String} dimensionString - String with number and unit (e.g., "90 kg")
 * @returns {Number} Extracted numeric value or Infinity for "Unknown"
 */
const extractNumericValue = (dimensionString) => {
  // Handle missing/unknown values
  if (!dimensionString || dimensionString === 'Unknown' || dimensionString === '-') {
    return Infinity; // Missing values sort last
  }
  // Use regex to extract first number sequence from string
  const match = dimensionString.match(/^[\d.-]+/);
  // Return parsed number or Infinity if no match
  return match ? parseFloat(match[0]) : Infinity;
};

/**
 * B.2: Normalize hero data for consistent access patterns
 * Maps raw API data to standardized format for rendering
 * @param {Object} hero - Raw hero object from API
 * @returns {Object} Normalized hero object with all required fields
 */
const normalizeHero = (hero) => {
  // Extract all required fields with safe path access
  return {
    id: hero.id,
    icon: getNestedValue(hero, 'images.xs', ''),
    name: getNestedValue(hero, 'name', 'Unknown'),
    fullName: getNestedValue(hero, 'biography.fullName', 'Unknown'),
    // Powerstats: extract each stat or use "-" as placeholder
    intelligence: getNestedValue(hero, 'powerstats.intelligence', '-'),
    strength: getNestedValue(hero, 'powerstats.strength', '-'),
    speed: getNestedValue(hero, 'powerstats.speed', '-'),
    durability: getNestedValue(hero, 'powerstats.durability', '-'),
    power: getNestedValue(hero, 'powerstats.power', '-'),
    combat: getNestedValue(hero, 'powerstats.combat', '-'),
    // Appearance data
    race: getNestedValue(hero, 'appearance.race', 'Unknown'),
    gender: getNestedValue(hero, 'appearance.gender', 'Unknown'),
    height: getNestedValue(hero, 'appearance.height', 'Unknown'),
    weight: getNestedValue(hero, 'appearance.weight', 'Unknown'),
    // Biography data
    placeOfBirth: getNestedValue(hero, 'biography.placeOfBirth', 'Unknown'),
    alignment: getNestedValue(hero, 'biography.alignment', 'Unknown'),
    // Store original raw hero data for modal detail view (B.4)
    rawData: hero,
  };
};

// ─────────────────────────────────────────────────────────────────────────
// B.2: TABLE RENDERING PIPELINE
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.2: Pure renderTable utility - renders heroes array into HTML table
 * This is the core rendering function that transforms domain data to DOM
 * @param {Array<Object>} heroes - Array of normalized hero objects to render
 */
const renderTable = (heroes) => {
  // B.2: Clear existing table body completely before re-rendering
  tableBody.innerHTML = '';

  // Guard clause: handle empty heroes array gracefully
  if (!heroes || heroes.length === 0) {
    // Insert empty state message
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="15" style="text-align: center; padding: 40px; color: #a0aec0;">
        No heroes found. Try adjusting your search or filters.
      </td>
    `;
    tableBody.appendChild(emptyRow);
    return;
  }

  // B.2: Iterate each hero and create table row element
  heroes.forEach((hero) => {
    // Create new table row element for this hero
    const row = document.createElement('tr');
    // Add data attributes for row reference (used in B.4 modal)
    row.dataset.heroId = hero.id;

    // B.2: Build row HTML with all required columns from Instructions.md
    row.innerHTML = `
      <!-- Icon column: render image from API, fallback to placeholder -->
      <td>
        <img 
          src="${hero.icon || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23ccc%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'}" 
          alt="${hero.name}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23666%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'"
        />
      </td>
      <!-- Name column: hero's common name, clickable for detail view (B.4) -->
      <td class="hero-name-cell">${hero.name}</td>
      <!-- Full Name column: real identity -->
      <td>${hero.fullName}</td>
      <!-- Powerstats: intelligence (numeric value or "-" if unknown) -->
      <td>${hero.intelligence}</td>
      <!-- Powerstats: strength -->
      <td>${hero.strength}</td>
      <!-- Powerstats: speed -->
      <td>${hero.speed}</td>
      <!-- Powerstats: durability -->
      <td>${hero.durability}</td>
      <!-- Powerstats: power -->
      <td>${hero.power}</td>
      <!-- Powerstats: combat -->
      <td>${hero.combat}</td>
      <!-- Race column: species/race -->
      <td>${hero.race}</td>
      <!-- Gender column: hero's gender -->
      <td>${hero.gender}</td>
      <!-- Height column: physical dimension (e.g., "180 cm") -->
      <td>${hero.height}</td>
      <!-- Weight column: physical dimension (e.g., "90 kg") -->
      <td>${hero.weight}</td>
      <!-- Place of Birth column: birthplace -->
      <td>${hero.placeOfBirth}</td>
      <!-- Alignment column: moral alignment (good/bad/neutral) -->
      <td>${hero.alignment}</td>
    `;

    // B.4 (Bonus): Add click handler to row for detail modal view
    row.addEventListener('click', () => showHeroModal(hero));

    // Append completed row to table body
    tableBody.appendChild(row);
  });
};

// ─────────────────────────────────────────────────────────────────────────
// B.2: PAGINATION & DATA SLICING UTILITIES
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.3: Calculate and return paginated slice of heroes array
 * @param {Array<Object>} heroes - Full heroes array to paginate
 * @param {Number} page - Current page number (1-indexed)
 * @param {Number} pageSize - Items per page (or "all" for all items)
 * @returns {Array<Object>} Sliced heroes for current page
 */
const getPaginatedHeroes = (heroes, page, pageSize) => {
  // Handle "all" pageSize: return entire array
  if (pageSize === 'all' || pageSize === 'All') {
    return heroes;
  }

  // Convert pageSize to number if it's a string
  const size = parseInt(pageSize, 10);
  // Calculate starting index for this page (0-indexed)
  const startIndex = (page - 1) * size;
  // Calculate ending index for this page
  const endIndex = startIndex + size;

  // Return slice of heroes for this page using immutable slice method
  return heroes.slice(startIndex, endIndex);
};

/**
 * B.3: Calculate total number of pages based on heroes and page size
 * @param {Array<Object>} heroes - Full heroes array
 * @param {Number} pageSize - Items per page
 * @returns {Number} Total number of pages
 */
const getTotalPages = (heroes, pageSize) => {
  // Handle "all" pageSize: only 1 page
  if (pageSize === 'all' || pageSize === 'All') {
    return 1;
  }

  // Convert pageSize to number and calculate total pages
  const size = parseInt(pageSize, 10);
  // Use Math.ceil to round up (ensure all items fit across pages)
  return Math.ceil(heroes.length / size);
};

// ─────────────────────────────────────────────────────────────────────────
// B.3: PAGINATION UI UPDATE
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.3: Update pagination UI elements (buttons and page info text)
 * @param {Array<Object>} heroes - Full heroes array for page calculation
 * @param {Number} currentPage - Current page number
 * @param {Number} pageSize - Items per page
 */
const updatePaginationUI = (heroes, currentPage, pageSize) => {
  // Calculate total pages based on current state
  const totalPages = getTotalPages(heroes, pageSize);

  // B.3: Update page number display (e.g., "Page 1 / 5")
  pageInfo.textContent = currentPage;
  maxPageInfo.textContent = totalPages;

  // B.3: Disable Previous button if on first page
  prevBtn.disabled = currentPage <= 1;
  // B.3: Disable Next button if on last page
  nextBtn.disabled = currentPage >= totalPages;
};

// ─────────────────────────────────────────────────────────────────────────
// B.2 & B.3: MAIN RENDER ORCHESTRATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.2 & B.3: Main render pipeline - orchestrates filter→sort→paginate→render flow
 * This function is called whenever state changes (search, sort, pagination, etc)
 */
const renderPage = () => {
  // Get heroes to display based on current page and page size
  const paginatedHeroes = getPaginatedHeroes(
    appState.heroes,
    appState.currentPage,
    appState.pageSize
  );

  // B.2: Render heroes into table using pure renderTable utility
  renderTable(paginatedHeroes);

  // B.3: Update pagination UI (buttons and page info)
  updatePaginationUI(appState.heroes, appState.currentPage, appState.pageSize);

  // Scroll table into view for better UX on pagination
  document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth' });
};

// ─────────────────────────────────────────────────────────────────────────
// B.3: FORM CONTROL EVENT HANDLERS
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.3: Handle page size dropdown change
 * Resets to page 1 when changing page size
 */
const handlePageSizeChange = (event) => {
  // Update app state with new page size value
  appState.pageSize = event.target.value;
  // Reset to first page when changing page size
  appState.currentPage = 1;
  // Re-render page with new pagination settings
  renderPage();
};

/**
 * B.3: Handle Previous button click
 * Decrements current page if not on first page
 */
const handlePrevious = () => {
  // Only decrement if not on first page
  if (appState.currentPage > 1) {
    appState.currentPage--;
    renderPage();
  }
};

/**
 * B.3: Handle Next button click
 * Increments current page if not on last page
 */
const handleNext = () => {
  // Calculate total pages to check if we can increment
  const totalPages = getTotalPages(appState.heroes, appState.pageSize);
  // Increment if not on last page
  if (appState.currentPage < totalPages) {
    appState.currentPage++;
    renderPage();
  }
};

// ─────────────────────────────────────────────────────────────────────────
// B.4: HERO DETAIL MODAL (BONUS FEATURE)
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.4: Display hero detail modal with expanded information
 * @param {Object} hero - Normalized hero object to display
 */
const showHeroModal = (hero) => {
  // B.4: Populate modal with hero's large image
  document.getElementById('heroImage').src = hero.rawData?.images?.lg || hero.icon;
  document.getElementById('heroImage').alt = hero.name;

  // B.4: Populate hero identity section
  document.getElementById('heroName').textContent = hero.name;
  document.getElementById('heroFullName').textContent = hero.fullName;

  // B.4: Populate detailed powerstats in modal grid
  document.getElementById('modalIntelligence').textContent = hero.intelligence;
  document.getElementById('modalStrength').textContent = hero.strength;
  document.getElementById('modalSpeed').textContent = hero.speed;
  document.getElementById('modalDurability').textContent = hero.durability;
  document.getElementById('modalPower').textContent = hero.power;
  document.getElementById('modalCombat').textContent = hero.combat;

  // B.4: Populate biographical information
  document.getElementById('modalRace').textContent = hero.race;
  document.getElementById('modalGender').textContent = hero.gender;
  document.getElementById('modalHeight').textContent = hero.height;
  document.getElementById('modalWeight').textContent = hero.weight;
  document.getElementById('modalBirth').textContent = hero.placeOfBirth;
  document.getElementById('modalAlignment').textContent = hero.alignment;

  // B.4: Show modal by adding active class
  heroModal.classList.add('active');
  // Prevent body scroll while modal is open
  document.body.style.overflow = 'hidden';
};

/**
 * B.4: Close hero detail modal
 */
const closeHeroModal = () => {
  // B.4: Hide modal by removing active class
  heroModal.classList.remove('active');
  // Restore body scroll
  document.body.style.overflow = 'auto';
};

// ─────────────────────────────────────────────────────────────────────────
// B.1: EVENT LISTENER REGISTRATION
// ─────────────────────────────────────────────────────────────────────────

// B.3: Register page size select change handler
pageSizeSelect.addEventListener('change', handlePageSizeChange);

// B.3: Register pagination button handlers
prevBtn.addEventListener('click', handlePrevious);
nextBtn.addEventListener('click', handleNext);

// B.4: Register modal close handlers
modalCloseBtn.addEventListener('click', closeHeroModal);
modalBackdrop.addEventListener('click', closeHeroModal);

// B.4: Close modal on Escape key press
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && heroModal.classList.contains('active')) {
    closeHeroModal();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// B.1: APPLICATION INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * B.1: Initialize application by fetching and processing hero data
 * Uses fetch API to load data from CDN, normalizes it, and renders initial page
 */
const initializeApp = async () => {
  try {
    // Log initialization start for debugging
    console.log('🦸 Initializing Superhero Database Application...');

    // B.1: Fetch hero data from CDN using native fetch API
    const response = await fetch(
      'https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json'
    );

    // Check if fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    // Parse JSON response
    const rawHeroes = await response.json();
    console.log(`Fetched ${rawHeroes.length} heroes from API`);

    // B.2: Normalize all heroes data for consistent access patterns
    appState.heroes = rawHeroes.map(normalizeHero);
    console.log('Normalized hero data');

    // B.1 & B.3: Initial render with default page size (20 as per requirements)
    renderPage();
    console.log('Initial page rendered with 20 heroes');
    console.log('Application ready!');
  } catch (error) {
    // Handle fetch or processing errors
    console.error('Error initializing application:', error);
    // Display error message in table
    tableBody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align: center; padding: 40px; color: #ff6b6b;">
          Failed to load superhero data. Please refresh the page.
        </td>
      </tr>
    `;
  }
};

// B.1: Start application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);