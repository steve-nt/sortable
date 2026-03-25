import assert from "node:assert";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { filterHeroes, getPaginatedData } from "../src/core/filtering.js";
import { sortHeroes } from "../src/core/sorting.js";

/**
 * Compact fixture focused on audit acceptance behavior.
 */
const HEROES = [
  {
    id: 1,
    icon: "a",
    images: { lg: "a-lg" },
    name: "Batman",
    fullName: "Bruce Wayne",
    powerstats: {
      intelligence: 100,
      strength: 26,
      speed: 27,
      durability: 50,
      power: 47,
      combat: 100,
    },
    race: "Human",
    gender: "Male",
    height: 188,
    weight: 95,
    placeOfBirth: "Gotham City",
    alignment: "good",
  },
  {
    id: 2,
    icon: "b",
    images: { lg: "b-lg" },
    name: "Catwoman",
    fullName: "Selina Kyle",
    powerstats: {
      intelligence: 69,
      strength: 11,
      speed: 33,
      durability: 28,
      power: 27,
      combat: 85,
    },
    race: "Human",
    gender: "Female",
    height: 175,
    weight: 61,
    placeOfBirth: "East End",
    alignment: "neutral",
  },
  {
    id: 3,
    icon: "c",
    images: { lg: "c-lg" },
    name: "Abomination",
    fullName: "Emil Blonsky",
    powerstats: {
      intelligence: 63,
      strength: 80,
      speed: 53,
      durability: 90,
      power: 62,
      combat: 95,
    },
    race: "Human / Radiation",
    gender: "Male",
    height: 203,
    weight: 441,
    placeOfBirth: "Zagreb, Yugoslavia",
    alignment: "bad",
  },
  {
    id: 4,
    icon: "d",
    images: { lg: "d-lg" },
    name: "Mystery Hero",
    fullName: null,
    powerstats: {
      intelligence: null,
      strength: null,
      speed: null,
      durability: null,
      power: null,
      combat: null,
    },
    race: null,
    gender: null,
    height: null,
    weight: null,
    placeOfBirth: null,
    alignment: null,
  },
];

test("Audit reference: search includes Catwoman when typing Cat", () => {
  const result = filterHeroes(HEROES, "Cat", "name");
  assert.ok(result.some((hero) => hero.name === "Catwoman"));
});

test("Audit reference: search can target fields apart from name", () => {
  const result = filterHeroes(HEROES, "alignment:equal:bad", "name");
  assert.deepStrictEqual(result.map((hero) => hero.name), ["Abomination"]);
});

test("Audit reference: include/exclude/equal/not equal/greater/less operators", () => {
  const includeResult = filterHeroes(HEROES, "include:man", "name");
  assert.ok(includeResult.some((hero) => hero.name === "Batman"));

  const excludeResult = filterHeroes(HEROES, "exclude:man", "name");
  assert.ok(!excludeResult.some((hero) => hero.name === "Batman"));

  const equalResult = filterHeroes(HEROES, "weight:equal:95", "name");
  assert.deepStrictEqual(equalResult.map((hero) => hero.name), ["Batman"]);

  const notEqualResult = filterHeroes(HEROES, "weight:!=:95", "name");
  assert.ok(notEqualResult.some((hero) => hero.name === "Abomination"));

  const greaterResult = filterHeroes(HEROES, "weight:>:100", "name");
  assert.deepStrictEqual(greaterResult.map((hero) => hero.name), ["Abomination"]);

  const lessResult = filterHeroes(HEROES, "weight:<:90", "name");
  assert.deepStrictEqual(lessResult.map((hero) => hero.name), ["Catwoman"]);
});

test("Audit reference: missing values are always last in asc and desc", () => {
  const asc = sortHeroes(HEROES, "weight", "asc");
  const desc = sortHeroes(HEROES, "weight", "desc");

  assert.strictEqual(asc.at(-1)?.name, "Mystery Hero");
  assert.strictEqual(desc.at(-1)?.name, "Mystery Hero");
});

test("Audit reference: numeric weight sort is mathematical", () => {
  const sorted = sortHeroes(HEROES, "weight", "asc");
  const known = sorted.filter((hero) => hero.weight !== null).map((hero) => hero.weight);

  assert.deepStrictEqual(known, [61, 95, 441]);
});

test("Audit reference: pagination slices correctly", () => {
  const pageOne = getPaginatedData(HEROES, 1, 2);
  const pageTwo = getPaginatedData(HEROES, 2, 2);

  assert.deepStrictEqual(pageOne.map((hero) => hero.id), [1, 2]);
  assert.deepStrictEqual(pageTwo.map((hero) => hero.id), [3, 4]);
});

test("Audit reference: index table columns match required display only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.ok(html.includes(">Icon<"));
  assert.ok(html.includes(">Name<"));
  assert.ok(html.includes(">Full Name<"));
  assert.ok(html.includes(">Intelligence<"));
  assert.ok(html.includes(">Strength<"));
  assert.ok(html.includes(">Speed<"));
  assert.ok(html.includes(">Durability<"));
  assert.ok(html.includes(">Power<"));
  assert.ok(html.includes(">Combat<"));
  assert.ok(html.includes(">Race<"));
  assert.ok(html.includes(">Gender<"));
  assert.ok(html.includes(">Height<"));
  assert.ok(html.includes(">Weight<"));
  assert.ok(html.includes(">Place of Birth<"));
  assert.ok(html.includes(">Alignment<"));

  assert.ok(html.includes('data-field="powerstats.intelligence"'));
  assert.ok(html.includes('data-field="powerstats.strength"'));
  assert.ok(html.includes('data-field="powerstats.speed"'));
  assert.ok(html.includes('data-field="powerstats.durability"'));
  assert.ok(html.includes('data-field="powerstats.power"'));
  assert.ok(html.includes('data-field="powerstats.combat"'));
  assert.ok(!html.includes("Asc/Desc"));
});
