import * as P from "parsimmon"

export interface Str {
  kind: "string",
  value: string
}

export interface List {
  kind: "list",
  value: Sexpr[]
}

export type Sexpr = Str | List;

export const str = (value: string): Str => {
  return {
    kind: "string",
    value
  };
}

export const list = (value: Sexpr[]): List => {
  return {
    kind: "list",
    value
  };
}

interface Lang {
  expr: Sexpr;
  str: Str;
  list: List;
}

export const parser = P.createLanguage<Lang>({
  expr: r => {
    return P.alt(r.list, r.str);
  },
  list: r => {
    return r.expr.trim(P.optWhitespace).many().wrap(P.string("("), P.string(")")).map(list);
  },
  str: r => {
    return P.regexp(/[a-zA-Z_-][a-zA-Z0-9_-]*/).map(str).desc("str")
  }
});

export const printSexpr = (expr: Sexpr): string => {
  if (expr.kind === "list") {
    return "(" + expr.value.map(printSexpr).join(" ") + ")";
  } else {
    return expr.value;
  }
}
