import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { VeduteGrid, VeduteSummary, type Veduta } from "@/components/places/VeduteGrid";
import { sectionMetadata } from "@/lib/seo";

export const metadata = sectionMetadata("/places");

export default async function PlacesPage() {
  const places = await fetchQuery(api.places.list, {});
  const vedute: Veduta[] = places.map((p) => ({
    id: p._id,
    slug: p.slug,
    name: p.name,
    country: p.country,
    description: p.description,
    imageUrl: p.photoUrls?.[0] ?? null,
    visitedAt: p.visitedAt,
  }));

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Places</h1>
      <p className="mt-2 text-ink-soft">Views from the road, one plate per place.</p>
      {vedute.length === 0 ? (
        <p className="mt-8 text-ink-soft">No places logged yet.</p>
      ) : (
        <>
          <div className="mt-6">
            <VeduteSummary places={vedute} />
          </div>
          <div className="mt-10">
            <VeduteGrid places={vedute} />
          </div>
        </>
      )}
    </div>
  );
}
