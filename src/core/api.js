// src/core/api.js

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
		else str = str[1] || str[0];
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
 * @returns {Object[]} Array of normalized hero objects
 */
export const normalizeData = (heroes) => {
	return heroes.map((hero) => {
		const getValue = (val) =>
			val === "-" || val === "" || val === null || val === undefined
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
 * Adheres to Explicit Result Pattern & Promise.withResolvers()
 * @returns {Promise<{ ok: true, data: Object[] } | { ok: false, error: string }>} Result object containing data or error
 */
export const fetchHeroes = async () => {
	const { promise, resolve } = Promise.withResolvers();

	try {
		const response = await fetch(
			"https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json",
		);
		if (!response.ok) {
			resolve({ ok: false, error: `Network error: ${response.status}` });
			return promise;
		}
		const data = await response.json();
		resolve({ ok: true, data: normalizeData(data) });
	} catch (error) {
		resolve({ ok: false, error: error.message });
	}

	return promise;
};
