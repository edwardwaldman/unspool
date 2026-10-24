// A tiny, safe math-expression compiler for plotted graphs (no eval / Function).
// Grammar: expr := term (("+"|"-") term)* ; term := unary (("*"|"/"|implicit) unary)* ;
// unary := ("+"|"-") unary | power ; power := atom ("^" unary)? ; atom := number | x | pi | e | fn "(" expr ")" | "(" expr ")" | "|" expr "|"

export type Fn = (x: number) => number;

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs,
  log: Math.log10, ln: Math.log, exp: Math.exp, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sec: (v) => 1 / Math.cos(v), csc: (v) => 1 / Math.sin(v), cot: (v) => 1 / Math.tan(v),
  floor: Math.floor, ceil: Math.ceil, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
};
const CONSTS: Record<string, number> = { pi: Math.PI, "π": Math.PI, e: Math.E };

type Tok = { k: "num"; v: number } | { k: "id"; v: string } | { k: "op"; v: string };

function tokenize(src: string): Tok[] | null {
  const s = src.replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/÷/g, "/").replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^").toLowerCase();
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
    if (num && /[\d.]/.test(c)) { out.push({ k: "num", v: parseFloat(num[0]) }); i += num[0].length; continue; }
    const id = /^([a-z]+|π)/.exec(s.slice(i));
    if (id) {
      // Split runs like "xsin" / "2pix" into known names, longest first.
      let w = id[0];
      while (w) {
        const name = [...Object.keys(FUNCS), ...Object.keys(CONSTS), "x"].sort((a, b) => b.length - a.length).find((n) => w.startsWith(n));
        if (!name) return null;
        out.push({ k: "id", v: name });
        w = w.slice(name.length);
      }
      i += id[0].length;
      continue;
    }
    if ("+-*/^()|".includes(c)) { out.push({ k: "op", v: c }); i++; continue; }
    return null;
  }
  return out;
}

/** Compile an expression in x. Returns null for anything it can't parse (never throws, never evaluates code). */
export function compileExpr(src: string): Fn | null {
  if (typeof src !== "string" || src.length > 200) return null;
  const parsed = tokenize(src);
  if (!parsed || !parsed.length) return null;
  const toks: Tok[] = parsed;
  let p = 0;
  let absDepth = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === "op" && peek()!.v === v;
  const fail = () => { throw new Error("parse"); };

  const startsAtom = (t: Tok | undefined) => !!t && (t.k === "num" || t.k === "id" || (t.k === "op" && (t.v === "(" || (t.v === "|" && absDepth === 0))));

  function expr(): Fn {
    let l = term();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++].v, a = l, b = term();
      l = op === "+" ? (x) => a(x) + b(x) : (x) => a(x) - b(x);
    }
    return l;
  }
  function term(): Fn {
    let l = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[p++].v, a = l, b = unary();
        l = op === "*" ? (x) => a(x) * b(x) : (x) => a(x) / b(x);
      } else if (startsAtom(peek())) {
        const a = l, b = power(); // implicit multiplication: 2x, 3sin(x), (x+1)(x-1)
        l = (x) => a(x) * b(x);
      } else return l;
    }
  }
  function unary(): Fn {
    if (isOp("-")) { p++; const a = unary(); return (x) => -a(x); }
    if (isOp("+")) { p++; return unary(); }
    return power();
  }
  function power(): Fn {
    const base = atom();
    if (isOp("^")) { p++; const ex = unary(); return (x) => Math.pow(base(x), ex(x)); }
    return base;
  }
  function atom(): Fn {
    const t = toks[p++];
    if (!t) return fail();
    if (t.k === "num") { const v = t.v; return () => v; }
    if (t.k === "id") {
      if (t.v === "x") return (x) => x;
      if (t.v in CONSTS) { const v = CONSTS[t.v]; return () => v; }
      const f = FUNCS[t.v];
      if (!f) return fail();
      // sin x / sin(x) / sin^2(x)
      let pow: Fn | null = null;
      if (isOp("^")) { p++; pow = atom(); }
      const arg = isOp("(") ? atom() : power();
      return pow ? (x) => Math.pow(f(arg(x)), pow!(x)) : (x) => f(arg(x));
    }
    if (t.v === "(") { const e = expr(); if (!isOp(")")) fail(); p++; return e; }
    if (t.v === "|") { absDepth++; const e = expr(); absDepth--; if (!isOp("|")) fail(); p++; return (x) => Math.abs(e(x)); }
    return fail();
  }
  try {
    const f = expr();
    if (p !== toks.length) return null;
    return (x) => {
      const y = f(x);
      return Number.isFinite(y) ? y : NaN;
    };
  } catch {
    return null;
  }
}

export type Piece = { expr: string; from: number; to: number };

/** A piecewise function: the first piece whose [from, to] holds x (NaN outside every piece). */
export function compilePiecewise(pieces: Piece[]): ((x: number) => number) | null {
  const fs = pieces.map((pc) => ({ f: compileExpr(pc.expr), from: Math.min(pc.from, pc.to), to: Math.max(pc.from, pc.to) })).filter((pc) => pc.f);
  if (!fs.length) return null;
  return (x) => {
    for (const pc of fs) if (x >= pc.from && x <= pc.to) return pc.f!(x);
    return NaN;
  };
}
