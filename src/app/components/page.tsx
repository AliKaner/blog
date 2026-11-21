import { readFileSync } from "node:fs";
import path from "node:path";
import { componentRegistry } from "@/components/components/registry";
import { ComponentsGrid } from "@/components/components/ComponentsGrid";
import { sectionMetadata } from "@/lib/seo";

export const metadata = sectionMetadata("/components");

/** Source handed out by each copy button: the component file itself, read
    from disk (at build time — this page has no dynamic data). */
function readSource(sourcePath: string): string {
  const root = process.cwd();
  const file = path.resolve(root, sourcePath);
  if (!file.startsWith(path.join(root, "src") + path.sep)) {
    throw new Error(`Component source must live under src/: ${sourcePath}`);
  }
  return readFileSync(file, "utf8");
}

export default function ComponentsPage() {
  const entries = componentRegistry.map((entry) => ({
    ...entry,
    source: readSource(entry.sourcePath),
  }));

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Components</h1>
      <p className="mt-2 text-sm text-ink-soft">
        UI pieces I&apos;ve built — hover the rosette to copy one.
      </p>
      <div className="mt-10">
        {entries.length === 0 ? (
          <p className="text-ink-soft">No components yet.</p>
        ) : (
          <ComponentsGrid entries={entries} />
        )}
      </div>
    </div>
  );
}
