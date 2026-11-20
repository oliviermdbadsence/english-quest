import type { Item, Q, Tile } from "./types";
import { WORLDS } from "./worlds";

export const PER_ROUND = 10;

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function tilesFor(vals: string[]): Tile[] {
  const base = vals.map((v: string, i: number) => ({ id: i, v }));
  let s = shuffle(base);
  let tries = 0;
  while (tries < 12 && s.map((t: Tile) => t.v).join("|") === vals.join("|")) {
    s = shuffle(base);
    tries++;
  }
  return s;
}

export function buildRound(wi: number): Item[] {
  return shuffle(WORLDS[wi].qs).slice(0, PER_ROUND).map((q: Q) => ({
    q,
    opts: q.k === "c" ? shuffle([q.a].concat(q.o)) : [],
    tiles: q.k === "s" ? tilesFor(q.w.split("")) : q.k === "o" ? tilesFor(q.w) : [],
  }));
}

export function answerText(q: Q): string {
  if (q.k === "c") return q.a;
  if (q.k === "s") return q.w;
  return q.w.join(" ");
}

export function answerSpeech(q: Q): string {
  if (q.k === "c") {
    if (q.t && q.t.indexOf("___") >= 0) return q.t.replace("___", q.a).replace("↔", ",");
    return q.a;
  }
  if (q.k === "s") return q.w.toLowerCase();
  return q.w.join(" ");
}

export function promptSpeech(q: Q): string {
  if (q.k === "c" && q.t) return q.t.replace("___", "...").replace("↔", ",");
  if (q.k === "s") return q.w.toLowerCase();
  return "";
}

export function builtText(item: Item, built: number[]): string {
  const sep = item.q.k === "s" ? "" : " ";
  const vals = built.map((id) => item.tiles.find((t) => t.id === id)?.v ?? "");
  return vals.join(sep);
}

export function isBuiltCorrect(item: Item, built: number[]): boolean {
  return builtText(item, built) === answerText(item.q);
}

/** 10/10 = 3, 8–9 = 2, 7 = 1, below 7 = 0. Ratios match a 10-question round. */
export function starsFor(score: number, total: number): number {
  const r = total > 0 ? score / total : 0;
  if (r >= 1) return 3;
  if (r >= 0.8) return 2;
  if (r >= 0.7) return 1;
  return 0;
}

export function starRow(n: number): string {
  const clamped = Math.max(0, Math.min(3, Math.floor(n)));
  return "⭐".repeat(clamped) + "☆".repeat(3 - clamped);
}

export function isUnlocked(stars: number[], i: number): boolean {
  return i === 0 || (stars[i - 1] ?? 0) > 0;
}

export function coinsForAnswer(streakBefore: number, correct: boolean): { streak: number; gain: number } {
  if (!correct) return { streak: 0, gain: 0 };
  const streak = streakBefore + 1;
  return { streak, gain: 10 + (streak >= 3 ? 5 : 0) };
}

export function totalStars(stars: number[]): number {
  return stars.reduce((a, b) => a + b, 0);
}
