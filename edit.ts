import { Sexpr, List, list, printSexpr } from "./parse"

export interface Zipper {
  lefts: Sexpr[];
  focus: Sexpr;
  rights: Sexpr[];
  parent: ((a: Sexpr) => Zipper) | undefined
}

export interface Ok<A> {
  kind: "ok",
  result: A
}

export interface Bad {
  kind: "bad",
  message: string
}

export type Result<A> = Ok<A> | Bad

export const ok = <A>(result: A): Ok<A> => ({ kind: "ok", result })
export const bad = (message: string): Bad => ({ kind: "bad", message })

export const zip = ({ value: [focus, ...rights] }: List, parent?: Zipper["parent"]): Zipper => {
  rights.reverse();
  return {
    lefts: [],
    focus: focus,
    rights: rights,
    parent
  }
}

export const rebuildOne = ({lefts, focus, rights}: Zipper): List => {
  const rights2 = [...rights];
  rights2.reverse();
  return list(lefts.concat([focus]).concat(rights2));
}

export type ZipperMove = (zip: Zipper) => Result<Zipper>

export const set = ({lefts, rights, parent}: Zipper, focus: Sexpr): Zipper => {
  return { lefts, focus, rights, parent };
}

export const down = ({lefts, focus, rights, parent}: Zipper): Result<Zipper> => {
  if (focus.kind === "string") {
    return bad(`cannot descend into ${focus.value}`);
  } 
  return ok(zip(focus, focus => ({ lefts, focus, rights, parent })));
}

export const up = (zip: Zipper): Result<Zipper> => {
  const {parent} = zip;
  return parent ? ok(parent(rebuildOne(zip))) : bad("cannot ascent any further");
}

export const left = ({lefts, focus, rights, parent}: Zipper): Result<Zipper> => {
  if (!lefts.length) {
    return bad("cannot move any farther left");
  }
  
  const first = lefts[lefts.length - 1];
  const rest = [...lefts].slice(0, lefts.length - 1);
  return ok({lefts: rest, focus: first, rights: [...rights, focus], parent});
}

export const right = ({lefts, focus, rights, parent}: Zipper): Result<Zipper> => {
  if (!right.length) {
    return bad("cannot move any farther left");
  }
  
  const first = rights[rights.length - 1];
  const rest = [...rights].slice(0, rights.length - 1);
  return ok({lefts: [...lefts, focus], focus: first, rights: rest, parent});
}

export const printZipper = ({lefts, focus, rights}: Zipper): string => {
  const rights2 = [...rights];
  rights2.reverse();
  return `${lefts.map(printSexpr).join("\n")}
>>>>> ${printSexpr(focus)}
${rights2.map(printSexpr).join("\n")}`;
}
