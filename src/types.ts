export type ChoiceQ = { k: "c"; p: string; e?: string; t?: string; a: string; o: string[] };
export type SpellQ = { k: "s"; p: string; e: string; w: string };
export type OrderQ = { k: "o"; p: string; e?: string; w: string[] };
export type Q = ChoiceQ | SpellQ | OrderQ;
export type World = { name: string; sub: string; icon: string; qs: Q[] };
export type Tile = { id: number; v: string };
export type Item = { q: Q; opts: string[]; tiles: Tile[] };

export type SavedRound = {
  worldIndex: number;
  round: Item[];
  idx: number;
  picked: string | null;
  built: number[];
  checked: boolean;
  ok: boolean;
  score: number;
  streak: number;
  earned: number;
};

export type PendingResult = {
  worldIndex: number;
  stars: number;
  score: number;
  total: number;
  unlocked: boolean;
  earned: number;
};

export type Profile = {
  id: string;
  name: string;
  avatar: string;
  stars: number[];
  coins: number;
  bestScores: number[];
  sound: boolean;
  round: SavedRound | null;
  pendingResult: PendingResult | null;
};

export type Store = {
  version: 1;
  profiles: Profile[];
};

export type Screen = "who" | "map" | "play" | "result";
