import type { ReactNode } from "react";
import { MorphRailDemo } from "./demos/MorphRailDemo";
import { OrbRatingDemo, OrbSearchDemo } from "./demos/OrbDemos";

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
      "A rating picker that rests as a seal showing the choice and opens into an engraved scale; the chosen numeral is stamped in the seal.",
    render: () => <OrbRatingDemo />,
    sourcePath: "src/components/components/library/OrbRating.tsx",
  },
];
