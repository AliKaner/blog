import { CopyOrb } from "./CopyOrb";
import type { ComponentEntry } from "./registry";

export type ShowcaseEntry = ComponentEntry & { source: string };

/** Each component stands straight on the page — no card around it: a small
    heading with a copy orb, a line of description, then the live piece. */
export function ComponentsGrid({ entries }: { entries: ShowcaseEntry[] }) {
  return (
    <div className="flex flex-col gap-16">
      {entries.map((entry) => (
        <section key={entry.title}>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base text-ink">{entry.title}</h2>
            <CopyOrb code={entry.source} name={entry.title} />
          </div>
          {entry.description && (
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-soft">
              {entry.description}
            </p>
          )}
          <div className="mt-6">{entry.render()}</div>
        </section>
      ))}
    </div>
  );
}
