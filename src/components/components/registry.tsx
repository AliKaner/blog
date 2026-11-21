import type { ReactNode } from "react";
import { CursorFanDemo } from "./demos/CursorFanDemo";
import { MorphRailDemo } from "./demos/MorphRailDemo";
import { OrbRatingDemo, OrbSearchDemo } from "./demos/OrbDemos";
import { YearHeatmapDemo } from "./demos/YearHeatmapDemo";

export type ComponentEntry = {
  title: string;
  description?: string;
  /** Live preview. */
  render: () => ReactNode;
  /** Project-relative path of the self-contained component file that the
      copy button hands out (read at build time). */
  sourcePath: string;
};

// Each entry gets a live preview and a copy button on /components. Keep the
// file at `sourcePath` standalone — that exact file is what gets copied.
export const componentRegistry: ComponentEntry[] = [
  {
    title: "Morph Rail",
    description:
      "The site's sidebar. Hover a row: the icon stretches out with its label inside a glass bulge that grows from the rail — two layers morphing together.",
    render: () => <MorphRailDemo />,
    sourcePath: "src/components/components/library/MorphRail.tsx",
  },
  {
    title: "Orb Search",
    description:
      "A search field that rests as a sealed lens and slides open into an inscribed line — italic text over a double rule that draws itself in.",
    render: () => <OrbSearchDemo />,
    sourcePath: "src/components/components/library/OrbSearch.tsx",
  },
  {
    title: "Orb Rating",
    description:
      "A rating picker that rests as a seal showing the choice and opens into an engraved half-dial — numerals round a double-ruled arc and a needle that swings to the one you point at.",
    render: () => <OrbRatingDemo />,
    sourcePath: "src/components/components/library/OrbRating.tsx",
  },
  {
    title: "Cursor Fan",
    description:
      "A cursor picker: a rosette medallion that fans engraved cursors out along an arc — a hatched stylus, a spear and a quill, each turning over in reverse on anything clickable.",
    render: () => <CursorFanDemo />,
    sourcePath: "src/components/components/library/CursorFan.tsx",
  },
  {
    title: "Year Heatmap",
    description:
      "A year-by-year activity grid, one square per week. Hover a week for an engraved card — its number, dates, a count, a breakdown by kind and the entries themselves.",
    render: () => <YearHeatmapDemo />,
    sourcePath: "src/components/components/library/YearHeatmap.tsx",
  },
];
