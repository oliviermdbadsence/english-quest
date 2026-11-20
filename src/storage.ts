import { PER_ROUND } from "./game";
import type { Item, PendingResult, Profile, Q, SavedRound, Store, Tile } from "./types";
import { WORLDS } from "./worlds";

/**
 * On-device save schema.
 *
 * v1 (key `english-quest`):
 * `{ version: 1, profiles: Profile[] }`
 * Profile fields: id, name, avatar, stars[8], coins, bestScores[8],
 * sound, round | null, pendingResult | null.
 *
 * Legacy key `english-quest-v1` held one shared `{ stars, coins }` progress
 * blob from the canvas prototype. It is imported once as a profile named
 * "Jugador" and left in place. The new key is preferred after that.
 *
 * A stored `version` greater than SCHEMA_VERSION is left untouched.
 */
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "english-quest";
export const LEGACY_KEY = "english-quest-v1";
const BACKUP_KEY = "english-quest-unreadable";

export type LoadResult = { status: "ready"; store: Store } | { status: "future" };

export function emptyStore(): Store {
  return { version: SCHEMA_VERSION, profiles: [] };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function makeProfile(name: string, avatar: string, id = newId()): Profile {
  return {
    id,
    name,
    avatar,
    stars: Array.from({ length: WORLDS.length }, () => 0),
    coins: 0,
    bestScores: Array.from({ length: WORLDS.length }, () => 0),
    sound: true,
    round: null,
    pendingResult: null,
  };
}

export function isFutureVersion(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const version = (raw as { version?: unknown }).version;
  return typeof version === "number" && version > SCHEMA_VERSION;
}

export function migrate(raw: unknown): Store | null {
  if (!raw || typeof raw !== "object") return null;
  if (isFutureVersion(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version === SCHEMA_VERSION) return migrateV1(o);
  if (o.version === undefined && Array.isArray(o.stars) && typeof o.coins === "number") return legacyProgressToStore(o);
  return null;
}

export function updateProfile(store: Store, id: string, fn: (profile: Profile) => Profile): Store {
  return {
    version: SCHEMA_VERSION,
    profiles: store.profiles.map((profile) => (profile.id === id ? fn(profile) : profile)),
  };
}

export function removeProfile(store: Store, id: string): Store {
  return { version: SCHEMA_VERSION, profiles: store.profiles.filter((profile) => profile.id !== id) };
}

function browserStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
}

export function loadStore(): LoadResult {
  const storage = browserStorage();
  if (!storage) return { status: "ready", store: emptyStore() };
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "ready", store: emptyStore() };
  }
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isFutureVersion(parsed)) return { status: "future" };
      const store = migrate(parsed);
      if (store) return { status: "ready", store };
      backupUnreadable(raw);
    } catch {
      backupUnreadable(raw);
    }
  }
  const legacy = readLegacy();
  if (legacy) {
    saveStore(legacy);
    return { status: "ready", store: legacy };
  }
  return { status: "ready", store: emptyStore() };
}

export function saveStore(store: Store): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage not available */
  }
}

function readLegacy(): Store | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(LEGACY_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function backupUnreadable(raw: string): void {
  const storage = browserStorage();
  if (!storage) return;
  try {
    if (!storage.getItem(BACKUP_KEY)) storage.setItem(BACKUP_KEY, raw);
  } catch {
    /* storage not available */
  }
}

function migrateV1(o: Record<string, unknown>): Store | null {
  if (!Array.isArray(o.profiles)) return null;
  const profiles: Profile[] = [];
  for (const entry of o.profiles) {
    const profile = repairProfile(entry);
    if (!profile) continue;
    if (profiles.some((existing) => existing.id === profile.id)) continue;
    profiles.push(profile);
  }
  return { version: SCHEMA_VERSION, profiles };
}

function legacyProgressToStore(o: Record<string, unknown>): Store | null {
  if (!Array.isArray(o.stars) || typeof o.coins !== "number" || !Number.isFinite(o.coins)) return null;
  const profile = makeProfile("Jugador", "🚀", "legacy-player");
  profile.stars = repairNumberRow(o.stars, 3);
  profile.coins = clampInt(o.coins, 0, 1_000_000);
  return { version: SCHEMA_VERSION, profiles: [profile] };
}

function repairProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length < 1 || o.id.length > 80) return null;
  if (typeof o.name !== "string") return null;
  const name = o.name.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
  if (!name) return null;
  if (typeof o.avatar !== "string" || o.avatar.length < 1 || o.avatar.length > 16) return null;
  const coins = typeof o.coins === "number" && Number.isFinite(o.coins) ? clampInt(o.coins, 0, 1_000_000) : 0;
  return {
    id: o.id,
    name,
    avatar: o.avatar,
    stars: repairNumberRow(o.stars, 3),
    coins,
    bestScores: repairNumberRow(o.bestScores, PER_ROUND),
    sound: o.sound === false ? false : true,
    round: repairRound(o.round),
    pendingResult: repairPending(o.pendingResult),
  };
}

function repairNumberRow(raw: unknown, max: number): number[] {
  const out = Array.from({ length: WORLDS.length }, () => 0);
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < WORLDS.length && i < raw.length; i++) {
    const value = raw[i];
    if (typeof value === "number" && Number.isFinite(value)) out[i] = clampInt(value, 0, max);
  }
  return out;
}

function repairRound(raw: unknown): SavedRound | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const worldIndex = intIn(o.worldIndex, 0, WORLDS.length - 1);
  if (worldIndex === null || !Array.isArray(o.round) || o.round.length !== PER_ROUND) return null;
  const round: Item[] = [];
  for (const entry of o.round) {
    const item = repairItem(entry);
    if (!item) return null;
    round.push(item);
  }
  const idx = intIn(o.idx, 0, round.length - 1);
  const score = intIn(o.score, 0, PER_ROUND);
  const streak = intIn(o.streak, 0, PER_ROUND);
  const earned = intIn(o.earned, 0, PER_ROUND * 15);
  if (idx === null || score === null || streak === null || earned === null) return null;
  if (!Array.isArray(o.built) || o.built.some((id) => typeof id !== "number" || !Number.isInteger(id))) return null;
  const built = o.built as number[];
  const item = round[idx];
  if (built.length > item.tiles.length) return null;
  if (new Set(built).size !== built.length) return null;
  if (built.some((id) => !item.tiles.some((tile) => tile.id === id))) return null;
  let picked: string | null;
  if (o.picked === null || o.picked === undefined) picked = null;
  else if (typeof o.picked === "string") picked = o.picked;
  else return null;
  const checked = o.checked === true;
  return { worldIndex, round, idx, picked, built, checked, ok: checked && o.ok === true, score, streak, earned };
}

function repairItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const q = repairQuestion(o.q);
  if (!q) return null;
  if (!Array.isArray(o.opts) || o.opts.some((option) => typeof option !== "string")) return null;
  if (!Array.isArray(o.tiles)) return null;
  const opts = o.opts as string[];
  const tiles: Tile[] = [];
  for (const entry of o.tiles) {
    if (!entry || typeof entry !== "object") return null;
    const tile = entry as Record<string, unknown>;
    if (typeof tile.id !== "number" || !Number.isInteger(tile.id) || typeof tile.v !== "string") return null;
    tiles.push({ id: tile.id, v: tile.v });
  }
  if (new Set(tiles.map((tile) => tile.id)).size !== tiles.length) return null;
  if (q.k === "c") {
    const expected = [q.a, ...q.o];
    if (opts.length !== expected.length || [...opts].sort().join("\0") !== [...expected].sort().join("\0")) return null;
    if (tiles.length !== 0) return null;
  } else if (q.k === "s") {
    if (opts.length !== 0) return null;
    const letters = q.w.split("");
    if (tiles.length !== letters.length || tiles.map((tile) => tile.v).sort().join("") !== [...letters].sort().join("")) return null;
  } else if (opts.length !== 0 || tiles.length !== q.w.length || tiles.map((tile) => tile.v).sort().join("\0") !== [...q.w].sort().join("\0")) {
    return null;
  }
  return { q, opts, tiles };
}

function repairQuestion(raw: unknown): Q | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.p !== "string" || o.p.length < 1 || o.p.length > 200) return null;
  const emoji = optionalText(o.e, 32);
  if (!emoji.ok) return null;
  if (o.k === "c") {
    const sentence = optionalText(o.t, 200);
    if (!sentence.ok || typeof o.a !== "string" || o.a.length < 1 || o.a.length > 80) return null;
    if (!Array.isArray(o.o) || o.o.length < 1 || o.o.length > 6 || o.o.some((option) => typeof option !== "string" || option.length < 1 || option.length > 80)) return null;
    return { k: "c", p: o.p, e: emoji.value, t: sentence.value, a: o.a, o: o.o as string[] };
  }
  if (o.k === "s") {
    if (!emoji.value || typeof o.w !== "string" || o.w.length < 1 || o.w.length > 24) return null;
    return { k: "s", p: o.p, e: emoji.value, w: o.w };
  }
  if (o.k === "o") {
    if (!Array.isArray(o.w) || o.w.length < 2 || o.w.length > 12 || o.w.some((word) => typeof word !== "string" || word.length < 1 || word.length > 40)) return null;
    return { k: "o", p: o.p, e: emoji.value, w: o.w as string[] };
  }
  return null;
}

function repairPending(raw: unknown): PendingResult | null {
  if (raw === null || raw === undefined) return null;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const worldIndex = intIn(o.worldIndex, 0, WORLDS.length - 1);
  const total = intIn(o.total, 1, PER_ROUND);
  const score = total === null ? null : intIn(o.score, 0, total);
  const stars = intIn(o.stars, 0, 3);
  const earned = intIn(o.earned, 0, PER_ROUND * 15);
  if (worldIndex === null || total === null || score === null || stars === null || earned === null) return null;
  if (typeof o.unlocked !== "boolean") return null;
  return { worldIndex, total, score, stars, earned, unlocked: o.unlocked };
}

function optionalText(value: unknown, max: number): { ok: true; value?: string } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true };
  if (typeof value !== "string" || value.length > max) return { ok: false };
  return { ok: true, value };
}

function intIn(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
