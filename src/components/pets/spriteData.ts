// Tiny hand-authored pixel sprites, one grid per animal per animation frame.
// Each grid is an array of rows; each row is a string of palette-key characters.
// '.' is transparent. All grids for one animal share the same dimensions.

export type PetKind = "cat" | "dog" | "bird";
export type Frame = "idle" | "walk1" | "walk2" | "eat";

type SpriteSet = Record<Frame, string[]>;

const PALETTES: Record<PetKind, Record<string, string>> = {
  cat: {
    o: "#12040f",
    b: "#ff2bd6",
    d: "#c400a6",
    c: "#ffb3f0",
    e: "#0a0210",
    p: "#21e6ff",
  },
  dog: {
    o: "#031208",
    b: "#39ff8f",
    d: "#0fcf6b",
    c: "#c8ffe2",
    e: "#031208",
    p: "#21e6ff",
  },
  bird: {
    o: "#031320",
    b: "#21e6ff",
    d: "#0aa8c9",
    c: "#c6f7ff",
    e: "#031320",
    p: "#ff2bd6",
  },
};

const CAT: SpriteSet = {
  idle: [
    "..o....o..",
    ".od.o.o.do",
    ".obbbbbbo.",
    "obbbbbbbbo",
    "obeobbeobo",
    "obbbbbbbbo",
    "obbccccbbo",
    ".obcccbo..",
    "..o...o...",
    "..........",
  ],
  walk1: [
    "..o....o..",
    ".od.o.o.do",
    ".obbbbbbo.",
    "obbbbbbbbo",
    "obeobbeobo",
    "obbbbbbbbo",
    "obbccccbbo",
    "..obc.o...",
    "..o...bo..",
    "..........",
  ],
  walk2: [
    "..o....o..",
    ".od.o.o.do",
    ".obbbbbbo.",
    "obbbbbbbbo",
    "obeobbeobo",
    "obbbbbbbbo",
    "obbccccbbo",
    ".obc.o....",
    "..o...bo..",
    "..........",
  ],
  eat: [
    "..........",
    "..........",
    ".od.o.o.do",
    ".obbbbbbo.",
    "obbbbbbbbo",
    "obeobbeobo",
    "obbppbbbo.",
    "obbccccbbo",
    ".obcccbo..",
    "..o...o...",
  ],
};

const DOG: SpriteSet = {
  idle: [
    "..........",
    "od......do",
    "obo....obo",
    "obbbbbbbo.",
    "bbbbbbbbb.",
    "beobbeobb.",
    "bbbbbbppb.",
    "obbccccbo.",
    ".obcccbo..",
    "..o...o...",
  ],
  walk1: [
    "..........",
    "od......do",
    "obo....obo",
    "obbbbbbbo.",
    "bbbbbbbbb.",
    "beobbeobb.",
    "bbbbbbppb.",
    "obbccccbo.",
    "..obc.o...",
    "..o...bo..",
  ],
  walk2: [
    "..........",
    "od......do",
    "obo....obo",
    "obbbbbbbo.",
    "bbbbbbbbb.",
    "beobbeobb.",
    "bbbbbbppb.",
    "obbccccbo.",
    ".obc.o....",
    "..o...bo..",
  ],
  eat: [
    "..........",
    "..........",
    "od......do",
    "obbbbbbbo.",
    "bbbbbbbbb.",
    "beobbeobb.",
    "bbppppppb.",
    "obbccccbo.",
    ".obcccbo..",
    "..o...o...",
  ],
};

const BIRD: SpriteSet = {
  idle: [
    "..........",
    "...oooo...",
    "..obbbbo..",
    ".obbebbbok",
    ".obbbbbbo.",
    "odbbbbbbo.",
    ".obccccbo.",
    "..obbbbo..",
    "...o..o...",
    "..........",
  ],
  walk1: [
    "..........",
    "...oooo...",
    "..obbbbo..",
    ".obbebbbok",
    ".obbbbbbo.",
    "odbbbbbbo.",
    ".obccccbo.",
    "..obbbbo..",
    "..o....o..",
    "..........",
  ],
  walk2: [
    "..........",
    "...oooo...",
    "..obbbbo..",
    ".obbebbbok",
    ".odbbbbbo.",
    ".obbbbbbo.",
    ".obccccbo.",
    "..obbbbo..",
    ".o....o...",
    "..........",
  ],
  eat: [
    "..........",
    "..........",
    "...oooo...",
    "..obbbbo..",
    ".obbebbbo.",
    "odbbbbbbok",
    ".obccccbo.",
    "..obbbbo..",
    "...o..o...",
    "..........",
  ],
};

const SPRITES: Record<PetKind, SpriteSet> = { cat: CAT, dog: DOG, bird: BIRD };

export function getSprite(kind: PetKind, frame: Frame): string[] {
  return SPRITES[kind][frame];
}

export function getPalette(kind: PetKind): Record<string, string> {
  return PALETTES[kind];
}

export const SPRITE_COLS = 10;
export const SPRITE_ROWS = 10;
