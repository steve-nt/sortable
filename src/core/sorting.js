// src/core/sorting.js

/**
 * @typedef {{ [key: string]: any }} SortableHero
 */

/**
 * Checks if data matches any "missing" variants for strict numeric rules.
 * @param {any} val - The input to check
 * @returns {boolean} Whether the input is missing
 */
const isMissing = (val) =>
  val === null ||
  val === undefined ||
  val === "" ||
  val === "-" ||
  (typeof val === "string" && val.toLowerCase() === "unknown");

/**
 * Dynamically extract a nested key via string path.
 * @param {SortableHero} obj - Source hero object.
 * @param {string} keyPath - Logic path (e.g. "powerstats.speed")
 * @returns {any} The extracted value.
 */
const extractValue = (obj, keyPath) => {
  if (!keyPath) return null;
  return keyPath.split(".").reduce((o, i) => o?.[i], obj);
};

/**
 * Pure function mapping sort requirements using ES2026 `toSorted()` immutable patterns.
 * @param {SortableHero[]} heroes - Array of normalized hero data.
 * @param {string} key - Field key to sort by
 * @param {string} direction - "asc" or "desc"
 * @returns {SortableHero[]} The sorted copy.
 */
export const sortHeroes = (heroes, key, direction = "asc") => {
  return heroes.toSorted((a, b) => {
    const valA = extractValue(a, key);
    const valB = extractValue(b, key);

    // missing ALWAYS last
    const aMissing = isMissing(valA);
    const bMissing = isMissing(valB);

    if (aMissing && !bMissing) return 1;
    if (!aMissing && bMissing) return -1;
    if (aMissing && bMissing) return 0;

    const modifier = direction === "asc" ? 1 : -1;

    // Numbers (robust)
    const numA = typeof valA === "number" ? valA : Number(valA);
    const numB = typeof valB === "number" ? valB : Number(valB);

    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return (numA - numB) * modifier;
    }

    // Strings
    return String(valA)
      .toLowerCase()
      .localeCompare(String(valB).toLowerCase()) * modifier;
  });
};