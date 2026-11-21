"use client";

import { useState } from "react";
import { Bell, CalendarDays, House, Search, Settings } from "lucide-react";
import { MorphRail, type MorphRailItem } from "../library/MorphRail";

const ICON = { strokeWidth: 1.75 } as const;

const ITEMS: MorphRailItem[] = [
  { id: "home", label: "Home", icon: <House {...ICON} /> },
  { id: "search", label: "Search", icon: <Search {...ICON} /> },
  { id: "inbox", label: "Notifications", icon: <Bell {...ICON} /> },
  { id: "calendar", label: "Calendar", icon: <CalendarDays {...ICON} /> },
  { id: "settings", label: "Settings", icon: <Settings {...ICON} /> },
];

/** The rail with buttons instead of links: clicking just moves the
    "current" marker. Leaves room on the right for the label to open. */
export function MorphRailDemo() {
  const [active, setActive] = useState("home");
  return (
    <div style={{ paddingRight: "9rem" }}>
      <MorphRail
        items={ITEMS}
        activeId={active}
        onSelect={setActive}
        side="right"
        theme={{
          surface: "color-mix(in srgb, #fff 55%, var(--card))",
          ink: "var(--ink-soft)",
          accent: "var(--accent)",
          accentStrong: "var(--accent-2)",
          onAccent: "var(--paper)",
        }}
        aria-label="Demo navigation"
      />
    </div>
  );
}
