import type { ComponentEntry } from "./registry";

export function ComponentsGrid({ entries }: { entries: ComponentEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.title} className="panel flex flex-col gap-3 p-4">
          <div>
            <p className="text-ink">{entry.title}</p>
            {entry.description && (
              <p className="text-sm text-ink-soft">{entry.description}</p>
            )}
          </div>
          <div className="flex items-center justify-center border border-border p-6">
            {entry.render()}
          </div>
        </div>
      ))}
    </div>
  );
}
