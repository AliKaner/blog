"use client";

import { useState } from "react";
import { OrbRating } from "../library/OrbRating";
import { OrbSearch } from "../library/OrbSearch";

const THEME = {
  accent: "var(--accent)",
  ink: "var(--ink)",
  muted: "var(--ink-soft)",
  surface: "var(--card)",
};

export function OrbSearchDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <OrbSearch value={value} onChange={setValue} label="Search films" placeholder="Search films…" theme={THEME} className="font-accent" />
      <p className="font-mono text-[11px] text-ink-soft">{value ? `searching for “${value}”` : "click the orb"}</p>
    </div>
  );
}

export function OrbRatingDemo() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <OrbRating value={value} onChange={setValue} label="Rating" theme={THEME} className="font-heading" />
      <p className="font-mono text-[11px] text-ink-soft">{value === null ? "all ratings" : `rated ${value}`}</p>
    </div>
  );
}
