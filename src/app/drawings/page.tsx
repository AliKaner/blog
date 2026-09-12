import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { DrawingsMasonry } from "@/components/drawings/DrawingsMasonry";

export default async function DrawingsPage() {
  const drawings = await fetchQuery(api.drawings.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Drawings</h1>
      <p className="mt-2 text-ink-soft">A corner for my sketches.</p>
      <div className="mt-8">
        {drawings.length === 0 ? (
          <p className="text-ink-soft">No drawings yet.</p>
        ) : (
          <DrawingsMasonry drawings={drawings} />
        )}
      </div>
    </div>
  );
}
