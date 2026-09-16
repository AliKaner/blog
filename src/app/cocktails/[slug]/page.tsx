import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";
import { ZoomableImage } from "@/components/ui/Lightbox";
import { CocktailGlassIcon } from "@/components/cocktails/CocktailGlassIcon";
import { RatingGlasses } from "@/components/cocktails/RatingGlasses";

export default async function CocktailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cocktail = await fetchQuery(api.cocktails.getBySlug, { slug });
  if (!cocktail) notFound();

  return (
    <article className="ticket overflow-hidden" style={{ "--tilt": "0deg" } as React.CSSProperties}>
      <div className="relative h-56 w-full bg-paper sm:h-72">
        {cocktail.imageUrl ? (
          <ZoomableImage
            src={cocktail.imageUrl}
            alt={cocktail.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CocktailGlassIcon className="h-14 w-14 text-border" />
          </div>
        )}
        {cocktail.baseSpirit && (
          <span className="absolute left-3 top-3 border border-accent-2 bg-paper/90 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-accent-2">
            {cocktail.baseSpirit}
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="font-mono text-xs uppercase tracking-wide text-accent">
          Cocktail · {formatDate(cocktail.triedAt)}
        </div>
        <h1 className="mt-1 font-heading text-3xl text-ink">
          {cocktail.title}
        </h1>
        {typeof cocktail.rating === "number" && (
          <div className="mt-3">
            <RatingGlasses rating={cocktail.rating} />
          </div>
        )}

        {cocktail.ingredients && cocktail.ingredients.length > 0 && (
          <div className="mt-6 border-t border-dashed border-border pt-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Recipe
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {cocktail.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-ink">
                  <span className="text-accent-2">›</span> {ing}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cocktail.review && (
          <div className="mt-6 border-t border-dashed border-border pt-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
              Tasting notes
            </p>
            <div className="prose-blog mt-2">
              <Markdown>{cocktail.review}</Markdown>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
