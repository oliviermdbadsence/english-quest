import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import manifest from "../src/audio-manifest.json" with { type: "json" };
import { answerSpeech, promptSpeech } from "../src/game.ts";
import { normKey } from "../src/speech.ts";
import { WORLDS } from "../src/worlds.ts";

const clips = manifest as Record<string, string>;

function speechLines(): string[] {
  const lines = new Set<string>();
  for (const world of WORLDS) {
    for (const question of world.qs) {
      const answer = answerSpeech(question);
      const prompt = promptSpeech(question);
      if (answer.trim()) lines.add(answer);
      if (prompt.trim()) lines.add(prompt);
    }
  }
  return [...lines];
}

describe("elevenlabs clips", () => {
  it("has a manifest file on disk for every answerSpeech and promptSpeech line", () => {
    const lines = speechLines();
    const misses = lines.filter((line) => {
      const file = clips[normKey(line)];
      return !file || !existsSync(path.join(process.cwd(), "public/audio", file));
    });
    assert.deepEqual(
      misses.map((line) => ({ line, key: normKey(line) })),
      [],
      "speech lines without a clip",
    );
    assert.ok(lines.length > 0);
  });

  it("normalizes the way the manifest was built", () => {
    assert.equal(normKey("  It’s sunny.\n"), "it's sunny");
    assert.equal(normKey("big — small…"), "big - small");
    assert.equal(normKey("It's ..."), "it's");
    assert.equal(clips[normKey("It's sunny.")]!.endsWith(".mp3"), true);
    assert.equal(clips[normKey("autumn")]!.endsWith(".mp3"), true);
    assert.equal(clips[normKey("I live in Spain.")]!.endsWith(".mp3"), true);
  });
});
