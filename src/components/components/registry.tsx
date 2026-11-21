import type { ReactNode } from "react";

export type ComponentEntry = {
  title: string;
  description?: string;
  render: () => ReactNode;
};

// Add your own components here — each entry gets a live preview on
// /components. `render` just returns the JSX to show off.
export const componentRegistry: ComponentEntry[] = [];
