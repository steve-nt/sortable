import assert from "node:assert";
import test from "node:test";
import { fetchHeroes, parseNumber } from "../src/core/api.js";
import { filterHeroes, getPaginatedData } from "../src/core/filtering.js";
import { sortHeroes } from "../src/core/sorting.js";
import { getState, onStateChange, updateState } from "../src/core/state.js";

test("Track A: Data Fetching and Normalization (Using Real API Data)", async (t) => {
	const result = await fetchHeroes();

	assert.strictEqual(result.ok, true, "Fetch should return okay status");
	assert.ok(Array.isArray(result.data), "Data returned should be an array");
	assert.ok(
		result.data.length > 500,
		"Data should contain over 500 heroes (real data verification)",
	);

	const batman = result.data.find((h) => h.name === "Batman");
	assert.ok(batman, "Batman should be in the dataset");
	assert.strictEqual(
		typeof batman.weight,
		"number",
		"Weight should be normalized to a pure Number",
	);

	const abomination = result.data.find((h) => h.name === "Abomination");
	assert.strictEqual(
		abomination.weight,
		441,
		"Abomination weight should map correctly",
	);

	// Expose the real data context to sub-tests
	const heroesData = result.data;

	await t.test("API Parser helper directly", () => {
		assert.strictEqual(parseNumber("180 cm"), 180);
		assert.strictEqual(parseNumber("78 kg"), 78);
		assert.strictEqual(parseNumber(["-", "78 kg"]), 78);
		assert.strictEqual(parseNumber("blabla"), null);
	});

	await t.test("Filtering Engine: Include, Exclude, Numeric operators", () => {
		// Exact match test
		const batmen = filterHeroes(heroesData, "name:equal:Batman");
		assert.ok(batmen.length >= 1, 'Should find at least one "Batman"');

		// Operator numeric tests
		const heavyHeroes = filterHeroes(heroesData, "weight:>:400");
		assert.ok(
			heavyHeroes.length > 0,
			"There should be some heroes heavier than 400kg",
		);
		assert.ok(
			heavyHeroes.every((h) => h.weight > 400),
			"All filtered heavy heroes should weigh > 400",
		);

		// Exclusion test
		const allExceptBatman = filterHeroes(heroesData, "exclude:Batman", "name");
		assert.ok(allExceptBatman.length > 0, "Should find other heroes");
		assert.ok(
			!allExceptBatman.find((h) => h.name === "Batman"),
			"Batman should be excluded",
		);
	});

	await t.test("Filtering Engine: field-specific and operator syntax", () => {
		const goodAlignment = filterHeroes(heroesData, "alignment:equal:good");
		assert.ok(goodAlignment.length > 0, "Should find heroes with good alignment");
		assert.ok(
			goodAlignment.every((h) => String(h.alignment).toLowerCase() === "good"),
			"Field-specific equal should constrain to selected field",
		);

		const heavierThan100 = filterHeroes(heroesData, "weight:greater than:100");
		assert.ok(
			heavierThan100.every((h) => h.weight !== null && h.weight > 100),
			"Greater-than operator should work for numeric fields",
		);
	});

	await t.test(
		"Sorting Engine: Missing values sequestered at the end, numeric handling",
		() => {
			// Sort ascending
			const ascSorted = sortHeroes(heroesData, "weight", "asc");
			const validWeightsAsc = ascSorted.filter((h) => h.weight !== null);

			// Check missing are at the end
			const lastHeroAsc = ascSorted[ascSorted.length - 1];
			assert.strictEqual(
				lastHeroAsc.weight,
				null,
				"Last hero in ascending sort must have null weight",
			);

			// Check numerical ascending correctness
			assert.ok(
				validWeightsAsc[0].weight <=
					validWeightsAsc[validWeightsAsc.length - 1].weight,
				"Smallest first, largest last",
			);

			// Sort descending
			const descSorted = sortHeroes(heroesData, "weight", "desc");
			const validWeightsDesc = descSorted.filter((h) => h.weight !== null);

			// Check missing are STILL at the end
			const lastHeroDesc = descSorted[descSorted.length - 1];
			assert.strictEqual(
				lastHeroDesc.weight,
				null,
				"Last hero in DESCENDING sort must also have null weight (Audit Requirement)",
			);

			// Check numerical descending correctness
			assert.ok(
				validWeightsDesc[0].weight >=
					validWeightsDesc[validWeightsDesc.length - 1].weight,
				"Largest first, smallest last",
			);
		},
	);

	await t.test("Pagination slicing", () => {
		const page1 = getPaginatedData(heroesData, 1, 20);
		assert.strictEqual(
			page1.length,
			20,
			"Should return exactly 20 elements on standard chunk",
		);
		assert.strictEqual(page1[0].id, heroesData[0].id, "First element matches");

		const page2 = getPaginatedData(heroesData, 2, 20);
		assert.strictEqual(
			page2[0].id,
			heroesData[20].id,
			"Page 2 properly indexes starting at 20",
		);
	});

	await t.test("State Pub/Sub Mocking (Dependency verification)", () => {
		let updateCount = 0;
		const unsubscribe = onStateChange((newState) => {
			updateCount++;
			assert.strictEqual(newState.sort.key, "weight");
			assert.strictEqual(newState.sort.order, "desc");
		});

		updateState({ sort: { key: "weight", order: "desc" } });
		const now = getState();
		assert.strictEqual(now.sort.key, "weight", "State should expose latest sort key");

		assert.strictEqual(
			updateCount,
			1,
			"Listener should have fired exactly once",
		);
		unsubscribe();
	});
});
