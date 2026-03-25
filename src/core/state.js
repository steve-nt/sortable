// src/core/state.js

/**
 * @typedef {Object} SortState
 * @property {string} key - Currently sorted key path.
 * @property {"asc"|"desc"} order - Current sort direction.
 */

/**
 * @typedef {Object} AppState
 * @property {Object[]} heroes - Normalized hero collection.
 * @property {string} searchStr - User search text.
 * @property {string} searchField - Selected search field path.
 * @property {string} searchOperator - Selected search operator.
 * @property {number} page - Current 1-indexed page.
 * @property {string} pageSize - Page size as select-compatible token.
 * @property {SortState} sort - Table sorting state.
 * @property {number|null} activeHeroId - ID for open hero modal.
 */

/** @type {AppState} */
let state = {
  heroes: [],
  searchStr: "",
  searchField: "name",
  searchOperator: "include",
  page: 1,
  pageSize: "20",
  sort: { key: "name", order: "asc" },
  activeHeroId: null,
};

/** @type {Set<(nextState: AppState) => void>} */
const listeners = new Set();

/**
 * Returns a read-safe snapshot of the current state.
 * @returns {AppState}
 */
export const getState = () => ({ ...state, sort: { ...state.sort } });

/**
 * Registers a callback for state updates.
 * @param {(nextState: AppState) => void} callback - Listener callback.
 * @returns {() => boolean} Unsubscribe function.
 */
export const onStateChange = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

/**
 * Merges a partial update and notifies all subscribers.
 * @param {Partial<AppState>} partialState - Partial state patch.
 * @returns {void}
 */
export const updateState = (partialState) => {
  state = { ...state, ...partialState };
  notify();
};

/**
 * Toggles sort direction for the selected key.
 * @param {string} key - Key path used for sorting.
 * @returns {void}
 */
export const toggleSort = (key) => {
  let order = "asc";

  if (state.sort.key === key) {
    order = state.sort.order === "asc" ? "desc" : "asc";
  }

  updateState({ sort: { key, order } });
};

/**
 * Notifies each registered state listener.
 * @returns {void}
 */
const notify = () => {
  const snapshot = getState();

  for (const listener of listeners) {
    listener(snapshot);
  }
};