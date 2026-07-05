import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { formatDate } from "@/lib/format";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await fetchQuery(api.places.getBySlug, { slug });
  if (!place) notFound();

  return (
    <article>
      <div className="font-mono text-xs uppercase tracking-wide text-accent">
        Place · {formatDate(place.visitedAt)}
      </div>
      <h1 className="mt-1 font-heading text-3xl text-ink">
        {place.country ? `${place.name}, ${place.country}` : place.name}
      </h1>
      {place.photoUrls && place.photoUrls.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {place.photoUrls.map((url: string | null, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url ?? ""}
              alt=""
              className="h-40 w-56 rounded-sm border border-border object-cover"
            />
          ))}
        </div>
      )}
      {place.description && (
        <p className="mt-6 whitespace-pre-wrap text-ink">
          {place.description}
        </p>
      )}
    </article>
  );
}
