// src/core/api.js

/**
 * @typedef {Object} HeroPowerstats
 * @property {number|null} intelligence
 * @property {number|null} strength
 * @property {number|null} speed
 * @property {number|null} durability
 * @property {number|null} power
 * @property {number|null} combat
 */

/**
 * @typedef {Object} HeroRecord
 * @property {number} id
 * @property {string|null} icon
 * @property {{ xs?: string, lg?: string }|null} images
 * @property {string|null} name
 * @property {string|null} fullName
 * @property {HeroPowerstats} powerstats
 * @property {string|null} race
 * @property {string|null} gender
 * @property {number|null} height
 * @property {number|null} weight
 * @property {string|null} placeOfBirth
 * @property {string|null} alignment
 */

/**
 * Normalizes numerical values from dirty string inputs
 * @param {string|number|string[]} str - The value to parse (e.g., "180 cm", "78 kg", or ["-", "180 cm"])
 * @returns {number|null} The parsed number or null if invalid
 */
export const parseNumber = (str) => {
	if (Array.isArray(str)) {
		const metric = str.find(
			(s) =>
				String(s).includes("cm") ||
				String(s).includes("kg") ||
				String(s).includes("meters") ||
				String(s).includes("tons"),
		);
		if (metric) str = metric;
		else str = str.find(Boolean) ?? str[0];
	}

	if (typeof str === "number") return str;

	const num = parseFloat(
		String(str)
			.replace(/,/g, "")
			.replace(/[^0-9.-]/g, ""),
	);
	if (Number.isNaN(num)) return null;

	if (num === 0 && String(str).match(/(cm|kg|lb|meters|tons)/)) {
		return null; // 0 kg is missing data
	}
	return num;
};

/**
 * Ensures strict predictable data shapes across all domain operations
 * @param {Object[]} heroes - Array of raw hero data from the API
 * @returns {HeroRecord[]} Array of normalized hero objects.
 */
export const normalizeData = (heroes) => {
	return heroes.map((hero) => {
		const getValue = (val) =>
			val === "-" ||
			val === "" ||
			val === null ||
			val === undefined ||
			(typeof val === "string" && val.toLowerCase() === "unknown")
				? null
				: val;

		return {
			id: hero.id,
			icon: hero.images?.xs || null,
			images: hero.images || null,
			name: getValue(hero.name),
			fullName: getValue(hero.biography?.fullName),
			powerstats: {
				intelligence: parseNumber(hero.powerstats?.intelligence),
				strength: parseNumber(hero.powerstats?.strength),
				speed: parseNumber(hero.powerstats?.speed),
				durability: parseNumber(hero.powerstats?.durability),
				power: parseNumber(hero.powerstats?.power),
				combat: parseNumber(hero.powerstats?.combat),
			},
			race: getValue(hero.appearance?.race),
			gender: getValue(hero.appearance?.gender),
			height: parseNumber(hero.appearance?.height),
			weight: parseNumber(hero.appearance?.weight),
			placeOfBirth: getValue(hero.biography?.placeOfBirth),
			alignment: getValue(hero.biography?.alignment),
		};
	});
};

/**
 * Returns a result object with either data or error
 * @returns {Promise<{ ok: true, data: HeroRecord[] } | { ok: false, error: string }>} Result object containing data or error.
 */
export const fetchHeroes = async () => {
	try {
		const response = await fetch(
			"https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json"
		);

		if (!response.ok) {
			return { ok: false, error: `Network error: ${response.status}` };
		}

		const data = await response.json();
		return { ok: true, data: normalizeData(data) };

	} catch (error) {
		return { ok: false, error: error.message };
	}
};