import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { formatDate } from "@/lib/format";
import { ZoomableImage } from "@/components/ui/Lightbox";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await fetchQuery(api.places.getBySlug, { slug });
  if (!place) notFound();

  const photos = (place.photoUrls ?? []).filter((u: string | null): u is string => Boolean(u));
  const [lead, ...rest] = photos;

  return (
    <article className="max-w-4xl">
      <Link href="/places" className="font-accent text-sm italic text-ink-soft no-underline hover:text-accent">
        ← All places
      </Link>
      <h1 className="mt-3 font-heading text-3xl uppercase tracking-[0.08em] text-ink">{place.name}</h1>
      <p className="font-accent text-lg italic text-ink-soft">
        {[place.country, formatDate(place.visitedAt)].filter(Boolean).join(" · ")}
      </p>

      {lead && (
        <figure className="mt-8">
          <ZoomableImage src={lead} alt={place.name} className="frame frame-lg aspect-[3/2] w-full object-cover" />
        </figure>
      )}

      {place.description && (
        <p className="mt-8 max-w-prose whitespace-pre-wrap text-ink first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-5xl first-letter:leading-none first-letter:text-accent">
          {place.description}
        </p>
      )}

      {rest.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {rest.map((url, i) => (
            <figure key={i}>
              <ZoomableImage src={url} alt={`${place.name}, figure ${i + 2}`} className="frame frame-sm aspect-[3/2] w-full object-cover" />
              <figcaption className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Fig. {i + 2}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}
