"use client";

import { useRef } from "react";
import { CursorFan } from "../library/CursorFan";

/** The fan dressing just this plate, so the cursors can be tried here
    without touching the rest of the page. */
export function CursorFanDemo() {
  const area = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={area}
      className="relative flex h-60 flex-col justify-end gap-3 py-5"
    >
      <CursorFan
        target={area}
        label="Demo cursor"
        theme={{ accent: "var(--accent)", surface: "var(--card)" }}
        style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 5 }}
      />
      <p className="max-w-[16rem] font-accent text-base italic text-ink-soft">
        Open the rosette, pick a cursor, then move about this plate — over{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="link-ornate">
          a link
        </a>{" "}
        it turns over.
      </p>
      <input
        type="text"
        placeholder="…and text fields keep the caret"
        className="w-56 border-b border-border bg-transparent pb-1 font-accent italic text-ink outline-none placeholder:text-ink-soft"
      />
    </div>
  );
}
