import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { buildRound, tilesFor } from "../src/game.ts";
import { makeProfile, migrate, loadStore, saveStore, STORAGE_KEY, LEGACY_KEY, SCHEMA_VERSION, isFutureVersion } from "../src/storage.ts";
import type { Item, Q, Store } from "../src/types.ts";
import { WORLDS } from "../src/worlds.ts";

function itemFor(question: Q): Item {
  if (question.k === "c") return { q: question, opts: [question.a, ...question.o], tiles: [] };
  if (question.k === "s") return { q: question, opts: [], tiles: tilesFor(question.w.split("")) };
  return { q: question, opts: [], tiles: tilesFor(question.w) };
}

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  });
});

describe("storage schema v1", () => {
  it("round-trips a profile, a half-finished round and a pending result", () => {
    const profile = makeProfile("Ana", "🦄", "ana");
    profile.stars[0] = 2;
    profile.coins = 40;
    profile.bestScores[0] = 9;
    profile.sound = false;
    profile.round = {
      worldIndex: 0,
      round: buildRound(0),
      idx: 3,
      picked: "fifteen",
      built: [],
      checked: true,
      ok: false,
      score: 2,
      streak: 0,
      earned: 20,
    };
    const store: Store = { version: SCHEMA_VERSION, profiles: [profile] };
    saveStore(store);
    const loaded = loadStore();
    assert.equal(loaded.status, "ready");
    if (loaded.status !== "ready") return;
    assert.deepEqual(loaded.store, store);

    loaded.store.profiles[0].pendingResult = {
      worldIndex: 1,
      stars: 1,
      score: 7,
      total: 10,
      unlocked: true,
      earned: 80,
    };
    loaded.store.profiles[0].round = null;
    saveStore(loaded.store);
    const again = loadStore();
    assert.equal(again.status, "ready");
    if (again.status !== "ready") return;
    assert.deepEqual(again.store.profiles[0].pendingResult, loaded.store.profiles[0].pendingResult);
  });

  it("imports the legacy single-progress blob once", () => {
    memory.set(LEGACY_KEY, JSON.stringify({ stars: [3, 1, 0, 0, 0, 0, 0, 0], coins: 55 }));
    const loaded = loadStore();
    assert.equal(loaded.status, "ready");
    if (loaded.status !== "ready") return;
    assert.equal(loaded.store.profiles.length, 1);
    assert.equal(loaded.store.profiles[0].name, "Jugador");
    assert.equal(loaded.store.profiles[0].id, "legacy-player");
    assert.deepEqual(loaded.store.profiles[0].stars, [3, 1, 0, 0, 0, 0, 0, 0]);
    assert.equal(loaded.store.profiles[0].coins, 55);
    assert.equal(JSON.parse(memory.get(STORAGE_KEY) ?? "{}").version, 1);
    memory.set(LEGACY_KEY, JSON.stringify({ stars: [0, 0, 0, 0, 0, 0, 0, 0], coins: 1 }));
    const second = loadStore();
    if (second.status !== "ready") return;
    assert.equal(second.store.profiles[0].coins, 55);
  });

  it("repairs a short star row and drops a broken round", () => {
    const migrated = migrate({
      version: 1,
      profiles: [
        {
          id: "leo",
          name: "Leo",
          avatar: "🦊",
          stars: [2],
          coins: 10,
          round: { worldIndex: 0, round: [], idx: 0 },
        },
      ],
    });
    assert.ok(migrated);
    assert.deepEqual(migrated?.profiles[0].stars, [2, 0, 0, 0, 0, 0, 0, 0]);
    assert.deepEqual(migrated?.profiles[0].bestScores, [0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(migrated?.profiles[0].round, null);
    assert.equal(migrated?.profiles[0].sound, true);
  });

  it("round-trips every question in the eight banks", () => {
    const items: Item[] = [];
    for (const world of WORLDS) {
      for (const question of world.qs) items.push(itemFor(question));
    }
    while (items.length % 10 !== 0) items.push(items[0]);
    const profile = makeProfile("Nia", "🐸", "nia");
    profile.round = {
      worldIndex: 0,
      round: items.slice(0, 10),
      idx: 0,
      picked: null,
      built: [],
      checked: false,
      ok: false,
      score: 0,
      streak: 0,
      earned: 0,
    };
    for (let start = 0; start < items.length; start += 10) {
      profile.round.round = items.slice(start, start + 10);
      saveStore({ version: SCHEMA_VERSION, profiles: [profile] });
      const loaded = loadStore();
      assert.equal(loaded.status, "ready");
      if (loaded.status !== "ready") return;
      assert.deepEqual(loaded.store.profiles[0].round?.round, profile.round.round, "chunk " + start);
    }
  });

  it("does not overwrite a newer schema", () => {
    const raw = JSON.stringify({ version: 9, profiles: [{ id: "future", name: "Nia" }] });
    memory.set(STORAGE_KEY, raw);
    assert.equal(isFutureVersion(JSON.parse(raw)), true);
    const loaded = loadStore();
    assert.equal(loaded.status, "future");
    assert.equal(memory.get(STORAGE_KEY), raw);
  });
});
