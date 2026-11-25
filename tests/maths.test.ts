import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeAnswer, exprFactIds, formatAmount, parseAmount, sameAmount } from "../src/maths/expr.ts";
import { JULIA_STORY, MATHS_WORLDS, problemById } from "../src/maths/problems.ts";

describe("missió problemes", () => {
  it("has eight worlds of six problems and computes every answer from the data", () => {
    assert.equal(MATHS_WORLDS.length, 8);
    const ids = new Set<string>();
    let count = 0;
    for (const [worldIndex, world] of MATHS_WORLDS.entries()) {
      assert.equal(world.problems.length, 6, world.name);
      for (const problem of world.problems) {
        count += 1;
        assert.equal(ids.has(problem.id), false, problem.id);
        ids.add(problem.id);
        const answer = computeAnswer(problem);
        assert.ok(answer >= 0, problem.id);
        assert.equal(Number.isInteger(answer), true, problem.id);
        const useful = problem.facts.filter((fact) => fact.useful).map((fact) => fact.id).sort();
        const used = [...exprFactIds(problem.expr)].sort();
        assert.deepEqual(used, useful, problem.id + " dades útils");
        assert.equal(problem.questions.filter((item) => item.ok).length, 1, problem.id);
        assert.equal(problem.plans.filter((item) => item.ok).length, 1, problem.id);
        assert.equal(problem.sentences.filter((item) => item.ok).length, 1, problem.id);
        assert.equal(problem.questions.length, 3, problem.id);
        const sentence = problem.sentences.find((item) => item.ok);
        assert.ok(sentence?.text.includes(formatAmount(answer, problem.money)), problem.id + " frase " + formatAmount(answer, problem.money));
        for (const trap of problem.traps) assert.notEqual(trap.value, answer, problem.id);
        if (worldIndex === 5) assert.ok(problem.facts.some((fact) => !fact.useful), problem.id);
      }
    }
    assert.ok(count >= 40);
  });

  it("solves the Júlia worksheet: spent 16 €, left 22,50 €", () => {
    const julia = problemById("w3-julia");
    assert.ok(julia);
    assert.equal(julia?.story, JULIA_STORY);
    assert.equal(computeAnswer(julia!), 2250);
    const spent = julia!.facts.filter((fact) => fact.id !== "moneder").reduce((sum, fact) => sum + fact.value, 0);
    assert.equal(spent, 1600);
    assert.equal(formatAmount(2250, true), "22,50 €");
    assert.equal(formatAmount(1600, true), "16,00 €");
    const onlySpent = problemById("w6-julia-gastat");
    assert.equal(computeAnswer(onlySpent!), 1600);
    assert.equal(onlySpent?.facts.find((fact) => fact.id === "moneder")?.useful, false);
  });

  it("accepts comma and dot euro input", () => {
    assert.equal(parseAmount("22,50", true), 2250);
    assert.equal(parseAmount("22,5", true), 2250);
    assert.equal(parseAmount("22.50", true), 2250);
    assert.equal(parseAmount(" 22,50 € ", true), 2250);
    assert.equal(sameAmount("16", 1600, true), true);
    assert.equal(parseAmount("12", false), 12);
    assert.equal(parseAmount("12,5", false), null);
    assert.equal(parseAmount("abc", true), null);
  });
});
