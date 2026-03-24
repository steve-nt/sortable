// src/core/filtering.js

/**
 * Internal helper to retrieve nested object values using dot notation
 * @param {Object} obj - The object to traverse
 * @param {string} path - The dot notation path (e.g. "biography.fullName")
 * @returns {any} The value at the path or undefined
 */
const extractNestedValue = (obj, path) => {
	return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

/**
 * Parses a search token into field, operator and target value.
 * @param {string} valueStr - The token to parse (e.g., "weight:>:200" or "Batman")
 * @returns {{ field: string|null, operator: string, value: string }} Parsed filter metadata
 */
export const parseOperatorMatch = (valueStr) => {
	let field = null;
	let operator = "include";
	let searchVal = valueStr;

	const parts = valueStr.split(":");
	if (parts.length === 3) {
		field = parts[0].trim();
		operator = parts[1].trim();
		searchVal = parts[2].trim();
	} else if (parts.length === 2) {
		const p1 = parts[0].trim().toLowerCase();
		const p2 = parts[1].trim();

		const ops = [
			"include",
			"exclude",
			"fuzzy",
			"equal",
			"not equal",
			"greater than",
			"lesser than",
			"==",
			"!=",
			">",
			"<",
			">=",
			"<=",
			"=",
		];
		if (ops.includes(p1)) {
			operator = p1;
			searchVal = p2;
		} else {
			field = p1;
			if (!Number.isNaN(parseFloat(p2))) {
				operator = "equal";
			} else {
				operator = "include";
			}
			searchVal = p2;
		}
	}

	operator = operator.toLowerCase();
	if (["=", "=="].includes(operator)) operator = "equal";
	if (["!=", "<>"].includes(operator)) operator = "not equal";
	if (operator === ">") operator = "greater than";
	if (operator === "<") operator = "lesser than";
	if (operator === ">=") operator = "greater equal";
	if (operator === "<=") operator = "lesser equal";

	return { field, operator, value: searchVal };
};

/**
 * Standard edit distance calculation for fuzzy matching.
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {number} The distance score
 */
const levenshteinDistance = (a, b) => {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}
	return matrix[b.length][a.length];
};

/**
 * Evaluates whether a hero's specific value matches a targeted condition.
 * @param {any} heroValue - The actual value from the hero entity
 * @param {string} operator - The normalized operator token (e.g. "greater than")
 * @param {string|number} targetValue - The user input to compare against
 * @returns {boolean} Whether the condition is met
 */
const matchesCondition = (heroValue, operator, targetValue) => {
	if (heroValue === null || heroValue === undefined) {
		return targetValue === "null" || targetValue === "";
	}

	const strHeroVal = String(heroValue).toLowerCase();
	const strTargetVal = String(targetValue).toLowerCase();

	const numHero = parseFloat(heroValue);
	const numTarget = parseFloat(targetValue);
	const isNumeric = !Number.isNaN(numHero) && !Number.isNaN(numTarget);

	switch (operator) {
		case "include":
			return strHeroVal.includes(strTargetVal);
		case "exclude":
			return !strHeroVal.includes(strTargetVal);
		case "equal":
			return isNumeric ? numHero === numTarget : strHeroVal === strTargetVal;
		case "not equal":
			return isNumeric ? numHero !== numTarget : strHeroVal !== strTargetVal;
		case "greater than":
			return isNumeric ? numHero > numTarget : strHeroVal > strTargetVal;
		case "lesser than":
			return isNumeric ? numHero < numTarget : strHeroVal < strTargetVal;
		case "greater equal":
			return isNumeric ? numHero >= numTarget : strHeroVal >= strTargetVal;
		case "lesser equal":
			return isNumeric ? numHero <= numTarget : strHeroVal <= strTargetVal;
		case "fuzzy": {
			if (strHeroVal.includes(strTargetVal)) return true;
			const words = strHeroVal.split(" ");
			return words.some((w) => levenshteinDistance(w, strTargetVal) <= 2);
		}
		default:
			return strHeroVal.includes(strTargetVal);
	}
};

/**
 * Iteratively constructs matched records mapped against complex operator tokenization
 * @param {Object[]} heroes - Array of normalized hero data
 * @param {string} searchStr - The user-provided search string
 * @param {string} globalSearchField - Default field to check when none specified
 * @returns {Object[]} The filtered array
 */
export const filterHeroes = (heroes, searchStr, globalSearchField = "name") => {
	if (!searchStr || searchStr.trim() === "") return heroes;

	const tokens = searchStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

	return heroes.filter((hero) => {
		return tokens.every((token) => {
			const cleanToken = token.replace(/['"]/g, "");
			const { field, operator, value } = parseOperatorMatch(cleanToken);

			const targetField = field || globalSearchField;
			const heroValue =
				targetField === "all"
					? Object.values(hero)
							.map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
							.join(" ")
					: extractNestedValue(hero, targetField);

			if (targetField === "all") {
				return matchesCondition(heroValue, operator, value);
			}
			return matchesCondition(heroValue, operator, value);
		});
	});
};

/**
 * Functional pagination slice
 * @param {Object[]} array - The dataset to paginate
 * @param {number} page - The 1-indexed page number
 * @param {number|string} pageSize - Number of items per page or "all"
 * @returns {Object[]} The paginated slice
 */
export const getPaginatedData = (array, page, pageSize) => {
	if (pageSize === "all") return array;
	const numPageSize = parseInt(pageSize, 10) || 20;

	const maxPage = Math.ceil(array.length / numPageSize) || 1;
	const normalizedPage = Math.min(Math.max(1, page), maxPage);

	const startIndex = (normalizedPage - 1) * numPageSize;
	return array.slice(startIndex, startIndex + numPageSize);
};
