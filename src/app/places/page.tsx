import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { JourneyTimeline } from "@/components/feed/JourneyTimeline";

export default async function PlacesPage() {
  const places = await fetchQuery(api.places.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Places</h1>
      <div className="mt-8">
        {places.length === 0 ? (
          <p className="text-ink-soft">No places logged yet.</p>
        ) : (
          <JourneyTimeline
            items={places.map((p) => ({
              type: "place" as const,
              id: p._id,
              slug: p.slug,
              title: p.country ? `${p.name}, ${p.country}` : p.name,
              date: p.visitedAt,
              excerpt: p.description,
              imageUrl: p.photoUrls?.[0],
            }))}
          />
        )}
      </div>
    </div>
  );
}
