# Sortable Heroes

Vanilla JavaScript app for loading, browsing, filtering, sorting, paginating, and inspecting superhero records from the public API.

## Current Features
- Data is fetched from the superhero API and normalized in core logic.
- Main table displays only required columns:
  - Icon
  - Name
  - Full Name
  - Power Stats columns:
    - Intelligence
    - Strength
    - Speed
    - Durability
    - Power
    - Combat
  - Race
  - Gender
  - Height
  - Weight
  - Place of Birth
  - Alignment
- Detail modal shows expanded hero stats and profile information.
- Interactive search on every keystroke (debounced).
- Search supports:
  - field targeting (for example Name, Weight, Alignment, All Fields)
  - adaptive operators:
    - text fields: `include`, `exclude`, `fuzzy`
    - numeric fields (`height`, `weight`): `include`, `exclude`, `fuzzy`, `equal`, `not equal`, `greater than`, `lesser than`
- Sort by clicking table headers, with visible direction state (`Asc` or `Desc`) on the active sorted column only.
- Missing values are always sorted last.
- Page size options: `10`, `20`, `50`, `100`, `All`.
- URL sync for shareable state (search, field, operator, page, page size, sort, open hero).
- Reset button clears filters and URL back to defaults.

## Project Structure

```txt
index.html
script.js
src/
  core/
    api.js
    filtering.js
    sorting.js
    state.js
  ui/
    layout.css
    modal.css
    render.js
    table.css
tests/
  audit_reference.test.js
  track_a.test.js
```

## Architecture Overview
- `src/core`: pure data and state operations.
- `src/ui`: rendering and visual presentation.
- `script.js`: orchestration layer that wires events, state updates, URL sync, and rendering.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

If 8080 is in use, run:

```bash
npx servor . index.html 8081 --reload
```

## Test Suite

```bash
npm test
```

What tests cover:
- Core parsing/normalization/filter/sort/pagination behavior.
- State pub/sub compatibility with current function API.
- Audit reference behavior for required functionality (operators, field search, missing-last sort, required columns).

## Notes
- No frontend framework is used.
- Uses ES modules and native browser APIs only.
