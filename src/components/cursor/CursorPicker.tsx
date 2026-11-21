"use client";

import { CursorFan } from "@/components/components/library/CursorFan";

/* The site's cursor picker: the copyable CursorFan (see /components),
   pinned top-right with a Medusa medallion cut from an engraving
   (scripts/cut-fragments.mjs). Desktop only — below md the nav rail owns
   the right edge, and touch screens have no cursor anyway. */
export function CursorPicker() {
  return (
    <CursorFan
      storageKey="cursor"
      className="hidden md:block"
      style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 60 }}
      theme={{ accent: "var(--accent)", surface: "var(--card)" }}
      // eslint-disable-next-line @next/next/no-img-element
      medallion={<img src="/decor/fragments/medusa.webp" alt="" />}
    />
  );
}
