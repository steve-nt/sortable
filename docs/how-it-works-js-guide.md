# How This Project Works (JavaScript Guide for Juniors)

This guide explains the full app from top to bottom using practical JavaScript concepts used in this codebase.

## 1) Big picture

The app has three layers:

- Core logic: pure functions and state management.
- UI layer: DOM rendering and visual updates.
- Orchestrator: wires user actions to core logic and UI updates.

Main flow:

1. Page loads.
2. App fetches superhero JSON data.
3. Data is normalized into a consistent shape.
4. State is updated.
5. State change triggers render.
6. User actions (search/sort/pagination/modal) update state.
7. State updates re-render table and URL.

## 2) Files and responsibilities

- `index.html`: static structure (controls, table, pagination, modal).
- `script.js`: app coordinator and event wiring.
- `src/core/api.js`: fetch + normalization.
- `src/core/filtering.js`: search token parsing, filtering, pagination slicing.
- `src/core/sorting.js`: immutable sorting with missing-value rules.
- `src/core/state.js`: centralized state store + pub/sub listeners.
- `src/ui/render.js`: table rows, pagination labels, sort indicators, modal rendering.
- `src/ui/*.css`: visual styles only.
- `tests/*.test.js`: automated verification.

## 3) JavaScript language features used

### ES modules

Files use `import`/`export` (ESM), for example:

- `script.js` imports core and UI functions.
- Core modules export reusable pure utilities.

Why this matters:

- Better separation of concerns.
- Easier testing.
- Explicit dependencies.

### `const` and `let`

- `const` is default for values that do not get reassigned.
- `let` is used when reassignment is necessary (for example, local variable changed in function logic).

### Arrow functions

Most callbacks and helpers use arrow functions for concise syntax and predictable lexical `this` behavior.

### Optional chaining (`?.`)

Used to safely read nested values that may be missing, for example in data extraction.

### Nullish fallback and value normalization

The app turns placeholders like `"-"`, `"unknown"`, empty strings, and invalid numbers into `null` so sort/filter logic stays consistent.

### Immutable array operations

Sorting uses `toSorted()` (returns a new array, does not mutate original). This avoids accidental side effects.

### Async/await

`fetchHeroes` is async. It awaits network responses and returns a result object:

- success: `{ ok: true, data }`
- failure: `{ ok: false, error }`

This keeps error flow explicit.

## 4) State management (`src/core/state.js`)

State shape includes:

- `heroes`
- `searchStr`
- `searchField`
- `searchOperator`
- `page`
- `pageSize`
- `sort` (`key`, `order`)
- `activeHeroId`

Main functions:

- `getState()`: returns a safe snapshot of state.
- `updateState(partial)`: merges partial updates and notifies listeners.
- `onStateChange(cb)`: subscribes to updates and returns unsubscribe function.
- `toggleSort(key)`: handles first-click asc and repeated-click toggling.

Pattern used: pub/sub.

- Subscribers register callbacks.
- Every `updateState` triggers all callbacks with latest state.
- The orchestrator subscribes once and re-renders.

## 5) Data fetching and normalization (`src/core/api.js`)

### Why normalize?

Remote API data is not always clean (units, placeholders, missing nested fields).
Normalization creates a predictable internal schema.

### `parseNumber`

Converts values like:

- `"180 cm" -> 180`
- `"78 kg" -> 78`
- arrays like `['-', '78 kg'] -> 78`

Returns `null` for invalid values.

### `normalizeData`

Maps each raw hero object into the app's expected fields:

- icon and images
- name/fullName
- powerstats
- race/gender/height/weight
- placeOfBirth/alignment

This is crucial for stable sort/filter/render behavior.

## 6) Filtering and operators (`src/core/filtering.js`)

### Token parser

`parseOperatorMatch` reads user search expression patterns such as:

- plain text: `Batman`
- operator form: `include:bat`
- field + operator + value: `weight:>:100`

### Operators supported

- For text fields: include, exclude, fuzzy.
- For numeric fields (height, weight): include, exclude, fuzzy, equal, not equal, greater than, lesser than.

UI operator choices are converted to parser-safe tokens in `script.js` before filtering.

### `filterHeroes`

- Splits query into tokens.
- For each hero, every token must match (AND behavior).
- Supports specific field search and all-fields search.

### `getPaginatedData`

- Handles page slicing.
- Supports `all` page size.
- Guards page bounds.

## 7) Sorting (`src/core/sorting.js`)

`sortHeroes(heroes, key, direction)`:

1. Extracts value by dot path (for nested fields).
2. Detects missing values (`null`, `undefined`, empty, `-`, `unknown`).
3. Always places missing values last (both asc and desc).
4. Sorts numeric values mathematically when possible.
5. Falls back to case-insensitive string compare.

This satisfies key audit rules around numeric weight sorting and missing-value placement.

## 8) Rendering and DOM updates (`src/ui/render.js`)

### Table rendering

- Uses `document.createElement` and `textContent` for safe text insertion.
- Creates rows for current page only.
- Main table renders each power stat as its own column (intelligence, strength, speed, durability, power, combat).

### Sort indicators

`updateSortIndicators` updates header classes and `aria-sort` so only the active sorted header shows the direction label.

### Pagination labels

`updatePaginationUI` updates page text and button disabled states.

### Modal

- `showHeroModal` fills detailed stats and bio fields.
- `closeHeroModal` hides modal and restores body scroll.

## 9) App orchestration (`script.js`)

Core responsibilities:

1. Read initial state from URL query params.
2. Fetch and normalize data.
3. Merge defaults + URL state + data.
4. Subscribe `renderPage` to state changes.
5. Attach event listeners:
   - search input (debounced)
   - search field/operator selects
   - page size select
   - prev/next pagination
   - table header sort clicks
   - modal close interactions
   - reset button

`renderPage` does this each update:

1. Sync controls from state.
2. Filter data.
3. Sort filtered data.
4. Paginate sorted data.
5. Render rows.
6. Update pagination labels.
7. Update sort header indicators.
8. Sync URL.

## 10) URL synchronization

State is mirrored to URL (when non-default):

- `search`
- `field`
- `operator`
- `page`
- `pageSize`
- `sort`
- `hero`

Benefits:

- Shareable links.
- Refresh-safe state.
- Reset button can return to clean URL path.

## 11) Reset behavior

Reset button updates state to defaults:

- empty search
- name/include search mode
- page 1
- pageSize 20
- sort name asc
- no active modal hero

Because URL sync runs on render, URL returns to base path with no query string.

## 12) Tests and confidence

The project uses Node's native test runner.

- `track_a.test.js`: live API + core behavior validation.
- `audit_reference.test.js`: deterministic acceptance checks mapped to audit expectations.

This combination gives both real-data confidence and stable regression checks.

## 13) Practical learning takeaways

- Keep business logic in pure functions when possible.
- Normalize external data early.
- Use immutable operations to reduce side effects.
- Keep UI rendering isolated from data logic.
- Use one state source of truth and subscribe the UI to changes.
- Store important UI state in URL for better UX.
- Add tests for both core functions and acceptance behavior.
