// src/core/state.js

/**
 * Core application state utilizing lightweight Signals/Pub-Sub pattern.
 * @class StateManager
 */
export class StateManager {
	#state;
	#listeners;

	/**
	 * @param {Object} [initialState={}] - Optional initial state overrides
	 */
	constructor(initialState = {}) {
		this.#state = {
			heroes: [],
			searchStr: "",
			searchField: "name",
			page: 1,
			pageSize: 20,
			sort: { key: "name", order: "asc" },
			activeHeroId: null,
			...initialState,
		};
		this.#listeners = new Set();
	}

	/**
	 * @returns {Object} Current immutable state
	 */
	get state() {
		return this.#state;
	}

	/**
	 * Registers a listener for state changes.
	 * @param {Function} callback - Function called with new state
	 * @returns {Function} Unsubscribe function
	 */
	onChange(callback) {
		this.#listeners.add(callback);
		return () => this.#listeners.delete(callback);
	}

	/**
	 * Performs an immutable partial update of the application state.
	 * @param {Object} partialState - The fields to update
	 */
	update(partialState) {
		this.#state = { ...this.#state, ...partialState };
		this.#notify();
	}

	/**
	 * Toggles sorting order between asc/desc for a given key.
	 * @param {string} key - The column key to sort
	 */
	toggleSortDirection(key) {
		let order = "asc";
		if (this.#state.sort.key === key) {
			order = this.#state.sort.order === "asc" ? "desc" : "asc";
		}
		this.update({ sort: { key, order } });
	}

	#notify() {
		for (const listener of this.#listeners) {
			listener(this.#state);
		}
	}
}

/**
 * Singleton State instance
 * @type {StateManager}
 */
export const State = new StateManager();
