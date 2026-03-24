// src/core/sorting.js

/**
 * Checks if data matches any "missing" variants for strict numeric rules.
 * @param {any} val - The input to check
 * @returns {boolean} Whether the input is missing
 */
const isMissing = (val) => val === null || val === undefined || val === "";

/**
 * Dynamically extract a nested key via string path.
 * @param {Object} obj - Source hero object
 * @param {string} keyPath - Logic path (e.g. "powerstats.speed")
 * @returns {any} The extracted value
 */
const extractValue = (obj, keyPath) => {
	if (!keyPath) return null;
	return keyPath.split(".").reduce((o, i) => o?.[i], obj);
};

/**
 * Pure function mapping sort requirements using ES2026 `toSorted()` immutable patterns.
 * @param {Object[]} heroes - Array of normalized hero data
 * @param {string} key - Field key to sort by
 * @param {string} direction - "asc" or "desc"
 * @returns {Object[]} The sorted copy
 */
export const sortHeroes = (heroes, key, direction = "asc") => {
	return heroes.toSorted((a, b) => {
		const valA = extractValue(a, key);
		const valB = extractValue(b, key);

		const aMissing = isMissing(valA);
		const bMissing = isMissing(valB);

		// Audit requirement: Missing values ALWAYS go last, ignoring direction
		if (aMissing && !bMissing) return 1;
		if (!aMissing && bMissing) return -1;
		if (aMissing && bMissing) return 0;

		const modifier = direction === "asc" ? 1 : -1;

		// Both values are not missing - Numerical vs Lexicographical
		if (typeof valA === "number" && typeof valB === "number") {
			return (valA - valB) * modifier;
		}

		return String(valA).localeCompare(String(valB)) * modifier;
	});
};
