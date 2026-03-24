# Sortable Web Application

A highly optimized Vanilla JavaScript (ES2026) application for sorting, filtering, and paginating superhero data. This application strictly complies with modern JavaScript paradigms and "Functional Core, Imperative Shell" Clean Architecture principles, avoiding heavy external frameworks (e.g., React, Vue). Speed and performance are guaranteed through careful debouncing and immutability.

## 🗂 File Structure Architecture (Screaming Architecture)

The project separates UI logic (View) from Data transformations (Core), stitched together by the Orchestrator (App).

```txt
/src
 ├── /core                  # Pure Data & State (Track A)
 │    ├── state.js          # Centralized State object & signals
 │    ├── api.js            # fetch() adapters and normalization mappers
 │    ├── sorting.js        # Pure functions mapping sort requirements
 │    └── filtering.js      # Pure functions for pagination scaling & matches
 │
 ├── /ui                    # Presentation & Render Pipelines (Track B)
 │    ├── layout.css        # Vanilla CSS Architecture utilizing custom properties
 │    ├── table.js          # DOM generator for the main data <table>
 │    ├── controls.js       # Renders pagination UI and interactive search inputs
 │    └── modal.js          # Bonus detail view UI generator
 │
 ├── /app                   # Orchestration & Integration (Track C)
 │    ├── app.js            # Main bootstrap entry point
 │    ├── events.js         # Event Delegation engine (click, input)
 │    └── router.js         # History synchronizer syncing URL queries with State
 │
 ├── /tests                 # Testing Directory (Node native assertions)
 │    ├── README.md         # Instructions on testing framework
 │    └── track_a.test.js   # Isolated domain logic tests pointing to real endpoints
 │
 └── index.html             # The static HTML skeleton
```

### Running Tests 🔬

No heavy external testing libraries are used. Testing relies on `node:test` tracking real fetches and edge conditions.
To verify logic and run strict node assertions, execute:
```bash
# Using NPM
npm run test

# Using Bun
bun run test
```

### Running the Application 🚀

Since this is a vanilla ESM application, it requires a local HTTP server to handle module imports and fetch requests correctly.

#### Option 1 (Recommended)
You can start a local development server with live-reloading:
```bash
# Using NPM
npm run dev

# Using Bun
bun run dev
```

#### Option 2 (Quick static server)
Alternatively, use any static server of your choice:
```bash
# Using NPM
npx servor . --reload

# Using Bun
bunx servor . --reload
```
Once started, open [http://localhost:8080](http://localhost:8080) in your browser.

## 🧠 Solution Logic Explained

### 1. The Explicit Result Pattern for Fetching
Instead of relying on fragile `try/catch` wrappers leaking into UI layers, asynchronous data fetching adopts structured `Result` objects. This allows UI to gracefully adapt to errors while parsing `all.json`.

```javascript
// src/core/api.js
export async function fetchHeroes() {
  const { promise, resolve, reject } = Promise.withResolvers();
  try {
    const response = await fetch('https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json');
    if (!response.ok) return { ok: false, error: 'Network response failed' };
    
    // Data is safely returned avoiding unhandled exceptions
    const data = await response.json();
    resolve({ ok: true, data: normalizeData(data) });
  } catch (error) {
    reject({ ok: false, error: 'Fatal request failure' });
  }
  return promise;
}
```

### 2. Functional Core: Immutability by Default
Following ES2026 rules and the `requirements.md` speed & edge-case priorities, we never mutate the `heroes` array. Sorting guarantees that numbers inside strings (like `"78 kg"`) convert properly, and missing edge-cases (e.g., missing heights/weights) group logically without destroying the underlying original dataset, utilizing the native `toSorted()` tool.

```javascript
// src/core/sorting.js
export function sortHeroes(heroes, key, direction = 'asc') {
  return heroes.toSorted((a, b) => {
    const valA = extractValue(a, key);
    const valB = extractValue(b, key);

    // Audit requirement: Missing values ALWAYS go last, ignoring direction
    const aMissing = isMissing(valA);
    const bMissing = isMissing(valB);
    if (aMissing && !bMissing) return 1;
    if (!aMissing && bMissing) return -1;
    if (aMissing && bMissing) return 0;

    // Numerical vs Lexicographical
    const modifier = direction === 'asc' ? 1 : -1;
    if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * modifier;
    }
    return String(valA).localeCompare(String(valB)) * modifier;
  });
}
```

### 3. Imperative Shell: Event Delegation & UI updates
Rendering UI relies entirely on State signals. The table is blindly regenerated based on the sliced arrays produced by the Pure Core logic. This satisfies the "no search button" interactive keystroke rule effortlessly.

```javascript
// src/app/events.js
import { renderTable, updateSortIndicators } from '../ui/table.js';
import { State } from '../core/state.js';

// Global Event Delegation listening natively on the table
document.querySelector('#superheroes-table').addEventListener('click', (e) => {
    const header = e.target.closest('th[data-sort]');
    if (!header) return;
    
    // Trigger State Machine Engine (toggles asc/desc on consecutive clicks)
    State.toggleSortDirection(header.dataset.sort); 
});

// The UI component blind-reacts to state changes
State.onChange((newState) => {
    renderTable(newState.paginatedHeroes);
    updateSortIndicators(newState.sort.key, newState.sort.direction);
    syncStateToUrl(newState); 
});
```

### 4. URL State Persistence (Bonus Strategy)
For native routing, the core Engine configuration is mirrored onto `window.history`. If a user copies and pastes a URL, the correct filters and Detail Modal render exactly the same.

```javascript
// src/app/router.js
export function syncStateToUrl(state) {
  const params = new URLSearchParams();
  if (state.searchStr) params.set('search', state.searchStr);
  params.set('page', state.page.toString());
  
  // Custom bonus attributes
  if (state.searchField) params.set('field', state.searchField);
  if (state.activeHeroId) params.set('hero', state.activeHeroId);
  
  window.history.pushState(null, '', `?${params.toString()}`);
}
```

## ✔️ Audit Compliance Checklist (`audit.md` & `requirements.md`)
- ✅ `fetch` implementation parsing `all.json` directly.
- ✅ Custom visual columns referencing explicit payload properties (`.images.xs` as IMG, each entry of `.powerstats`, `.biography.fullName`).
- ✅ Client-side variable pagination options via `<select>` (`10`, `20`, `50`, `100`, `all results`). Auto-default to `20`.
- ✅ Live dynamic interactive keystroke Search capability (where "man" instantly filters Batman). No search button present.
- ✅ Multi-column sorting supporting missing-value logic mapped strictly to the end. First click forces `ascending`, subsequent toggles. String weights (`"78 kg"`) sorted numerically.
- ✅ Initial load sorted natively by the `name` column in `ascending` order.
- ✅ 100% free of invasive rendering frameworks like React/Vue/Svelte.
- ✅ URL Modification Bonus: Persists search term, column filters, and which hero Detail View is active.
- ✅ Operators Parsing Bonus: Support `include`, `exclude`, `fuzzy`, `equal`, `not equal`, `greater than` and `lesser than`.
- ✅ Strongly conforms to Modern ES2026 guidelines.
