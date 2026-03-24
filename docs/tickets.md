# Sortable - Team Implementation Tickets

*A balanced, 3-track task breakdown ensuring parallel development, Clean Architecture, and strict adherence to modern ES2026 standards.*

## 📐 Overview & Solution Logic
Instead of a sequential 1-13 task block (which forces team members to aggressively block each other), we adopt a **Layered Architecture (Functional Core, Imperative Shell)**. The application is divided by technical boundaries.

*(Note: Original Jira/Linear ticket numbers are referenced in brackets [e.g., Ticket 1] mapping our tracker to the newly refined tracks.)*

---

## 🟥 Track A: Core State, Data Fetching & Transformations (Developer A)
*Focus: Data manipulation, complex sorting algorithms, and pure business logic.*

### A.1 Architecture & State Initialization [Maps to Ticket 2]
**Goal:** Establish the data contracts so the UI developer can work immediately.
- Define the shape of the centralized State object (`{ heroes, searchStr, searchField, page, pageSize, sort: { key, order }, activeHeroId }`).
- Create a static file exporting a robust Mock Array filled with edge-cases for Developer B.
- Setup a lightweight reactive Signals or Pub/Sub pattern to trigger updates without frameworks.

### A.2 Fetch API & Data Normalization Pipeline [Maps to Ticket 3, Ticket 4, Ticket 9]
**Goal:** Ingest remote data and sanitize internal inconsistencies.
- Implement the `fetch()` handler pointing to the `all.json` provider. Ensure "speed is critical" by caching the response data.
- Create mapping functions to enforce predictable data shapes: securely access nested fields like `.biography.fullName` or `.appearance.gender`, safely parse dirty numeric strings (e.g., `"180 cm" -> 180`), and normalize missing values.

### A.3 Core Filtering & Pagination Engine [Maps to Ticket 6, Ticket 7]
**Goal:** Pure functions to slice and filter datasets immutably (Audit Compliance).
- Implement case-insensitive interactive filtering logic (`String().includes()`). Results should filter "after every keystroke".
- Implement mathematical pagination calculation: `getPaginatedData(array, page, pageSize)` returning a sliced view of the required size (10, 20, 50, 100, or All).
- **[Bonus Requirements]** Build a parser to specify the field the search applies to, and support custom search operators (`include`, `exclude`, `fuzzy`, `equal`, `not equal`, `greater than` and `lesser than`).

### A.4 Advanced Sorting Engine [Maps to Ticket 8, Ticket 10, Ticket 11]
**Goal:** Strict auditing adherence regarding type evaluations, numeric sorting, and null checks.
- Build robust sorting pipelines utilizing ES2025's `toSorted()` array method to remain immutable.
- Correctly branch evaluation logic for numerical comparisons (e.g., sorting weight `"78 kg"` before `"100 kg"` mathematically, not lexicographically) and alphabetic comparisons.
- **Critical Audit Requirement:** Ensure missing values are mathematically sequestered to the *exact end* of the resulting array, regardless of whether the sorting direction is Ascending or Descending.

---

## 🟦 Track B: Presentation UI & Component Architecture (Developer B)
*Focus: HTML/CSS foundation, structural layout integrity, and declarative DOM injection.*

### B.1 Project Layout & Styling Foundation [Maps to Ticket 1]
**Goal:** Construct the base interface skeleton devoid of logic.
- Establish `index.html` and a systematic `styles.css` (No React/Vue).
- Create a slick, modern design encompassing a Header, generalized Search Input area, Table container (`<table>`), and Pagination Footer.
- Spend time playing around with modern CSS to ensure the UI looks premium.

### B.2 Table Rendering Pipeline [Maps to Ticket 5]
**Goal:** Transform hero domain data into live HTML tables directly (Audit Compliance).
- Build a pure `renderTable(heroes)` utility that blindly clears the `<tbody>` container and safely builds rows (`<tr>`).
- Ensure the table renders the exact requested columns based on API paths: Icon (rendered as `<img>` from `.images.xs`), Name, Full Name, Powerstats (displaying each entry: intelligence, strength, etc), Race, Gender, Height, Weight, Place of birth, and Alignment.
- Default the page size `<select>` and initial layout to display exactly `20` results.

### B.3 UI Form Controls Component [Maps to Ticket 7, Ticket 8]
**Goal:** Output visually compelling forms and interactable boundaries.
- Generate the Page Size `<select>` dropdown (`10`, `20`, `50`, `100`, and `all results`).
- Generate dynamic Pagination Buttons calculating next/previous constraints visually.
- Do not add a "Search" button (search is interactive).
- Add visual indicators in table headers that reflect sorting intent.

### B.4 [Bonus] Detail View Presentation Shell [Maps to Ticket 13]
**Goal:** Enrich User Experience with a deep-dive overlay.
- Structurally design a visually expanded Modal card or embedded table row for extended attributes.
- Construct a `renderHeroModal(heroPayload)` pipeline injecting the hero's large image and all detailed lore.

---

## 🟨 Track C: Orchestration, Interactivity & Routing (Developer C)
*Focus: App Controller, tying event listeners to State mutations, mapping User intent to Logic.*

### C.1 Event Delegation & App Bootstrapping [Maps to Ticket 6, Ticket 12]
**Goal:** Fuse Track A (engine) with Track B (paint) orchestrating application runtime.
- Instantiate State and initial View mounts on `DOMContentLoaded`.
- Establish global-capture Event Delegation.
- Tie the search `<input>` natively, actively filtering heroes "as you type" (keystroke events) with an ultra-light Debounce to maintain "speed is critical" constraints.

### C.2 Table Sorting Interaction Loop [Maps to Ticket 8, Ticket 12]
**Goal:** Map user clicks directly unto strict audit conditions.
- **Audit Compliance:** On bootstrap initialization, ensure all rows sort by the `Name` column in `ascending` order.
- Formulate click-tracking for all column headers. The first click on any column automatically sorts `ascending` (e.g., Weight ascending). Consecutive clicks on that heading must toggle `ascending`/`descending`.
- Re-trigger the cascading `renderTable()` loop organically upon State update.

### C.3 [Bonus] URL State Navigation Sync (Persistence Core) [Maps to Ticket 13]
**Goal:** Empower users with native deep-linking copy/paste abilities.
- Integrate the powerful `window.history` API interfacing the State object natively into the browser URL.
- Must modify the URL to encompass: the search term, the column filters, and (if detailed view is implemented) the state of which hero is physically displayed.
- Intercept Initial Page Loads analyzing URL variables to pre-populate Developer A's core State.

### C.4 Detailed Modal Invocation Interactions [Maps to Ticket 13]
**Goal:** Provide bridging interactions fetching and revealing hero scopes.
- Trap row click events to unpack custom data-attributes.
- Update the active hero State and pipe data into Developer B's UI Modal.
