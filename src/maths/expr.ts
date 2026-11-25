export type Fact = { id: string; text: string; value: number; useful: boolean };

export type Expr =
  | { op: "add"; ids: string[] }
  | { op: "sub"; a: string; b: string }
  | { op: "mul"; a: string; b: string }
  | { op: "div"; a: string; b: string }
  | { op: "add-sub"; add: string[]; sub: string }
  | { op: "sub-add"; a: string; b: string; c: string }
  | { op: "sub-sub"; a: string; b: string; c: string }
  | { op: "sub-sum"; from: string; subtract: string[] }
  | { op: "mul-sub"; groups: string; size: string; sub: string };

export type Opt = { text: string; ok: boolean; hint: string };

export type Problem = {
  id: string;
  story: string;
  facts: Fact[];
  questions: Opt[];
  plans: Opt[];
  expr: Expr;
  money: boolean;
  sentences: Opt[];
  traps: { value: number; hint: string }[];
  numberHint: string;
  dataHint: string;
};

export type MathsWorld = {
  name: string;
  sub: string;
  icon: string;
  problems: Problem[];
};

export function exprFactIds(expr: Expr): string[] {
  switch (expr.op) {
    case "add":
      return expr.ids;
    case "sub":
    case "mul":
    case "div":
      return [expr.a, expr.b];
    case "add-sub":
      return [...expr.add, expr.sub];
    case "sub-add":
    case "sub-sub":
      return [expr.a, expr.b, expr.c];
    case "sub-sum":
      return [expr.from, ...expr.subtract];
    case "mul-sub":
      return [expr.groups, expr.size, expr.sub];
  }
}

export function computeAnswer(problem: Problem): number {
  const value = (id: string) => {
    const fact = problem.facts.find((item) => item.id === id);
    if (!fact) throw new Error(problem.id + " no té la dada " + id);
    return fact.value;
  };
  const expr = problem.expr;
  switch (expr.op) {
    case "add":
      return expr.ids.reduce((sum, id) => sum + value(id), 0);
    case "sub":
      return value(expr.a) - value(expr.b);
    case "mul":
      return value(expr.a) * value(expr.b);
    case "div": {
      const a = value(expr.a);
      const b = value(expr.b);
      if (b === 0 || a % b !== 0) throw new Error(problem.id + " no es reparteix exacte");
      return a / b;
    }
    case "add-sub":
      return expr.add.reduce((sum, id) => sum + value(id), 0) - value(expr.sub);
    case "sub-add":
      return value(expr.a) - value(expr.b) + value(expr.c);
    case "sub-sub":
      return value(expr.a) - value(expr.b) - value(expr.c);
    case "sub-sum":
      return value(expr.from) - expr.subtract.reduce((sum, id) => sum + value(id), 0);
    case "mul-sub":
      return value(expr.groups) * value(expr.size) - value(expr.sub);
  }
}

export function formatAmount(value: number, money: boolean): string {
  if (!money) return String(value);
  const negative = value < 0;
  const abs = Math.abs(Math.round(value));
  const euros = Math.floor(abs / 100);
  const cents = abs % 100;
  return (negative ? "-" : "") + euros + "," + String(cents).padStart(2, "0") + " €";
}

export function parseAmount(input: string, money: boolean): number | null {
  const cleaned = input.trim().toLowerCase().replace(/€/g, "").replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  if (money) return Math.round(parsed * 100 + 1e-6);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export function sameAmount(input: string, value: number, money: boolean): boolean {
  const parsed = parseAmount(input, money);
  return parsed === value;
}
