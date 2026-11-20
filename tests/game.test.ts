import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PER_ROUND, answerText, buildRound, coinsForAnswer, isBuiltCorrect, isUnlocked, starsFor } from "../src/game.ts";
import type { Item } from "../src/types.ts";
import { WORLDS } from "../src/worlds.ts";

const NAMES = [
  "Numbers Island",
  "Hello Town",
  "Library Castle",
  "Zoo Jungle",
  "Olympic Stadium",
  "Body Safari",
  "Fashion Planet",
  "Chocolate Kingdom",
];

describe("question banks", () => {
  it("keeps the eight worlds and at least ten questions each", () => {
    assert.deepEqual(
      WORLDS.map((world) => world.name),
      NAMES,
    );
    assert.equal(WORLDS.length, 8);
    for (const world of WORLDS) {
      assert.ok(world.qs.length >= PER_ROUND, world.name);
      assert.ok(world.icon.length > 0);
      assert.ok(world.sub.length > 0);
    }
    assert.equal(
      WORLDS.reduce((sum, world) => sum + world.qs.length, 0),
      165,
    );
  });

  it("gives every choice a distinct answer and distractors", () => {
    for (const world of WORLDS) {
      for (const question of world.qs) {
        if (question.k !== "c") continue;
        const all = [question.a, ...question.o];
        assert.equal(new Set(all).size, all.length, world.name + " " + question.p);
      }
    }
  });
});

describe("rounds and scoring", () => {
  it("builds ten shuffled challenges that still contain the answer", () => {
    for (let world = 0; world < WORLDS.length; world++) {
      const round = buildRound(world);
      assert.equal(round.length, 10);
      for (const item of round) {
        if (item.q.k === "c") {
          assert.ok(item.opts.includes(item.q.a));
          assert.equal(item.opts.length, item.q.o.length + 1);
          assert.equal(item.tiles.length, 0);
        } else if (item.q.k === "s") {
          assert.equal(item.tiles.map((tile) => tile.v).sort().join(""), item.q.w.split("").sort().join(""));
        } else {
          assert.deepEqual(item.tiles.map((tile) => tile.v).sort(), [...item.q.w].sort());
          const ordered = item.q.w.map((word, index) => item.tiles.find((tile) => tile.v === word && tile.id === index) ?? item.tiles.find((tile) => tile.v === word));
          assert.ok(ordered.every((tile) => tile));
        }
      }
    }
  });

  it("awards stars at 7, 8 and 10 correct answers", () => {
    assert.equal(starsFor(6, 10), 0);
    assert.equal(starsFor(7, 10), 1);
    assert.equal(starsFor(8, 10), 2);
    assert.equal(starsFor(9, 10), 2);
    assert.equal(starsFor(10, 10), 3);
    assert.equal(isUnlocked([0, 0, 0, 0, 0, 0, 0, 0], 0), true);
    assert.equal(isUnlocked([0, 0, 0, 0, 0, 0, 0, 0], 1), false);
    assert.equal(isUnlocked([1, 0, 0, 0, 0, 0, 0, 0], 1), true);
    assert.equal(isUnlocked([1, 0, 0, 0, 0, 0, 0, 0], 2), false);
  });

  it("pays 10 coins, then 15 from the third correct answer in a row", () => {
    assert.deepEqual(coinsForAnswer(0, true), { streak: 1, gain: 10 });
    assert.deepEqual(coinsForAnswer(1, true), { streak: 2, gain: 10 });
    assert.deepEqual(coinsForAnswer(2, true), { streak: 3, gain: 15 });
    assert.deepEqual(coinsForAnswer(3, false), { streak: 0, gain: 0 });
  });

  it("checks spelling and word order the same way the board does", () => {
    const spell: Item = {
      q: { k: "s", p: "Escribe en inglés: «otoño»", e: "🍂", w: "AUTUMN" },
      opts: [],
      tiles: [
        { id: 2, v: "T" },
        { id: 0, v: "A" },
        { id: 1, v: "U" },
        { id: 5, v: "N" },
        { id: 3, v: "U" },
        { id: 4, v: "M" },
      ],
    };
    assert.equal(isBuiltCorrect(spell, [0, 1, 2, 3, 4, 5]), true);
    assert.equal(answerText(spell.q), "AUTUMN");

    const order: Item = {
      q: { k: "o", p: "Ordena la frase", e: "🍦", w: ["I", "want", "to", "eat", "ice cream."] },
      opts: [],
      tiles: [
        { id: 4, v: "ice cream." },
        { id: 0, v: "I" },
        { id: 1, v: "want" },
        { id: 2, v: "to" },
        { id: 3, v: "eat" },
      ],
    };
    assert.equal(isBuiltCorrect(order, [0, 1, 2, 3, 4]), true);
    assert.equal(isBuiltCorrect(order, [1, 0, 2, 3, 4]), false);
  });
});
