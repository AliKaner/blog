import { componentRegistry } from "@/components/components/registry";
import { ComponentsGrid } from "@/components/components/ComponentsGrid";

export default function ComponentsPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Components</h1>
      <p className="mt-2 text-ink-soft">
        A showcase of UI components I&apos;ve built.
      </p>
      <div className="mt-8">
        {componentRegistry.length === 0 ? (
          <p className="text-ink-soft">No components yet.</p>
        ) : (
          <ComponentsGrid entries={componentRegistry} />
        )}
      </div>
    </div>
  );
}
